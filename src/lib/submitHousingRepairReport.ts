import {
    REPAIR_TYPES,
    type HousingRepairReport,
    type RepairType,
} from "@/types/housingRepair";

export const REQUIRED_HOUSING_REPAIR_FIELDS = [
    "address",
    "repairType",
    "issueDescription",
    "whenProblemStarted",
    "isGettingWorse",
    "immediateDanger",
] as const;

export type RequiredHousingRepairField =
    (typeof REQUIRED_HOUSING_REPAIR_FIELDS)[number];

export type HousingRepairValidationIssue = {
    field: keyof HousingRepairReport;
    code: "required" | "invalid" | "future_date" | "unanswered";
    message: string;
};

export type HousingRepairSubmissionResult = {
    success: true;
};

export function isRepairType(value: unknown): value is RepairType {
    return REPAIR_TYPES.includes(value as RepairType);
}

function parseIsoDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
}

export function getHousingRepairValidationIssues(
    report: HousingRepairReport,
): HousingRepairValidationIssue[] {
    const issues: HousingRepairValidationIssue[] = [];

    if (typeof report.address !== "string" || !report.address.trim()) {
        issues.push({
            field: "address",
            code: "required",
            message: "Address is required",
        });
    }

    if (report.repairType === null) {
        issues.push({
            field: "repairType",
            code: "required",
            message: "Repair type is required",
        });
    } else if (!isRepairType(report.repairType)) {
        issues.push({
            field: "repairType",
            code: "invalid",
            message: "Select a valid repair type",
        });
    }

    if (
        typeof report.issueDescription !== "string" ||
        !report.issueDescription.trim()
    ) {
        issues.push({
            field: "issueDescription",
            code: "required",
            message: "Issue description is required",
        });
    }

    if (
        typeof report.whenProblemStarted !== "string" ||
        !report.whenProblemStarted.trim()
    ) {
        issues.push({
            field: "whenProblemStarted",
            code: "required",
            message: "The date the problem started is required",
        });
    } else {
        const problemStartDate = parseIsoDate(report.whenProblemStarted);

        if (!problemStartDate) {
            issues.push({
                field: "whenProblemStarted",
                code: "invalid",
                message: "Enter a valid date for when the problem started",
            });
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (problemStartDate > today) {
                issues.push({
                    field: "whenProblemStarted",
                    code: "future_date",
                    message:
                        "The date the problem started cannot be in the future",
                });
            }
        }
    }

    if (typeof report.isGettingWorse !== "boolean") {
        issues.push({
            field: "isGettingWorse",
            code:
                report.isGettingWorse === null ? "unanswered" : "invalid",
            message: "Select whether the problem is getting worse",
        });
    }

    if (typeof report.immediateDanger !== "boolean") {
        issues.push({
            field: "immediateDanger",
            code:
                report.immediateDanger === null ? "unanswered" : "invalid",
            message: "Select whether there is an immediate danger",
        });
    }

    if (
        report.accessNotes !== undefined &&
        typeof report.accessNotes !== "string"
    ) {
        issues.push({
            field: "accessNotes",
            code: "invalid",
            message: "Access notes must be text",
        });
    }

    if (
        report.additionalNotes !== undefined &&
        typeof report.additionalNotes !== "string"
    ) {
        issues.push({
            field: "additionalNotes",
            code: "invalid",
            message: "Additional notes must be text",
        });
    }

    return issues;
}

export function getMissingRequiredHousingRepairFields(
    report: HousingRepairReport,
): RequiredHousingRepairField[] {
    return getHousingRepairValidationIssues(report)
        .filter(
            (issue) =>
                issue.code === "required" || issue.code === "unanswered",
        )
        .map((issue) => issue.field)
        .filter(
            (field): field is RequiredHousingRepairField =>
                REQUIRED_HOUSING_REPAIR_FIELDS.includes(
                    field as RequiredHousingRepairField,
                ),
        );
}

export function validateHousingRepairReport(
    report: HousingRepairReport,
): void {
    const [firstIssue] = getHousingRepairValidationIssues(report);

    if (firstIssue) {
        throw new Error(firstIssue.message);
    }
}

export function submitHousingRepairReport(
    report: HousingRepairReport,
): HousingRepairSubmissionResult {
    validateHousingRepairReport(report);

    return {
        success: true,
    };
}
