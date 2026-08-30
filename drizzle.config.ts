import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url:
            process.env.DATABASE_URL ??
            "postgresql://build-only:build-only@127.0.0.1:5432/necivia_build",
    },
    strict: true,
    verbose: true,
});
