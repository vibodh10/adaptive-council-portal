import {
    getHousingRepairValidationIssues,
    getMissingRequiredHousingRepairFields,
    isRepairType,
} from "@/lib/submitHousingRepairReport";
import {
    INFORMATION_DENSITIES,
    JOURNEY_MODES,
    LANGUAGE_MODES,
    MOTION_PREFERENCES,
    TARGET_SIZES,
    TEXT_SIZES,
    type ExperiencePreferences,
} from "@/types/experience";
import type { HousingRepairReport } from "@/types/housingRepair";

export type ExperiencePreferencesPatch = Partial<ExperiencePreferences>;
export type HousingRepairDraftPatch = Partial<HousingRepairReport>;

type ValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; message: string };

const experiencePreferenceValues = {
    textSize: TEXT_SIZES,
    informationDensity: INFORMATION_DENSITIES,
    languageMode: LANGUAGE_MODES,
    journeyMode: JOURNEY_MODES,
    targetSize: TARGET_SIZES,
    motion: MOTION_PREFERENCES,
} as const;

const housingRepairDraftFields = [
    "address",
    "repairType",
    "issueDescription",
    "whenProblemStarted",
    "isGettingWorse",
    "immediateDanger",
    "accessNotes",
    "additionalNotes",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includesValue(
    allowedValues: readonly string[],
    value: unknown,
): value is string {
    return typeof value === "string" && allowedValues.includes(value);
}

export function validateExperiencePreferencesPatch(
    input: unknown,
): ValidationResult<ExperiencePreferencesPatch> {
    if (!isRecord(input)) {
        return { ok: false, message: "Preference updates must be an object." };
    }

    const allowedFields = Object.keys(experiencePreferenceValues);
    const unsupportedField = Object.keys(input).find(
        (field) => !allowedFields.includes(field),
    );

    if (unsupportedField) {
        return {
            ok: false,
            message: `Unsupported preference field: ${unsupportedField}.`,
        };
    }

    for (const [field, value] of Object.entries(input)) {
        const allowedValues =
            experiencePreferenceValues[
                field as keyof typeof experiencePreferenceValues
            ];

        if (!includesValue(allowedValues, value)) {
            return {
                ok: false,
                message: `Unsupported value for ${field}.`,
            };
        }
    }

    return { ok: true, value: input as ExperiencePreferencesPatch };
}

export function applyExperiencePreferencesPatch(
    preferences: ExperiencePreferences,
    patch: ExperiencePreferencesPatch,
): ExperiencePreferences {
    return { ...preferences, ...patch };
}

export function validateHousingRepairDraftPatch(
    input: unknown,
    currentReport: HousingRepairReport,
): ValidationResult<HousingRepairDraftPatch> {
    if (!isRecord(input)) {
        return { ok: false, message: "Draft updates must be an object." };
    }

    const unsupportedField = Object.keys(input).find(
        (field) =>
            !housingRepairDraftFields.includes(
                field as (typeof housingRepairDraftFields)[number],
            ),
    );

    if (unsupportedField) {
        return {
            ok: false,
            message: `Unsupported housing repair field: ${unsupportedField}.`,
        };
    }

    if (Object.keys(input).length === 0) {
        return { ok: false, message: "Supply at least one field to update." };
    }

    const textFields = [
        "address",
        "issueDescription",
        "accessNotes",
        "additionalNotes",
    ] as const;

    for (const field of textFields) {
        if (field in input && typeof input[field] !== "string") {
            return { ok: false, message: `${field} must be text.` };
        }
    }

    if ("repairType" in input && !isRepairType(input.repairType)) {
        return { ok: false, message: "Select a valid repair type." };
    }

    for (const field of ["isGettingWorse", "immediateDanger"] as const) {
        if (field in input && typeof input[field] !== "boolean") {
            return { ok: false, message: `${field} must be true or false.` };
        }
    }

    if (
        "whenProblemStarted" in input &&
        typeof input.whenProblemStarted !== "string"
    ) {
        return {
            ok: false,
            message: "whenProblemStarted must be a date in YYYY-MM-DD format.",
        };
    }

    const patch = input as HousingRepairDraftPatch;
    const candidateReport = { ...currentReport, ...patch };

    if ("whenProblemStarted" in input) {
        const dateIssue = getHousingRepairValidationIssues(candidateReport).find(
            (issue) => issue.field === "whenProblemStarted",
        );

        if (dateIssue) {
            return { ok: false, message: dateIssue.message };
        }
    }

    return { ok: true, value: patch };
}

export function applyHousingRepairDraftPatch(
    report: HousingRepairReport,
    patch: HousingRepairDraftPatch,
): HousingRepairReport {
    return { ...report, ...patch };
}

export function analyseHousingRepairDraft(report: HousingRepairReport) {
    const validationIssues = getHousingRepairValidationIssues(report);

    return {
        draft: { ...report },
        missingRequiredFields: getMissingRequiredHousingRepairFields(report),
        validationIssues,
        readyForReview: validationIssues.length === 0,
        immediateDanger: report.immediateDanger === true,
    };
}
