import { toNextJsHandler } from "better-auth/next-js";

import { auth, isAuthConfigured } from "@/server/auth/auth";
import { getTrustedSourceAddress, jsonError } from "@/server/security/http";
import { databaseRateLimiter } from "@/server/security/rateLimit";

const handlers = toNextJsHandler(auth);

function unavailableResponse() {
    return Response.json(
        {
            ok: false,
            error: {
                code: "AUTH_NOT_CONFIGURED",
                message: "Authentication is temporarily unavailable.",
            },
        },
        { status: 503 },
    );
}

export async function GET(request: Request) {
    return isAuthConfigured()
        ? handlers.GET(request)
        : unavailableResponse();
}

export async function POST(request: Request) {
    if (!isAuthConfigured()) {
        return unavailableResponse();
    }

    try {
        if (new URL(request.url).pathname.endsWith("/sign-in/email")) {
            const body = (await request.clone().json()) as { email?: unknown };
            const email =
                typeof body.email === "string"
                    ? body.email.trim().toLowerCase().slice(0, 320)
                    : "invalid-identifier";
            const source = getTrustedSourceAddress(request);

            await Promise.all([
                databaseRateLimiter.consume(`login:identifier:${email}`, {
                    limit: 12,
                    windowSeconds: 60 * 15,
                }),
                databaseRateLimiter.consume(`login:source:${source}`, {
                    limit: 30,
                    windowSeconds: 60 * 15,
                }),
            ]);
        }

        return handlers.POST(request);
    } catch (error) {
        return jsonError(error);
    }
}
