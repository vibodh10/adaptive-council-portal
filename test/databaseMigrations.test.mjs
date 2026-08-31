import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PGlite } from "@electric-sql/pglite";

import {
    assessMigrationLedger,
    bootstrapEmptyDatabase,
    deployDatabase,
    deployPendingMigrations,
    describeDatabaseTarget,
    inspectMigrationState,
    loadLocalMigrations,
    requireDatabaseUrl,
    safeDatabaseErrorMessage,
} from "../scripts/database-migrations.mjs";

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

async function withDatabase(callback) {
    const client = new PGlite();

    try {
        return await callback(client, pgliteExecutor(client));
    } finally {
        await client.close();
    }
}

test("checked-in migration journal is ordered and matches SQL hashes", () => {
    const migrations = loadLocalMigrations();

    assert.deepEqual(
        migrations.map((migration) => migration.tag),
        ["0000_motionless_shiver_man", "0001_certain_unus"],
    );
    assert.equal(new Set(migrations.map((migration) => migration.hash)).size, 2);
    assert.equal(migrations[0].createdAt < migrations[1].createdAt, true);
    assert.equal(migrations.every((migration) => migration.statements.length > 0), true);
});

test("database diagnostics require configuration and redact URL credentials", () => {
    assert.throws(() => requireDatabaseUrl({}), /required/i);

    const databaseUrl =
        "postgresql://sensitive-user:sensitive-password@postgres.railway.internal:5432/railway?sslmode=require";
    const target = describeDatabaseTarget(databaseUrl);
    const safeError = safeDatabaseErrorMessage(
        new Error(`Could not connect to ${databaseUrl}`),
    );

    assert.equal(target, "postgres.railway.internal:5432/railway");
    assert.equal(target.includes("sensitive"), false);
    assert.equal(safeError.includes("sensitive"), false);
});

test("a poisoned high-watermark ledger row is rejected instead of silently skipped", () => {
    const migrations = loadLocalMigrations();
    const assessment = assessMigrationLedger(migrations, [
        {
            id: 1,
            hash: "poisoned-ledger-row",
            created_at: 9_999_999_999_999,
        },
    ]);

    assert.equal(assessment.consistent, false);
    assert.equal(assessment.pending.length, 0);
    assert.match(assessment.problems.join(" "), /does not match/i);
});

test("db:deploy bootstraps a blank database then uses the normal idempotent path", async () => {
    await withDatabase(async (_client, executor) => {
        const migrations = loadLocalMigrations();
        const first = await deployDatabase(executor, migrations);
        const second = await deployDatabase(executor, migrations);

        assert.equal(first.mode, "bootstrap");
        assert.deepEqual(
            first.applied.map((migration) => migration.tag),
            migrations.map((migration) => migration.tag),
        );
        assert.equal(first.state.ready, true);
        assert.equal(second.mode, "migration");
        assert.deepEqual(second.applied, []);
        assert.equal(second.state.ready, true);
    });
});

test("normal deploy refuses metadata that claims an absent schema", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create schema drizzle;
            create table drizzle.__drizzle_migrations (
                id serial primary key,
                hash text not null,
                created_at bigint
            );
            insert into drizzle.__drizzle_migrations (hash, created_at)
            values ('poisoned-ledger-row', 9999999999999);
        `);

        await assert.rejects(
            deployPendingMigrations(executor, migrations),
            /metadata is inconsistent/i,
        );
        const state = await inspectMigrationState(executor, migrations);

        assert.equal(state.councilsExists, false);
        assert.equal(state.appliedRows.length, 1);
    });
});

test("db:deploy repairs a poisoned ledger when no application schema exists", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create schema drizzle;
            create table drizzle.__drizzle_migrations (
                id serial primary key,
                hash text not null,
                created_at bigint
            );
            insert into drizzle.__drizzle_migrations (hash, created_at)
            values ('poisoned-ledger-row', 9999999999999);
        `);

        const result = await deployDatabase(executor, migrations);

        assert.equal(result.mode, "bootstrap");
        assert.equal(result.repairedMetadataRows, 1);
        assert.equal(result.state.ready, true);
        assert.deepEqual(
            result.state.appliedRows.map((row) => row.hash),
            migrations.map((migration) => migration.hash),
        );
    });
});

test("one-time bootstrap repairs metadata only on a verified empty database", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create schema drizzle;
            create table drizzle.__drizzle_migrations (
                id serial primary key,
                hash text not null,
                created_at bigint
            );
            insert into drizzle.__drizzle_migrations (hash, created_at)
            values ('poisoned-ledger-row', 9999999999999);
        `);

        const first = await bootstrapEmptyDatabase(executor, migrations);
        const second = await bootstrapEmptyDatabase(executor, migrations);

        assert.equal(first.alreadyReady, false);
        assert.equal(first.repairedMetadataRows, 1);
        assert.equal(first.state.ready, true);
        assert.equal(second.alreadyReady, true);
        assert.equal(second.repairedMetadataRows, 0);
        assert.deepEqual(
            first.state.appliedRows.map((row) => row.hash),
            migrations.map((migration) => migration.hash),
        );
    });
});

test("one-time bootstrap replaces malformed metadata only when schema is empty", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create schema drizzle;
            create table drizzle.__drizzle_migrations (unexpected text);
        `);

        const before = await inspectMigrationState(executor, migrations);
        const result = await bootstrapEmptyDatabase(executor, migrations);

        assert.equal(before.metadata.valid, false);
        assert.match(before.assessment.problems.join(" "), /malformed/i);
        assert.equal(result.state.metadata.valid, true);
        assert.equal(result.state.ready, true);
    });
});

test("db:deploy refuses unknown application data without changing it", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create table public.unrelated_application_data (
                id integer primary key,
                value text not null
            );
            insert into public.unrelated_application_data values (1, 'preserve me');
        `);

        await assert.rejects(
            deployDatabase(executor, migrations),
            /first-run bootstrap refused/i,
        );
        const result = await client.query(
            "select value from public.unrelated_application_data where id = 1",
        );

        assert.equal(result.rows[0].value, "preserve me");
        assert.equal(
            (
                await client.query(
                    "select to_regclass('public.councils') is not null as exists",
                )
            ).rows[0].exists,
            false,
        );
    });
});

test("db:deploy refuses a partial Necivia schema without deleting data", async () => {
    await withDatabase(async (client, executor) => {
        const migrations = loadLocalMigrations();
        await client.exec(`
            create table public.councils (
                id integer primary key,
                name text not null
            );
            insert into public.councils values (1, 'preserve partial state');
        `);

        await assert.rejects(
            deployDatabase(executor, migrations),
            /ledger is empty but application objects already exist|schema is partial/i,
        );
        const result = await client.query(
            "select name from public.councils where id = 1",
        );

        assert.equal(result.rows[0].name, "preserve partial state");
        assert.equal(
            (
                await client.query(
                    "select to_regclass('public.repair_cases') is not null as exists",
                )
            ).rows[0].exists,
            false,
        );
    });
});

test("future deploy applies only a new hash after the checked-in prefix", async () => {
    await withDatabase(async (_client, executor) => {
        const migrations = loadLocalMigrations();
        await deployDatabase(executor, migrations);
        const futureMigration = {
            index: 2,
            tag: "0002_future_probe",
            hash: "future-probe-hash",
            createdAt: migrations[1].createdAt + 1,
            statements: [
                "create table public.future_migration_probe (id integer primary key)",
            ],
        };
        const result = await deployDatabase(executor, [
            ...migrations,
            futureMigration,
        ]);

        assert.equal(result.mode, "migration");
        assert.deepEqual(
            result.applied.map((migration) => migration.tag),
            [futureMigration.tag],
        );
        assert.equal(result.state.ready, true);
    });
});

test("db:deploy command never invokes the seed", () => {
    const packageJson = JSON.parse(
        readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );

    assert.equal(
        packageJson.scripts["db:deploy"],
        "node scripts/database-deploy.mjs",
    );
    assert.doesNotMatch(packageJson.scripts["db:deploy"], /seed/i);
});
