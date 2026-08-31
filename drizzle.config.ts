import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    migrations: {
        schema: "drizzle",
        table: "__drizzle_migrations",
    },
    strict: true,
    verbose: true,
});
