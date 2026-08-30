import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
    attachments,
    auditEvents,
    deliveryAttempts,
    repairCases,
    user,
} from "@/server/db/schema";
import type {
    AuditEventSummary,
    DeliveryAttemptSummary,
    RepairAttachmentSummary,
    RepairCaseDetail,
    RepairCaseSummary,
    RepairRepository,
    ReservedCase,
} from "@/server/repairs/types";

function toSummary(record: typeof repairCases.$inferSelect): RepairCaseSummary {
    return {
        id: record.id,
        reference: record.reference,
        repairType: record.repairType,
        address: record.address,
        immediateDanger: record.immediateDanger,
        status: record.status,
        deliveryStatus: record.deliveryStatus,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function toReserved(record: typeof repairCases.$inferSelect): ReservedCase {
    return {
        ...toSummary(record),
        councilId: record.councilId,
        residentId: record.residentId,
        issueDescription: record.issueDescription,
        whenProblemStarted: record.whenProblemStarted,
        isGettingWorse: record.isGettingWorse,
        accessNotes: record.accessNotes ?? "",
        additionalNotes: record.additionalNotes ?? "",
        submittedAt: record.createdAt.toISOString(),
    };
}

async function getCaseRecord(
    database: typeof db,
    principal: Parameters<RepairRepository["getCase"]>[0],
    caseId: string,
) {
    const ownershipCondition =
        principal.role === "RESIDENT"
            ? eq(repairCases.residentId, principal.userId)
            : sql`true`;

    const [row] = await database
        .select({ repairCase: repairCases, residentName: user.name })
        .from(repairCases)
        .innerJoin(user, eq(user.id, repairCases.residentId))
        .where(
            and(
                eq(repairCases.id, caseId),
                eq(repairCases.councilId, principal.councilId),
                ownershipCondition,
            ),
        )
        .limit(1);

    return row ?? null;
}

export function createDrizzleRepairRepository(
    database: typeof db = db,
): RepairRepository {
    return {
    async reserveCase(input) {
        return database.transaction(async (transaction) => {
            const [inserted] = await transaction
                .insert(repairCases)
                .values({
                    councilId: input.principal.councilId,
                    residentId: input.principal.userId,
                    reference: input.reference,
                    idempotencyKey: input.idempotencyKey,
                    address: input.report.address,
                    repairType: input.report.repairType!,
                    issueDescription: input.report.issueDescription,
                    whenProblemStarted: input.report.whenProblemStarted,
                    isGettingWorse: input.report.isGettingWorse!,
                    immediateDanger: input.report.immediateDanger!,
                    accessNotes: input.report.accessNotes ?? "",
                    additionalNotes: input.report.additionalNotes ?? "",
                })
                .onConflictDoNothing({
                    target: [
                        repairCases.residentId,
                        repairCases.idempotencyKey,
                    ],
                })
                .returning();

            if (inserted) {
                await transaction.insert(auditEvents).values({
                    councilId: input.principal.councilId,
                    actorUserId: input.principal.userId,
                    caseId: inserted.id,
                    action: "REPAIR_CASE_CREATED",
                    metadata: { status: "NEW" },
                });

                return { repairCase: toReserved(inserted), created: true };
            }

            const [existing] = await transaction
                .select()
                .from(repairCases)
                .where(
                    and(
                        eq(repairCases.councilId, input.principal.councilId),
                        eq(repairCases.residentId, input.principal.userId),
                        eq(repairCases.idempotencyKey, input.idempotencyKey),
                    ),
                )
                .limit(1);

            if (!existing) {
                throw new Error("Idempotent case reservation failed.");
            }

            return { repairCase: toReserved(existing), created: false };
        });
    },

    async deleteReservedCase(input) {
        await database
            .delete(repairCases)
            .where(
                and(
                    eq(repairCases.id, input.caseId),
                    eq(repairCases.councilId, input.councilId),
                    eq(repairCases.residentId, input.residentId),
                    eq(repairCases.deliveryStatus, "PENDING"),
                ),
            );
    },

    async addAttachments(input) {
        if (input.attachments.length === 0) {
            return;
        }

        await database.insert(attachments).values(
            input.attachments.map((attachment) => ({
                caseId: input.repairCase.id,
                councilId: input.repairCase.councilId,
                residentId: input.repairCase.residentId,
                objectKey: attachment.objectKey,
                originalFilename: attachment.originalFilename,
                mimeType: attachment.mimeType,
                size: attachment.size,
            })),
        );
    },

    async recordDelivery(input) {
        return database.transaction(async (transaction) => {
            const [{ count }] = await transaction
                .select({ count: sql<number>`count(*)::int` })
                .from(deliveryAttempts)
                .where(eq(deliveryAttempts.caseId, input.repairCase.id));
            const status = input.outcome.succeeded ? "SUCCEEDED" : "FAILED";

            await transaction.insert(deliveryAttempts).values({
                caseId: input.repairCase.id,
                adapterType: input.outcome.adapterType,
                status,
                safeResponseMetadata: input.outcome.safeMetadata,
                attemptNumber: count + 1,
            });
            await transaction
                .update(repairCases)
                .set({ deliveryStatus: status, updatedAt: new Date() })
                .where(
                    and(
                        eq(repairCases.id, input.repairCase.id),
                        eq(
                            repairCases.councilId,
                            input.repairCase.councilId,
                        ),
                    ),
                );
            await transaction.insert(auditEvents).values({
                councilId: input.repairCase.councilId,
                actorUserId: input.actorUserId,
                caseId: input.repairCase.id,
                action: input.outcome.succeeded
                    ? "COUNCIL_DELIVERY_SUCCEEDED"
                    : "COUNCIL_DELIVERY_FAILED",
                metadata: { adapterType: input.outcome.adapterType },
            });

            return status;
        });
    },

    async listCases(principal) {
        const ownershipCondition =
            principal.role === "RESIDENT"
                ? eq(repairCases.residentId, principal.userId)
                : sql`true`;
        const records = await database
            .select()
            .from(repairCases)
            .where(
                and(
                    eq(repairCases.councilId, principal.councilId),
                    ownershipCondition,
                ),
            )
            .orderBy(desc(repairCases.createdAt));
        return records.map(toSummary);
    },

    async getCase(principal, caseId) {
        const row = await getCaseRecord(database, principal, caseId);

        if (!row) {
            return null;
        }

        const attachmentRows = await database
            .select()
            .from(attachments)
            .where(eq(attachments.caseId, caseId))
            .orderBy(asc(attachments.createdAt));
        const attachmentSummaries: RepairAttachmentSummary[] = attachmentRows.map(
            (attachment) => ({
                id: attachment.id,
                caseId: attachment.caseId,
                originalFilename: attachment.originalFilename,
                mimeType: attachment.mimeType,
                size: attachment.size,
                createdAt: attachment.createdAt.toISOString(),
            }),
        );
        const detail: RepairCaseDetail = {
            ...toSummary(row.repairCase),
            address: row.repairCase.address,
            repairType: row.repairCase.repairType,
            issueDescription: row.repairCase.issueDescription,
            whenProblemStarted: row.repairCase.whenProblemStarted,
            isGettingWorse: row.repairCase.isGettingWorse,
            immediateDanger: row.repairCase.immediateDanger,
            accessNotes: row.repairCase.accessNotes ?? "",
            additionalNotes: row.repairCase.additionalNotes ?? "",
            attachments: attachmentSummaries,
        };

        if (principal.role === "STAFF") {
            const [attemptRows, eventRows] = await Promise.all([
                database
                    .select()
                    .from(deliveryAttempts)
                    .where(eq(deliveryAttempts.caseId, caseId))
                    .orderBy(desc(deliveryAttempts.createdAt)),
                database
                    .select()
                    .from(auditEvents)
                    .where(eq(auditEvents.caseId, caseId))
                    .orderBy(desc(auditEvents.createdAt)),
            ]);

            detail.residentDisplayName = row.residentName;
            detail.deliveryAttempts = attemptRows.map(
                (attempt): DeliveryAttemptSummary => ({
                    id: attempt.id,
                    adapterType: attempt.adapterType,
                    status: attempt.status,
                    attemptNumber: attempt.attemptNumber,
                    safeResponseMetadata: attempt.safeResponseMetadata,
                    createdAt: attempt.createdAt.toISOString(),
                }),
            );
            detail.auditEvents = eventRows.map(
                (event): AuditEventSummary => ({
                    id: event.id,
                    action: event.action,
                    metadata: event.metadata,
                    createdAt: event.createdAt.toISOString(),
                }),
            );
        }

        return detail;
    },

    async updateStatus(input) {
        const [updated] = await database.transaction(async (transaction) => {
            const records = await transaction
                .update(repairCases)
                .set({ status: input.status, updatedAt: new Date() })
                .where(
                    and(
                        eq(repairCases.id, input.caseId),
                        eq(repairCases.councilId, input.principal.councilId),
                    ),
                )
                .returning();

            if (records[0]) {
                await transaction.insert(auditEvents).values({
                    councilId: input.principal.councilId,
                    actorUserId: input.principal.userId,
                    caseId: input.caseId,
                    action: "REPAIR_STATUS_CHANGED",
                    metadata: { status: input.status },
                });
            }

            return records;
        });

        return updated
            ? this.getCase(input.principal, input.caseId)
            : null;
    },

    async getAttachment(input) {
        const ownershipCondition =
            input.principal.role === "RESIDENT"
                ? eq(attachments.residentId, input.principal.userId)
                : sql`true`;
        const [attachment] = await database
            .select()
            .from(attachments)
            .where(
                and(
                    eq(attachments.id, input.attachmentId),
                    eq(attachments.caseId, input.caseId),
                    eq(attachments.councilId, input.principal.councilId),
                    ownershipCondition,
                ),
            )
            .limit(1);

        return attachment
            ? {
                  id: attachment.id,
                  caseId: attachment.caseId,
                  originalFilename: attachment.originalFilename,
                  mimeType: attachment.mimeType,
                  size: attachment.size,
                  createdAt: attachment.createdAt.toISOString(),
                  objectKey: attachment.objectKey,
              }
            : null;
    },
    };
}

export const drizzleRepairRepository = createDrizzleRepairRepository();
