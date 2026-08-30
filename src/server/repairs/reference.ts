import { randomBytes } from "node:crypto";

export function createRepairReference(now = new Date()): string {
    const year = now.getUTCFullYear();
    const suffix = randomBytes(5).toString("hex").toUpperCase();
    return `NEC-${year}-${suffix}`;
}
