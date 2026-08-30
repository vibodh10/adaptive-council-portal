import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

import * as schema from "../../src/server/db/schema.ts";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function createTestDatabase() {
    const client = new PGlite();
    const migrationDirectory = join(repositoryRoot, "drizzle");
    const migrationFiles = readdirSync(migrationDirectory)
        .filter((filename) => filename.endsWith(".sql"))
        .sort();

    if (migrationFiles.length === 0) {
        throw new Error("Expected a generated SQL migration for tests.");
    }

    for (const migrationFile of migrationFiles) {
        const migration = readFileSync(
            join(migrationDirectory, migrationFile),
            "utf8",
        ).replaceAll("--> statement-breakpoint", "");
        await client.exec(migration);
    }

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
