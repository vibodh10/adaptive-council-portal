import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { westbridgeSandboxAdapter } from "../src/server/delivery/sandbox.ts";
import {
    createWebhookAdapter,
    isDisallowedNetworkAddress,
    validateWebhookUrl,
} from "../src/server/delivery/webhook.ts";
import { requireSameOrigin } from "../src/server/security/http.ts";
import { createDatabaseRateLimiter } from "../src/server/security/rateLimit.ts";
import { ServiceError } from "../src/server/security/serviceError.ts";
import {
    MAX_IMAGE_SIZE_BYTES,
    sanitizeFilename,
    validateImageUploads,
} from "../src/server/storage/imageValidation.ts";
import { createTestDatabase } from "./helpers/testDatabase.mjs";

let testDatabase;

before(async () => {
    testDatabase = await createTestDatabase();
});

after(async () => {
    await testDatabase.client.close();
});

const deliveryCase = {
    reference: "NEC-2026-TEST",
    submittedAt: new Date().toISOString(),
    address: "12 Example Street",
    repairType: "roof_or_ceiling",
    issueDescription: "Water is leaking through my ceiling.",
    whenProblemStarted: "2026-08-20",
    isGettingWorse: true,
    immediateDanger: false,
    accessNotes: "Use the side entrance.",
    additionalNotes: "",
    attachmentCount: 1,
};

test("JPEG, PNG and WebP signatures are accepted", () => {
    const images = validateImageUploads([
        {
            originalFilename: "photo.jpg",
            declaredMimeType: "image/jpeg",
            bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
        },
        {
            originalFilename: "photo.png",
            declaredMimeType: "image/png",
            bytes: new Uint8Array([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            ]),
        },
        {
            originalFilename: "photo.webp",
            declaredMimeType: "image/webp",
            bytes: new Uint8Array([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42,
                0x50,
            ]),
        },
    ]);

    assert.deepEqual(
        images.map((image) => image.mimeType),
        ["image/jpeg", "image/png", "image/webp"],
    );
});

test("SVG, executable content and mismatched MIME types are rejected", () => {
    for (const candidate of [
        {
            originalFilename: "image.svg",
            declaredMimeType: "image/svg+xml",
            bytes: new TextEncoder().encode("<svg></svg>"),
        },
        {
            originalFilename: "malware.jpg",
            declaredMimeType: "image/jpeg",
            bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
        },
        {
            originalFilename: "wrong.png",
            declaredMimeType: "image/png",
            bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
        },
    ]) {
        assert.throws(() => validateImageUploads([candidate]), ServiceError);
    }
});

test("oversized and excessive image uploads are rejected", () => {
    assert.throws(
        () =>
            validateImageUploads([
                {
                    originalFilename: "large.jpg",
                    declaredMimeType: "image/jpeg",
                    bytes: new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1).fill(0xff),
                },
            ]),
        ServiceError,
    );
    assert.throws(
        () =>
            validateImageUploads(
                Array.from({ length: 6 }, (_, index) => ({
                    originalFilename: `${index}.jpg`,
                    declaredMimeType: "image/jpeg",
                    bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
                })),
            ),
        ServiceError,
    );
});

test("display filenames cannot preserve paths or traversal sequences", () => {
    const filename = sanitizeFilename("../../private\\dangerous<script>.JPG");

    assert.equal(filename.includes(".."), false);
    assert.equal(filename.includes("/"), false);
    assert.equal(filename.includes("\\"), false);
    assert.equal(filename.includes("<"), false);
});

test("same-origin mutation guard rejects cross-site requests", () => {
    requireSameOrigin(
        new Request("https://necivia.example/api/repairs", {
            headers: {
                host: "necivia.example",
                origin: "https://necivia.example",
            },
        }),
    );

    assert.throws(
        () =>
            requireSameOrigin(
                new Request("https://necivia.example/api/repairs", {
                    headers: {
                        host: "necivia.example",
                        origin: "https://attacker.example",
                    },
                }),
            ),
        (error) => error.code === "FORBIDDEN",
    );
});

test("login and submission abuse keys eventually return structured 429 errors", async () => {
    const limiter = createDatabaseRateLimiter(testDatabase.db);
    const rule = { limit: 2, windowSeconds: 60 };

    for (const key of [
        "login:identifier:resident@example.test",
        "repair:resident:test-user-id",
    ]) {
        await limiter.consume(key, rule);
        await limiter.consume(key, rule);
        await assert.rejects(limiter.consume(key, rule), (error) => {
            assert.equal(error.code, "RATE_LIMITED");
            assert.equal(error.status, 429);
            assert.ok(error.details.retryAfterSeconds > 0);
            return true;
        });
    }
});

test("sandbox delivery succeeds only into the fictional staff inbox", async () => {
    const outcome = await westbridgeSandboxAdapter.deliver(deliveryCase);

    assert.equal(outcome.succeeded, true);
    assert.equal(outcome.adapterType, "SANDBOX");
    assert.equal(
        outcome.safeMetadata.destination,
        "westbridge-demo-staff-inbox",
    );
    assert.equal(outcome.safeMetadata.externalSystem, false);
});

test("webhook validation rejects non-HTTPS and internal destinations", () => {
    for (const url of [
        "http://council.example/hooks",
        "https://localhost/hooks",
        "https://127.0.0.1/hooks",
        "https://10.0.0.1/hooks",
        "https://service.internal/hooks",
    ]) {
        assert.throws(() => validateWebhookUrl(url), ServiceError);
    }

    assert.equal(isDisallowedNetworkAddress("169.254.169.254"), true);
    assert.equal(isDisallowedNetworkAddress("::1"), true);
    assert.equal(isDisallowedNetworkAddress("1.1.1.1"), false);
});

test("webhook request is signed without returning or logging the secret", async () => {
    const secret = "a-test-webhook-secret-that-is-longer-than-32-characters";
    let observedRequest;
    const adapter = createWebhookAdapter({
        endpoint: "https://1.1.1.1/authorized-council-hook",
        secret,
        fetchImplementation: async (url, options) => {
            observedRequest = { url: String(url), options };
            return new Response(null, {
                status: 202,
                headers: { "x-request-id": "safe-request-id" },
            });
        },
    });
    const outcome = await adapter.deliver(deliveryCase);
    const signature = observedRequest.options.headers["X-Necivia-Signature"];

    assert.equal(outcome.succeeded, true);
    assert.equal(outcome.safeMetadata.statusCode, 202);
    assert.match(signature, /^sha256=[a-f0-9]{64}$/);
    assert.equal(signature.includes(secret), false);
    assert.equal(JSON.stringify(outcome).includes(secret), false);
});
