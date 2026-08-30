import type { AuthenticatedPrincipal } from "@/server/auth/session";
import { getCouncilDeliveryAdapter } from "@/server/delivery";
import type { CouncilDeliveryAdapter } from "@/server/delivery/types";
import { createRepairReference } from "@/server/repairs/reference";
import { drizzleRepairRepository } from "@/server/repairs/repository";
import type {
    RepairRepository,
    RepairStatus,
} from "@/server/repairs/types";
import {
    parseHousingRepairSubmission,
    parseIdempotencyKey,
} from "@/server/repairs/validation";
import {
    databaseRateLimiter,
    type RateLimiter,
} from "@/server/security/rateLimit";
import { serviceError } from "@/server/security/serviceError";
import {
    validateImageUploads,
    type UploadCandidate,
} from "@/server/storage/imageValidation";
import { s3AttachmentStorage } from "@/server/storage/s3Storage";
import type { PrivateAttachmentStorage } from "@/server/storage/storage";

export type RepairServiceDependencies = {
    repository: RepairRepository;
    storage: PrivateAttachmentStorage;
    rateLimiter: RateLimiter;
    deliveryAdapter: CouncilDeliveryAdapter;
    createReference: () => string;
};

function defaultDependencies(): RepairServiceDependencies {
    return {
        repository: drizzleRepairRepository,
        storage: s3AttachmentStorage,
        rateLimiter: databaseRateLimiter,
        deliveryAdapter: getCouncilDeliveryAdapter(),
        createReference: createRepairReference,
    };
}

export async function createHousingRepairCase(input: {
    principal: AuthenticatedPrincipal;
    payload: unknown;
    idempotencyKey: unknown;
    uploads: readonly UploadCandidate[];
    sourceAddress: string;
    dependencies?: RepairServiceDependencies;
}) {
    if (input.principal.role !== "RESIDENT") {
        throw serviceError(
            "FORBIDDEN",
            403,
            "Only a resident can submit a housing repair.",
        );
    }

    const dependencies = input.dependencies ?? defaultDependencies();
    const report = parseHousingRepairSubmission(input.payload);
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const images = validateImageUploads(input.uploads);

    await Promise.all([
        dependencies.rateLimiter.consume(
            `repair:resident:${input.principal.userId}`,
            { limit: 10, windowSeconds: 60 * 60 },
        ),
        dependencies.rateLimiter.consume(
            `repair:source:${input.sourceAddress}`,
            { limit: 30, windowSeconds: 60 * 60 },
        ),
    ]);

    const reservation = await dependencies.repository.reserveCase({
        principal: input.principal,
        report,
        idempotencyKey,
        reference: dependencies.createReference(),
    });

    if (!reservation.created) {
        return {
            ok: true as const,
            idempotentReplay: true,
            reference: reservation.repairCase.reference,
            caseId: reservation.repairCase.id,
            status: reservation.repairCase.status,
            deliveryStatus: reservation.repairCase.deliveryStatus,
        };
    }

    const storedAttachments = [];

    try {
        for (const image of images) {
            storedAttachments.push(
                await dependencies.storage.putRepairImage({
                    councilId: input.principal.councilId,
                    residentId: input.principal.userId,
                    caseId: reservation.repairCase.id,
                    image,
                }),
            );
        }

        await dependencies.repository.addAttachments({
            repairCase: reservation.repairCase,
            attachments: storedAttachments,
        });
    } catch (error) {
        await Promise.allSettled(
            storedAttachments.map((attachment) =>
                dependencies.storage.deleteObject(attachment.objectKey),
            ),
        );
        await dependencies.repository.deleteReservedCase({
            caseId: reservation.repairCase.id,
            councilId: reservation.repairCase.councilId,
            residentId: reservation.repairCase.residentId,
        });
        throw error;
    }

    let deliveryStatus: "SUCCEEDED" | "FAILED";

    try {
        const outcome = await dependencies.deliveryAdapter.deliver({
            ...report,
            reference: reservation.repairCase.reference,
            submittedAt: reservation.repairCase.submittedAt,
            attachmentCount: storedAttachments.length,
        });
        deliveryStatus = await dependencies.repository.recordDelivery({
            repairCase: reservation.repairCase,
            outcome,
            actorUserId: input.principal.userId,
        });
    } catch {
        deliveryStatus = await dependencies.repository.recordDelivery({
            repairCase: reservation.repairCase,
            outcome: {
                adapterType: dependencies.deliveryAdapter.adapterType,
                succeeded: false,
                safeMetadata: { failure: "delivery-adapter-unavailable" },
            },
            actorUserId: input.principal.userId,
        });
    }

    return {
        ok: true as const,
        idempotentReplay: false,
        reference: reservation.repairCase.reference,
        caseId: reservation.repairCase.id,
        status: reservation.repairCase.status,
        deliveryStatus,
    };
}

export async function listRepairCases(
    principal: AuthenticatedPrincipal,
    repository: RepairRepository = drizzleRepairRepository,
) {
    return repository.listCases(principal);
}

export async function getRepairCase(
    principal: AuthenticatedPrincipal,
    caseId: string,
    repository: RepairRepository = drizzleRepairRepository,
) {
    const repairCase = await repository.getCase(principal, caseId);

    if (!repairCase) {
        throw serviceError("NOT_FOUND", 404, "The repair case was not found.");
    }

    return repairCase;
}

export async function updateRepairStatus(input: {
    principal: AuthenticatedPrincipal;
    caseId: string;
    status: RepairStatus;
    repository?: RepairRepository;
}) {
    if (input.principal.role !== "STAFF") {
        throw serviceError(
            "FORBIDDEN",
            403,
            "Only council staff can update repair status.",
        );
    }

    const repairCase = await (
        input.repository ?? drizzleRepairRepository
    ).updateStatus({
        principal: input.principal,
        caseId: input.caseId,
        status: input.status,
    });

    if (!repairCase) {
        throw serviceError("NOT_FOUND", 404, "The repair case was not found.");
    }

    return repairCase;
}

export async function retryRepairDelivery(input: {
    principal: AuthenticatedPrincipal;
    caseId: string;
    repository?: RepairRepository;
    deliveryAdapter?: CouncilDeliveryAdapter;
    rateLimiter?: RateLimiter;
}) {
    if (input.principal.role !== "STAFF") {
        throw serviceError(
            "FORBIDDEN",
            403,
            "Only council staff can retry repair delivery.",
        );
    }

    const repository = input.repository ?? drizzleRepairRepository;
    const repairCase = await getRepairCase(
        input.principal,
        input.caseId,
        repository,
    );

    if (repairCase.deliveryStatus !== "FAILED") {
        throw serviceError(
            "CONFLICT",
            409,
            "Only a failed delivery can be retried.",
        );
    }

    await (input.rateLimiter ?? databaseRateLimiter).consume(
        `delivery-retry:${input.principal.userId}`,
        { limit: 20, windowSeconds: 60 * 60 },
    );
    const outcome = await (
        input.deliveryAdapter ?? getCouncilDeliveryAdapter()
    ).deliver({
        address: repairCase.address,
        repairType: repairCase.repairType,
        issueDescription: repairCase.issueDescription,
        whenProblemStarted: repairCase.whenProblemStarted,
        isGettingWorse: repairCase.isGettingWorse,
        immediateDanger: repairCase.immediateDanger,
        accessNotes: repairCase.accessNotes,
        additionalNotes: repairCase.additionalNotes,
        reference: repairCase.reference,
        submittedAt: repairCase.createdAt,
        attachmentCount: repairCase.attachments.length,
    });
    const deliveryStatus = await repository.recordDelivery({
        repairCase: {
            id: repairCase.id,
            councilId: input.principal.councilId,
        },
        outcome,
        actorUserId: input.principal.userId,
    });

    return { ok: true as const, deliveryStatus };
}
