import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createNeciviaAuth } from "../src/server/auth/auth.ts";
import {
    createTestDatabase,
    seedCouncil,
    seedUser,
} from "./helpers/testDatabase.mjs";

let testDatabase;
let resident;
let staff;
let testAuth;

before(async () => {
    testDatabase = await createTestDatabase();
    const council = await seedCouncil(testDatabase.db, {
        slug: "westbridge-auth-test",
    });
    resident = await seedUser(testDatabase.db, {
        councilId: council.id,
        email: "resident-auth@example.test",
        role: "RESIDENT",
    });
    staff = await seedUser(testDatabase.db, {
        councilId: council.id,
        email: "staff-auth@example.test",
        role: "STAFF",
    });
    testAuth = createNeciviaAuth({
        database: testDatabase.db,
        baseURL: "http://localhost:3000",
        secret: "test-only-auth-secret-with-more-than-32-characters",
    });
});

after(async () => {
    await testDatabase.client.close();
});

test("resident can authenticate with the seeded password", async () => {
    const context = await testAuth.$context;
    const storedUser = await context.internalAdapter.findUserByEmail(
        resident.email,
    );
    assert.equal(storedUser?.user.id, resident.id);

    const result = await testAuth.api.signInEmail({
        body: { email: resident.email, password: resident.password },
    });

    assert.equal(result.user.id, resident.id);
    assert.equal(result.user.councilId, resident.councilId);
    assert.equal(result.user.role, "RESIDENT");
    assert.ok(result.token);
});

test("staff can authenticate with the seeded password", async () => {
    const result = await testAuth.api.signInEmail({
        body: { email: staff.email, password: staff.password },
    });

    assert.equal(result.user.id, staff.id);
    assert.equal(result.user.councilId, staff.councilId);
    assert.equal(result.user.role, "STAFF");
    assert.ok(result.token);
});

test("each login receives a fresh session token", async () => {
    const first = await testAuth.api.signInEmail({
        body: { email: resident.email, password: resident.password },
    });
    const second = await testAuth.api.signInEmail({
        body: { email: resident.email, password: resident.password },
    });

    assert.notEqual(first.token, second.token);
});

test("sign out invalidates the database session", async () => {
    const loginResponse = await testAuth.api.signInEmail({
        body: { email: resident.email, password: resident.password },
        asResponse: true,
    });
    const setCookie = loginResponse.headers.get("set-cookie");
    const cookie = setCookie?.split(";")[0];

    assert.ok(cookie);
    assert.equal(
        (
            await testAuth.api.getSession({
                headers: new Headers({ cookie }),
            })
        )?.user.id,
        resident.id,
    );
    await testAuth.api.signOut({
        headers: new Headers({ cookie }),
    });

    assert.equal(
        await testAuth.api.getSession({
            headers: new Headers({ cookie }),
        }),
        null,
    );
});

test("bad password returns a generic authentication failure", async () => {
    await assert.rejects(
        testAuth.api.signInEmail({
            body: {
                email: resident.email,
                password: "definitely-the-wrong-password",
            },
        }),
        (error) => {
            assert.equal(error.statusCode, 401);
            assert.doesNotMatch(error.message, /resident-auth@example/i);
            return true;
        },
    );
});

test("public email sign-up is disabled", async () => {
    await assert.rejects(
        testAuth.api.signUpEmail({
            body: {
                email: "not-allowed@example.test",
                name: "Not Allowed",
                password: "not-allowed-password",
            },
        }),
        (error) => {
            assert.equal(error.statusCode, 400);
            return true;
        },
    );
});
