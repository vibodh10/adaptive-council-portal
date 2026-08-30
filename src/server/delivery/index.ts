import type { CouncilDeliveryAdapter } from "@/server/delivery/types";
import { westbridgeSandboxAdapter } from "@/server/delivery/sandbox";
import { createWebhookAdapter } from "@/server/delivery/webhook";
import { serviceError } from "@/server/security/serviceError";

export function getCouncilDeliveryAdapter(): CouncilDeliveryAdapter {
    const mode = process.env.COUNCIL_DELIVERY_MODE ?? "sandbox";

    if (mode === "sandbox") {
        return westbridgeSandboxAdapter;
    }

    if (mode === "webhook") {
        const endpoint = process.env.COUNCIL_WEBHOOK_URL?.trim();
        const secret = process.env.COUNCIL_WEBHOOK_SECRET?.trim();

        if (!endpoint || !secret) {
            throw serviceError(
                "DELIVERY_CONFIGURATION_INVALID",
                503,
                "The council delivery endpoint is not configured correctly.",
            );
        }

        return createWebhookAdapter({ endpoint, secret });
    }

    throw serviceError(
        "DELIVERY_CONFIGURATION_INVALID",
        503,
        "The council delivery mode is not supported.",
    );
}
