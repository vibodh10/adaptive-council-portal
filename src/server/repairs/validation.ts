import { z } from "zod";

import {
    getHousingRepairValidationIssues,
} from "@/lib/submitHousingRepairReport";
import { REPAIR_TYPES, type HousingRepairReport } from "@/types/housingRepair";
import { serviceError } from "@/server/security/serviceError";

export const housingRepairSubmissionSchema = z
    .strictObject({
        address: z.string().trim().min(1).max(500),
        repairType: z.enum(REPAIR_TYPES),
        issueDescription: z.string().trim().min(10).max(5_000),
        whenProblemStarted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        isGettingWorse: z.boolean(),
        immediateDanger: z.boolean(),
        accessNotes: z.string().trim().max(2_000).optional().default(""),
        additionalNotes: z.string().trim().max(2_000).optional().default(""),
    })
    .superRefine((report, context) => {
        for (const issue of getHousingRepairValidationIssues(report)) {
            context.addIssue({
                code: "custom",
                path: [issue.field],
                message: issue.message,
            });
        }
    });

export function parseHousingRepairSubmission(
    input: unknown,
): HousingRepairReport {
    const parsed = housingRepairSubmissionSchema.safeParse(input);

    if (!parsed.success) {
        const fields = parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        throw serviceError(
            "INVALID_INPUT",
            400,
            "Check the repair details and try again.",
            { fields },
        );
    }

    return parsed.data;
}

export function parseIdempotencyKey(value: unknown): string {
    const parsed = z.uuid().safeParse(value);

    if (!parsed.success) {
        throw serviceError(
            "INVALID_INPUT",
            400,
            "A valid idempotency key is required.",
        );
    }

    return parsed.data;
}
