import { requirePrincipal } from "@/server/auth/session";
import { retryRepairDelivery } from "@/server/repairs/service";
import { jsonError, requireSameOrigin } from "@/server/security/http";

export async function POST(
    request: Request,
    context: RouteContext<"/api/staff/repairs/[id]/retry-delivery">,
) {
    try {
        requireSameOrigin(request);
        const principal = await requirePrincipal(["STAFF"], request.headers);
        const { id } = await context.params;
        const result = await retryRepairDelivery({
            principal,
            caseId: id,
        });

        return Response.json(result, {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (error) {
        return jsonError(error);
    }
}
