import { requirePrincipal } from "@/server/auth/session";
import { getRepairCase } from "@/server/repairs/service";
import { jsonError } from "@/server/security/http";

export async function GET(
    request: Request,
    context: RouteContext<"/api/repairs/[id]">,
) {
    try {
        const principal = await requirePrincipal(
            ["RESIDENT", "STAFF"],
            request.headers,
        );
        const { id } = await context.params;
        const repairCase = await getRepairCase(principal, id);

        return Response.json(
            { ok: true, repairCase },
            { headers: { "Cache-Control": "private, no-store" } },
        );
    } catch (error) {
        return jsonError(error);
    }
}
