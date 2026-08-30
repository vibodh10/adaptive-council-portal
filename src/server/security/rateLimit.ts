import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { abuseBuckets } from "@/server/db/schema";
import { serviceError } from "@/server/security/serviceError";

export type RateLimitRule = {
    limit: number;
    windowSeconds: number;
};

export interface RateLimiter {
    consume(key: string, rule: RateLimitRule): Promise<void>;
}

function hashRateLimitKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

export function createDatabaseRateLimiter(database: typeof db = db): RateLimiter {
    return {
        async consume(key, rule) {
        const keyHash = hashRateLimitKey(key);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + rule.windowSeconds * 1_000);

        const outcome = await database.transaction(async (transaction) => {
            await transaction
                .insert(abuseBuckets)
                .values({
                    keyHash,
                    count: 0,
                    windowStartedAt: now,
                    expiresAt,
                })
                .onConflictDoNothing();

            const [bucket] = await transaction
                .select()
                .from(abuseBuckets)
                .where(eq(abuseBuckets.keyHash, keyHash))
                .for("update");

            if (!bucket || bucket.expiresAt <= now) {
                await transaction
                    .update(abuseBuckets)
                    .set({
                        count: 1,
                        windowStartedAt: now,
                        expiresAt,
                    })
                    .where(eq(abuseBuckets.keyHash, keyHash));
                return { allowed: true, retryAfterSeconds: 0 };
            }

            if (bucket.count >= rule.limit) {
                return {
                    allowed: false,
                    retryAfterSeconds: Math.max(
                        1,
                        Math.ceil(
                            (bucket.expiresAt.getTime() - now.getTime()) / 1_000,
                        ),
                    ),
                };
            }

            await transaction
                .update(abuseBuckets)
                .set({ count: bucket.count + 1 })
                .where(eq(abuseBuckets.keyHash, keyHash));
            return { allowed: true, retryAfterSeconds: 0 };
        });

        if (!outcome.allowed) {
            throw serviceError(
                "RATE_LIMITED",
                429,
                "Too many requests. Please wait and try again.",
                { retryAfterSeconds: outcome.retryAfterSeconds },
            );
        }
        },
    };
}

export const databaseRateLimiter = createDatabaseRateLimiter();
