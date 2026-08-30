import { z } from "zod";

import { requirePrincipal } from "@/server/auth/session";
import { REPAIR_STATUSES } from "@/server/repairs/types";
import { updateRepairStatus } from "@/server/repairs/service";
import {
    getTrustedSourceAddress,
    jsonError,
    requireSameOrigin,
} from "@/server/security/http";
import { databaseRateLimiter } from "@/server/security/rateLimit";
import { serviceError } from "@/server/security/serviceError";

const statusSchema = z.strictObject({ status: z.enum(REPAIR_STATUSES) });

export async function PATCH(
    request: Request,
    context: RouteContext<"/api/staff/repairs/[id]/status">,
) {
    try {
        requireSameOrigin(request);
        const principal = await requirePrincipal(["STAFF"], request.headers);
        const { id } = await context.params;
        const payload = statusSchema.safeParse(await request.json());

        if (!payload.success) {
            throw serviceError(
                "INVALID_INPUT",
                400,
                "Select a valid repair status.",
            );
        }

        await databaseRateLimiter.consume(
            `staff-mutation:${principal.userId}:${getTrustedSourceAddress(request)}`,
            { limit: 60, windowSeconds: 60 * 60 },
        );
        const repairCase = await updateRepairStatus({
            principal,
            caseId: id,
            status: payload.data.status,
        });

        return Response.json(
            { ok: true, repairCase },
            { headers: { "Cache-Control": "private, no-store" } },
        );
    } catch (error) {
        return jsonError(error);
    }
}
