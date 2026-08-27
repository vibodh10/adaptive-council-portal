import type { MissedBinReport } from "@/types/missedBin";

export type MissedBinSubmissionResult = {
    success: true;
    reference: string;
    submittedAt: string;
};

export function submitMissedBinReport(
    report: MissedBinReport
): MissedBinSubmissionResult {
    if (!report.address.trim()) {
        throw new Error("Address is required");
    }

    if (!report.expectedCollectionDate.trim()) {
        throw new Error("Expected collection date is required");
    }

    const selectedDate = new Date(
        `${report.expectedCollectionDate}T00:00:00`,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
        throw new Error("Expected collection date cannot be in the future");
    }

    const reference = `BIN-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    return {
        success: true,
        reference,
        submittedAt: new Date().toISOString(),
    }
}