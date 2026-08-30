import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter, type DB } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/server/db/client";
import { schema } from "@/server/db/schema";

const buildOnlySecret =
    "necivia-build-only-secret-must-never-authorize-a-runtime-request";

export function isAuthConfigured(): boolean {
    return Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
}

export function createNeciviaAuth({
    database = db,
    baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret = process.env.AUTH_SECRET ?? buildOnlySecret,
    disableSignUp = true,
}: {
    database?: DB;
    baseURL?: string;
    secret?: string;
    disableSignUp?: boolean;
} = {}) {
    return betterAuth({
        appName: "Necivia",
        baseURL,
        secret,
        database: drizzleAdapter(database, {
        provider: "pg",
        schema,
        }),
        trustedOrigins: [baseURL],
        emailAndPassword: {
            enabled: true,
            disableSignUp,
            minPasswordLength: 12,
            maxPasswordLength: 128,
        },
        user: {
            additionalFields: {
                councilId: {
                    type: "string",
                    required: true,
                    input: false,
                },
                role: {
                    type: ["RESIDENT", "STAFF"],
                    required: true,
                    input: false,
                    defaultValue: "RESIDENT",
                },
                active: {
                    type: "boolean",
                    required: true,
                    input: false,
                    defaultValue: true,
                },
            },
        },
        session: {
            expiresIn: 60 * 60 * 8,
            updateAge: 60 * 30,
            cookieCache: {
                enabled: false,
            },
        },
        rateLimit: {
            enabled: true,
            storage: "database",
            window: 60,
            max: 60,
            customRules: {
                "/sign-in/email": {
                    window: 60 * 5,
                    max: 8,
                },
            },
        },
        advanced: {
            cookiePrefix: "necivia",
            defaultCookieAttributes: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            },
            ipAddress: {
                ipAddressHeaders: ["x-real-ip"],
            },
        },
        plugins: [nextCookies()],
    });
}

export const auth = createNeciviaAuth();

export type NeciviaSession = typeof auth.$Infer.Session;
