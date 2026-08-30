import type { RepairType } from "@/types/housingRepair";
import type {
    RepairDeliveryStatus,
    RepairStatus,
} from "@/server/repairs/types";

export const repairTypeLabels: Record<RepairType, string> = {
    plumbing: "Plumbing",
    heating: "Heating",
    electrical: "Electrical",
    roof_or_ceiling: "Roof or ceiling",
    windows_or_doors: "Windows or doors",
    damp_or_mould: "Damp or mould",
    structural: "Structural",
    other: "Other",
};

export const repairStatusLabels: Record<RepairStatus, string> = {
    NEW: "New",
    ACKNOWLEDGED: "Acknowledged",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
};

export const deliveryStatusLabels: Record<RepairDeliveryStatus, string> = {
    PENDING: "Pending",
    SUCCEEDED: "Delivered",
    FAILED: "Needs attention",
};

export function formatCouncilDate(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}
