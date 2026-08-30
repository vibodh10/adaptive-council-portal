import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/db/schema";

const buildOnlyDatabaseUrl =
    "postgresql://build-only:build-only@127.0.0.1:5432/necivia_build";

const connectionUrl = process.env.DATABASE_URL ?? buildOnlyDatabaseUrl;

const globalDatabase = globalThis as typeof globalThis & {
    __neciviaPostgresClient?: ReturnType<typeof postgres>;
};

const client =
    globalDatabase.__neciviaPostgresClient ??
    postgres(connectionUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
    });

if (process.env.NODE_ENV !== "production") {
    globalDatabase.__neciviaPostgresClient = client;
}

export const db = drizzle(client, { schema });

export function hasConfiguredDatabase(): boolean {
    return Boolean(process.env.DATABASE_URL);
}
