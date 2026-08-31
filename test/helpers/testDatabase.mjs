import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

import {
    deployPendingMigrations,
    loadLocalMigrations,
} from "../../scripts/database-migrations.mjs";
import * as schema from "../../src/server/db/schema.ts";

function pgliteExecutor(client) {
    return {
        async query(text, parameters = []) {
            return (await client.query(text, parameters)).rows;
        },
        async transaction(callback) {
            return client.transaction((transaction) =>
                callback(pgliteExecutor(transaction)),
            );
        },
    };
}

export async function createTestDatabase() {
    const client = new PGlite();
    await deployPendingMigrations(
        pgliteExecutor(client),
        loadLocalMigrations(),
    );

    return {
        client,
        db: drizzle(client, { schema }),
    };
}

export async function seedCouncil(database, input = {}) {
    const [council] = await database
        .insert(schema.councils)
        .values({
            slug: input.slug ?? `council-${randomUUID()}`,
            name: input.name ?? "Test Council",
            demo: true,
        })
        .returning();
    return council;
}

export async function seedUser(database, input) {
    const userId = input.id ?? randomUUID();
    const email = input.email.toLowerCase();
    const password = input.password ?? "correct-horse-demo-password";
    const [createdUser] = await database
        .insert(schema.user)
        .values({
            id: userId,
            name: input.name ?? "Test User",
            email,
            emailVerified: true,
            councilId: input.councilId,
            role: input.role,
            active: input.active ?? true,
        })
        .returning();
    await database.insert(schema.account).values({
        id: randomUUID(),
        issuer: "local:credential",
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(password),
    });

    return { ...createdUser, password };
}

export function principalFor(user) {
    return {
        userId: user.id,
        councilId: user.councilId,
        role: user.role,
        email: user.email,
        displayName: user.name,
    };
}
