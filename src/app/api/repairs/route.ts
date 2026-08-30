import {
    getAuthenticatedPrincipal,
    requirePrincipal,
} from "@/server/auth/session";
import {
    createHousingRepairCase,
    listRepairCases,
} from "@/server/repairs/service";
import {
    getTrustedSourceAddress,
    jsonError,
    requireSameOrigin,
} from "@/server/security/http";
import { serviceError } from "@/server/security/serviceError";
import { databaseRateLimiter } from "@/server/security/rateLimit";
import type { UploadCandidate } from "@/server/storage/imageValidation";

export async function GET(request: Request) {
    try {
        const principal = await getAuthenticatedPrincipal(request.headers);

        if (!principal) {
            throw serviceError("AUTH_REQUIRED", 401, "Sign in to view repairs.");
        }

        const cases = await listRepairCases(principal);
        return Response.json(
            { ok: true, cases },
            { headers: { "Cache-Control": "private, no-store" } },
        );
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const principal = await requirePrincipal(["RESIDENT"], request.headers);
        const contentType = request.headers.get("content-type") ?? "";
        const sourceAddress = getTrustedSourceAddress(request);
        const contentLength = Number(request.headers.get("content-length"));

        if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
            throw serviceError(
                "INVALID_INPUT",
                415,
                "Submit the repair using the expected form format.",
            );
        }

        if (
            !Number.isFinite(contentLength) ||
            contentLength <= 0 ||
            contentLength > 27 * 1024 * 1024
        ) {
            throw serviceError(
                "UPLOAD_INVALID",
                413,
                "The repair submission is larger than the 25 MB photograph limit.",
            );
        }

        await Promise.all([
            databaseRateLimiter.consume(
                `upload:resident:${principal.userId}`,
                { limit: 20, windowSeconds: 60 * 60 },
            ),
            databaseRateLimiter.consume(`upload:source:${sourceAddress}`, {
                limit: 60,
                windowSeconds: 60 * 60,
            }),
        ]);

        const formData = await request.formData();
        const payloadValue = formData.get("report");
        const idempotencyKey = formData.get("idempotencyKey");

        if (typeof payloadValue !== "string") {
            throw serviceError(
                "INVALID_INPUT",
                400,
                "The repair details are missing.",
            );
        }

        let payload: unknown;

        try {
            payload = JSON.parse(payloadValue);
        } catch {
            throw serviceError(
                "INVALID_INPUT",
                400,
                "The repair details are invalid.",
            );
        }

        const uploads: UploadCandidate[] = [];

        for (const value of formData.getAll("photos")) {
            if (!(value instanceof File)) {
                throw serviceError(
                    "UPLOAD_INVALID",
                    400,
                    "A photograph could not be read.",
                );
            }

            uploads.push({
                originalFilename: value.name,
                declaredMimeType: value.type,
                bytes: new Uint8Array(await value.arrayBuffer()),
            });
        }

        const result = await createHousingRepairCase({
            principal,
            payload,
            idempotencyKey,
            uploads,
            sourceAddress,
        });

        return Response.json(result, {
            status: result.idempotentReplay ? 200 : 201,
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch (error) {
        return jsonError(error);
    }
}
