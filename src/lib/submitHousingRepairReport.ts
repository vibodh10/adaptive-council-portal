import {
    REPAIR_TYPES,
    type HousingRepairReport,
    type RepairType,
} from "@/types/housingRepair";

export type HousingRepairSubmissionResult = {
    success: true;
    reference: string;
    submittedAt: string;
};

function isRepairType(value: unknown): value is RepairType {
    return REPAIR_TYPES.includes(value as RepairType);
}

export function validateHousingRepairReport(
    report: HousingRepairReport,
): void {
    if (typeof report.address !== "string" || !report.address.trim()) {
        throw new Error("Address is required");
    }

    if (!isRepairType(report.repairType)) {
        throw new Error("Select a valid repair type");
    }

    if (
        typeof report.issueDescription !== "string" ||
        !report.issueDescription.trim()
    ) {
        throw new Error("Issue description is required");
    }

    if (
        typeof report.whenProblemStarted !== "string" ||
        !report.whenProblemStarted.trim()
    ) {
        throw new Error("The date the problem started is required");
    }

    const problemStartDate = new Date(
        `${report.whenProblemStarted}T00:00:00`,
    );

    if (Number.isNaN(problemStartDate.getTime())) {
        throw new Error("Enter a valid date for when the problem started");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (problemStartDate > today) {
        throw new Error("The date the problem started cannot be in the future");
    }

    if (typeof report.isGettingWorse !== "boolean") {
        throw new Error("Select whether the problem is getting worse");
    }

    if (typeof report.immediateDanger !== "boolean") {
        throw new Error("Select whether there is an immediate danger");
    }
}

export function submitHousingRepairReport(
    report: HousingRepairReport,
): HousingRepairSubmissionResult {
    validateHousingRepairReport(report);

    const reference = `REP-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    return {
        success: true,
        reference,
        submittedAt: new Date().toISOString(),
    };
}
