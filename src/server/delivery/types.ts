import type { HousingRepairReport } from "@/types/housingRepair";

export type DeliveryCase = HousingRepairReport & {
    reference: string;
    submittedAt: string;
    attachmentCount: number;
};

export type DeliveryOutcome = {
    adapterType: "SANDBOX" | "WEBHOOK";
    succeeded: boolean;
    safeMetadata: Record<string, string | number | boolean | null>;
};

export interface CouncilDeliveryAdapter {
    readonly adapterType: DeliveryOutcome["adapterType"];
    deliver(repairCase: DeliveryCase): Promise<DeliveryOutcome>;
}
