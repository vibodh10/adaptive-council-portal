export const REPAIR_TYPES = [
    "plumbing",
    "heating",
    "electrical",
    "roof_or_ceiling",
    "windows_or_doors",
    "damp_or_mould",
    "structural",
    "other",
] as const;

export type RepairType = (typeof REPAIR_TYPES)[number];

export type HousingRepairReport = {
    address: string;
    repairType: RepairType | null;
    issueDescription: string;
    whenProblemStarted: string;
    isGettingWorse: boolean | null;
    immediateDanger: boolean | null;
    accessNotes?: string;
    additionalNotes?: string;
};
