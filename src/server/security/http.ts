import { ServiceError } from "@/server/security/serviceError";

export type ErrorResponseBody = {
    ok: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
};

export function jsonError(error: unknown): Response {
    if (error instanceof ServiceError) {
        return Response.json(
            {
                ok: false,
                error: {
                    code: error.code,
                    message: error.message,
                    ...(error.details ? { details: error.details } : {}),
                },
            } satisfies ErrorResponseBody,
            {
                status: error.status,
                headers:
                    error.code === "RATE_LIMITED"
                        ? {
                              "Retry-After": String(
                                  error.details?.retryAfterSeconds ?? 60,
                              ),
                          }
                        : undefined,
            },
        );
    }

    return Response.json(
        {
            ok: false,
            error: {
                code: "INTERNAL_ERROR",
                message:
                    "The service is temporarily unavailable. Please try again.",
            },
        } satisfies ErrorResponseBody,
        { status: 503 },
    );
}

export function requireSameOrigin(request: Request): void {
    const origin = request.headers.get("origin");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");

    if (!origin || !host) {
        throw new ServiceError(
            "FORBIDDEN",
            403,
            "The request origin could not be verified.",
        );
    }

    let originHost: string;

    try {
        originHost = new URL(origin).host;
    } catch {
        throw new ServiceError(
            "FORBIDDEN",
            403,
            "The request origin is invalid.",
        );
    }

    if (originHost.toLowerCase() !== host.toLowerCase()) {
        throw new ServiceError(
            "FORBIDDEN",
            403,
            "Cross-site requests are not permitted.",
        );
    }
}

export function getTrustedSourceAddress(request: Request): string {
    return (
        request.headers.get("x-real-ip")?.trim() ||
        "source-address-unavailable"
    );
}
