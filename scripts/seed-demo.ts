import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { account, councils, user } from "@/server/db/schema";

type SeedUser = {
    email: string;
    password: string;
    name: string;
    role: "RESIDENT" | "STAFF";
};

function requiredEnvironment(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} must be configured before seeding.`);
    }

    return value;
}

async function upsertDemoUser(
    councilId: string,
    seedUser: SeedUser,
): Promise<"created" | "updated"> {
    const normalizedEmail = seedUser.email.toLowerCase();
    const passwordHash = await hashPassword(seedUser.password);
    const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, normalizedEmail))
        .limit(1);

    const userId = existing?.id ?? randomUUID();

    if (existing) {
        await db
            .update(user)
            .set({
                name: seedUser.name,
                councilId,
                role: seedUser.role,
                active: true,
                emailVerified: true,
                updatedAt: new Date(),
            })
            .where(eq(user.id, userId));
    } else {
        await db.insert(user).values({
            id: userId,
            name: seedUser.name,
            email: normalizedEmail,
            emailVerified: true,
            councilId,
            role: seedUser.role,
            active: true,
        });
    }

    const [credentialAccount] = await db
        .select({ id: account.id })
        .from(account)
        .where(
            and(
                eq(account.userId, userId),
                eq(account.providerId, "credential"),
            ),
        )
        .limit(1);

    if (credentialAccount) {
        await db
            .update(account)
            .set({ password: passwordHash, updatedAt: new Date() })
            .where(eq(account.id, credentialAccount.id));
    } else {
        await db.insert(account).values({
            id: randomUUID(),
            issuer: "local:credential",
            accountId: userId,
            providerId: "credential",
            userId,
            password: passwordHash,
        });
    }

    return existing ? "updated" : "created";
}

async function seed() {
    if (process.env.DEMO_MODE !== "true") {
        throw new Error("Set DEMO_MODE=true to seed the fictional demo tenant.");
    }

    requiredEnvironment("DATABASE_URL");

    const [existingCouncil] = await db
        .select({ id: councils.id })
        .from(councils)
        .where(eq(councils.slug, "westbridge"))
        .limit(1);

    let councilId = existingCouncil?.id;

    if (!councilId) {
        const [createdCouncil] = await db
            .insert(councils)
            .values({
                slug: "westbridge",
                name: "Westbridge Council",
                demo: true,
            })
            .returning({ id: councils.id });
        councilId = createdCouncil.id;
    } else {
        await db
            .update(councils)
            .set({ demo: true, updatedAt: new Date() })
            .where(eq(councils.id, councilId));
    }

    const results = await Promise.all([
        upsertDemoUser(councilId, {
            email: requiredEnvironment("DEMO_RESIDENT_EMAIL"),
            password: requiredEnvironment("DEMO_RESIDENT_PASSWORD"),
            name: "Westbridge Resident",
            role: "RESIDENT",
        }),
        upsertDemoUser(councilId, {
            email: requiredEnvironment("DEMO_STAFF_EMAIL"),
            password: requiredEnvironment("DEMO_STAFF_PASSWORD"),
            name: "Westbridge Repairs Officer",
            role: "STAFF",
        }),
    ]);

    process.stdout.write(
        `Westbridge demo tenant ready (${results.join(", ")}).\n`,
    );
}

seed().catch((error: unknown) => {
    const message =
        error instanceof Error ? error.message : "Demo seed failed.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
