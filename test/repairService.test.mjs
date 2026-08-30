import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { and, eq } from "drizzle-orm";

import { POST as submitRepairRoute } from "../src/app/api/repairs/route.ts";
import { GET as readRepairRoute } from "../src/app/api/repairs/[id]/route.ts";
import { repairCases } from "../src/server/db/schema.ts";
import { westbridgeSandboxAdapter } from "../src/server/delivery/sandbox.ts";
import { createDrizzleRepairRepository } from "../src/server/repairs/repository.ts";
import {
    createHousingRepairCase,
    getRepairCase,
    retryRepairDelivery,
    updateRepairStatus,
} from "../src/server/repairs/service.ts";
import { ServiceError } from "../src/server/security/serviceError.ts";
import {
    createTestDatabase,
    principalFor,
    seedCouncil,
    seedUser,
} from "./helpers/testDatabase.mjs";

const noOpRateLimiter = { async consume() {} };

function yesterday() {
    const value = new Date();
    value.setUTCDate(value.getUTCDate() - 1);
    return value.toISOString().slice(0, 10);
}

function validReport(overrides = {}) {
    return {
        address: "12 Example Street",
        repairType: "roof_or_ceiling",
        issueDescription: "Water is leaking through my ceiling.",
        whenProblemStarted: yesterday(),
        isGettingWorse: true,
        immediateDanger: false,
        accessNotes: "Use the side entrance.",
        additionalNotes: "Leak is near the landing light.",
        ...overrides,
    };
}

function jpegUpload(filename = "ceiling.jpg") {
    return {
        originalFilename: filename,
        declaredMimeType: "image/jpeg",
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    };
}

let testDatabase;
let repository;
let councilA;
let councilB;
let residentA;
let residentB;
let staffA;
let staffB;
let storage;
let referenceCounter = 0;

before(async () => {
    testDatabase = await createTestDatabase();
    repository = createDrizzleRepairRepository(testDatabase.db);
    councilA = await seedCouncil(testDatabase.db, { slug: "tenant-a" });
    councilB = await seedCouncil(testDatabase.db, { slug: "tenant-b" });
    residentA = await seedUser(testDatabase.db, {
        councilId: councilA.id,
        email: "resident-a@example.test",
        role: "RESIDENT",
    });
    residentB = await seedUser(testDatabase.db, {
        councilId: councilA.id,
        email: "resident-b@example.test",
        role: "RESIDENT",
    });
    staffA = await seedUser(testDatabase.db, {
        councilId: councilA.id,
        email: "staff-a@example.test",
        role: "STAFF",
    });
    staffB = await seedUser(testDatabase.db, {
        councilId: councilB.id,
        email: "staff-b@example.test",
        role: "STAFF",
    });
    const objects = new Map();
    storage = {
        async putRepairImage({ councilId, residentId, caseId, image }) {
            const objectKey = `${councilId}/${residentId}/${caseId}/test-${objects.size}.jpg`;
            objects.set(objectKey, image.bytes);
            return {
                objectKey,
                originalFilename: image.originalFilename,
                mimeType: image.mimeType,
                size: image.size,
            };
        },
        async deleteObject(objectKey) {
            objects.delete(objectKey);
        },
        async getObject(objectKey) {
            const body = objects.get(objectKey);
            if (!body) throw new Error("Missing test object");
            return { body, contentType: "image/jpeg", contentLength: body.length };
        },
    };
});

after(async () => {
    await testDatabase.client.close();
});

function dependencies(overrides = {}) {
    return {
        repository,
        storage,
        rateLimiter: noOpRateLimiter,
        deliveryAdapter: westbridgeSandboxAdapter,
        createReference: () => {
            referenceCounter += 1;
            return `NEC-2026-TEST${String(referenceCounter).padStart(4, "0")}`;
        },
        ...overrides,
    };
}

async function createCase(principal, options = {}) {
    return createHousingRepairCase({
        principal,
        payload: options.payload ?? validReport(),
        idempotencyKey: options.idempotencyKey ?? crypto.randomUUID(),
        uploads: options.uploads ?? [],
        sourceAddress: "192.0.2.50",
        dependencies: dependencies(options.dependencies),
    });
}

test("unauthenticated submission route is rejected", async () => {
    const response = await submitRepairRoute(
        new Request("http://localhost:3000/api/repairs", {
            method: "POST",
            headers: {
                host: "localhost:3000",
                origin: "http://localhost:3000",
                "content-type": "multipart/form-data; boundary=test",
                "content-length": "100",
            },
        }),
    );
    const result = await response.json();

    assert.equal(response.status, 401);
    assert.equal(result.error.code, "AUTH_REQUIRED");
});

test("unauthenticated case reading route is rejected", async () => {
    const response = await readRepairRoute(
        new Request("http://localhost:3000/api/repairs/test-case"),
        { params: Promise.resolve({ id: crypto.randomUUID() }) },
    );
    const result = await response.json();

    assert.equal(response.status, 401);
    assert.equal(result.error.code, "AUTH_REQUIRED");
});

test("valid resident submission persists a server reference and sandbox delivery", async () => {
    const result = await createCase(principalFor(residentA), {
        uploads: [jpegUpload()],
    });
    const [persisted] = await testDatabase.db
        .select()
        .from(repairCases)
        .where(eq(repairCases.id, result.caseId));

    assert.equal(result.ok, true);
    assert.match(result.reference, /^NEC-2026-TEST\d{4}$/);
    assert.equal(result.deliveryStatus, "SUCCEEDED");
    assert.equal(persisted.reference, result.reference);
    assert.equal(persisted.residentId, residentA.id);
    assert.equal(persisted.councilId, councilA.id);
});

test("idempotency replay returns the same case without a duplicate", async () => {
    const idempotencyKey = crypto.randomUUID();
    const first = await createCase(principalFor(residentA), { idempotencyKey });
    const second = await createCase(principalFor(residentA), { idempotencyKey });
    const matching = await testDatabase.db
        .select()
        .from(repairCases)
        .where(eq(repairCases.idempotencyKey, idempotencyKey));

    assert.equal(second.idempotentReplay, true);
    assert.equal(second.caseId, first.caseId);
    assert.equal(second.reference, first.reference);
    assert.equal(matching.length, 1);
});

test("delivery failure persists a truthful safe status and staff can retry", async () => {
    const failedAdapter = {
        adapterType: "WEBHOOK",
        async deliver() {
            return {
                adapterType: "WEBHOOK",
                succeeded: false,
                safeMetadata: { failure: "delivery-request-failed" },
            };
        },
    };
    const repair = await createCase(principalFor(residentA), {
        dependencies: { deliveryAdapter: failedAdapter },
    });

    assert.equal(repair.deliveryStatus, "FAILED");
    const retry = await retryRepairDelivery({
        principal: principalFor(staffA),
        caseId: repair.caseId,
        repository,
        deliveryAdapter: westbridgeSandboxAdapter,
        rateLimiter: noOpRateLimiter,
    });
    const detail = await getRepairCase(
        principalFor(staffA),
        repair.caseId,
        repository,
    );

    assert.equal(retry.deliveryStatus, "SUCCEEDED");
    assert.deepEqual(
        detail.deliveryAttempts.map((attempt) => attempt.status),
        ["SUCCEEDED", "FAILED"],
    );
    assert.equal(
        detail.auditEvents.some(
            (event) => event.action === "COUNCIL_DELIVERY_FAILED",
        ),
        true,
    );
});

test("partial attachment failure removes uploaded objects and case reservation", async () => {
    const idempotencyKey = crypto.randomUUID();
    const deletedObjects = [];
    let uploadCount = 0;
    const failingStorage = {
        ...storage,
        async putRepairImage(input) {
            uploadCount += 1;
            if (uploadCount === 2) {
                throw new Error("Synthetic storage failure");
            }
            return storage.putRepairImage(input);
        },
        async deleteObject(objectKey) {
            deletedObjects.push(objectKey);
            return storage.deleteObject(objectKey);
        },
    };

    await assert.rejects(
        createCase(principalFor(residentA), {
            idempotencyKey,
            uploads: [jpegUpload("first.jpg"), jpegUpload("second.jpg")],
            dependencies: { storage: failingStorage },
        }),
        /Synthetic storage failure/,
    );
    const abandonedCases = await testDatabase.db
        .select()
        .from(repairCases)
        .where(
            and(
                eq(repairCases.residentId, residentA.id),
                eq(repairCases.idempotencyKey, idempotencyKey),
            ),
        );

    assert.equal(deletedObjects.length, 1);
    assert.equal(abandonedCases.length, 0);
});

test("separate submissions receive unique server-generated references", async () => {
    const first = await createCase(principalFor(residentA));
    const second = await createCase(principalFor(residentA));

    assert.notEqual(first.caseId, second.caseId);
    assert.notEqual(first.reference, second.reference);
});

test("server rejects future dates and unanswered safety fields", async () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    for (const payload of [
        validReport({ whenProblemStarted: tomorrow.toISOString().slice(0, 10) }),
        validReport({ immediateDanger: null }),
    ]) {
        await assert.rejects(
            createCase(principalFor(residentA), { payload }),
            (error) => {
                assert.equal(error.code, "INVALID_INPUT");
                return true;
            },
        );
    }
});

test("client cannot choose a reference or unknown server fields", async () => {
    await assert.rejects(
        createCase(principalFor(residentA), {
            payload: {
                ...validReport(),
                reference: "CLIENT-CHOSEN",
                councilId: councilB.id,
            },
        }),
        (error) => {
            assert.ok(error instanceof ServiceError);
            assert.equal(error.code, "INVALID_INPUT");
            return true;
        },
    );
});

test("resident cannot read another resident's case or probe arbitrary IDs", async () => {
    const ownedByB = await createCase(principalFor(residentB));

    for (const caseId of [ownedByB.caseId, crypto.randomUUID()]) {
        await assert.rejects(
            getRepairCase(principalFor(residentA), caseId, repository),
            (error) => {
                assert.equal(error.code, "NOT_FOUND");
                return true;
            },
        );
    }
});

test("same-tenant staff can read a case and cross-tenant staff cannot", async () => {
    const repair = await createCase(principalFor(residentA));
    const visible = await getRepairCase(
        principalFor(staffA),
        repair.caseId,
        repository,
    );

    assert.equal(visible.id, repair.caseId);
    assert.equal(visible.residentDisplayName, residentA.name);
    await assert.rejects(
        getRepairCase(principalFor(staffB), repair.caseId, repository),
        (error) => {
            assert.equal(error.code, "NOT_FOUND");
            return true;
        },
    );
});

test("resident cannot mutate staff workflow status", async () => {
    const repair = await createCase(principalFor(residentA));

    await assert.rejects(
        updateRepairStatus({
            principal: principalFor(residentA),
            caseId: repair.caseId,
            status: "RESOLVED",
            repository,
        }),
        (error) => {
            assert.equal(error.code, "FORBIDDEN");
            return true;
        },
    );
});

test("same-tenant staff can update status and creates an audit event", async () => {
    const repair = await createCase(principalFor(residentA));
    const updated = await updateRepairStatus({
        principal: principalFor(staffA),
        caseId: repair.caseId,
        status: "IN_PROGRESS",
        repository,
    });

    assert.equal(updated.status, "IN_PROGRESS");
    assert.equal(
        updated.auditEvents.some(
            (event) => event.action === "REPAIR_STATUS_CHANGED",
        ),
        true,
    );
    await assert.rejects(
        updateRepairStatus({
            principal: principalFor(staffB),
            caseId: repair.caseId,
            status: "RESOLVED",
            repository,
        }),
        (error) => {
            assert.equal(error.code, "NOT_FOUND");
            return true;
        },
    );
});

test("attachment lookup denies resident and cross-tenant IDOR", async () => {
    const repair = await createCase(principalFor(residentA), {
        uploads: [jpegUpload("private-photo.jpg")],
    });
    const detail = await getRepairCase(
        principalFor(residentA),
        repair.caseId,
        repository,
    );
    const attachmentId = detail.attachments[0].id;

    assert.equal(
        await repository.getAttachment({
            principal: principalFor(residentB),
            caseId: repair.caseId,
            attachmentId,
        }),
        null,
    );
    assert.equal(
        await repository.getAttachment({
            principal: principalFor(staffB),
            caseId: repair.caseId,
            attachmentId,
        }),
        null,
    );
    assert.equal(
        (
            await repository.getAttachment({
                principal: principalFor(staffA),
                caseId: repair.caseId,
                attachmentId,
            })
        ).id,
        attachmentId,
    );
});
