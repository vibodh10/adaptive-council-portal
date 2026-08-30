import type { HousingRepairReport } from "@/types/housingRepair";
import type { AuthenticatedPrincipal } from "@/server/auth/session";
import type { DeliveryOutcome } from "@/server/delivery/types";
import type { StoredAttachment } from "@/server/storage/storage";

export const REPAIR_STATUSES = [
    "NEW",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "RESOLVED",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];
export type RepairDeliveryStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export type RepairCaseSummary = {
    id: string;
    reference: string;
    repairType: HousingRepairReport["repairType"];
    address: string;
    immediateDanger: boolean;
    status: RepairStatus;
    deliveryStatus: RepairDeliveryStatus;
    createdAt: string;
    updatedAt: string;
};

export type RepairAttachmentSummary = {
    id: string;
    caseId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    createdAt: string;
};

export type DeliveryAttemptSummary = {
    id: string;
    adapterType: "SANDBOX" | "WEBHOOK";
    status: "SUCCEEDED" | "FAILED";
    attemptNumber: number;
    safeResponseMetadata: Record<string, string | number | boolean | null>;
    createdAt: string;
};

export type AuditEventSummary = {
    id: string;
    action: string;
    metadata: Record<string, string | number | boolean | null>;
    createdAt: string;
};

export type RepairCaseDetail = RepairCaseSummary &
    HousingRepairReport & {
        residentDisplayName?: string;
        attachments: RepairAttachmentSummary[];
        deliveryAttempts?: DeliveryAttemptSummary[];
        auditEvents?: AuditEventSummary[];
    };

export type ReservedCase = RepairCaseSummary &
    HousingRepairReport & {
        councilId: string;
        residentId: string;
        submittedAt: string;
    };

export type ReserveCaseInput = {
    principal: AuthenticatedPrincipal;
    report: HousingRepairReport;
    idempotencyKey: string;
    reference: string;
};

export interface RepairRepository {
    reserveCase(
        input: ReserveCaseInput,
    ): Promise<{ repairCase: ReservedCase; created: boolean }>;
    deleteReservedCase(input: {
        caseId: string;
        councilId: string;
        residentId: string;
    }): Promise<void>;
    addAttachments(input: {
        repairCase: ReservedCase;
        attachments: readonly StoredAttachment[];
    }): Promise<void>;
    recordDelivery(input: {
        repairCase: Pick<ReservedCase, "id" | "councilId">;
        outcome: DeliveryOutcome;
        actorUserId: string;
    }): Promise<Exclude<RepairDeliveryStatus, "PENDING">>;
    listCases(principal: AuthenticatedPrincipal): Promise<RepairCaseSummary[]>;
    getCase(
        principal: AuthenticatedPrincipal,
        caseId: string,
    ): Promise<RepairCaseDetail | null>;
    updateStatus(input: {
        principal: AuthenticatedPrincipal;
        caseId: string;
        status: RepairStatus;
    }): Promise<RepairCaseDetail | null>;
    getAttachment(input: {
        principal: AuthenticatedPrincipal;
        caseId: string;
        attachmentId: string;
    }): Promise<
        | (RepairAttachmentSummary & {
              objectKey: string;
          })
        | null
    >;
}
