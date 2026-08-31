import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

export const MIGRATIONS_SCHEMA = "drizzle";
export const MIGRATIONS_TABLE = "__drizzle_migrations";

const requiredNeciviaObjects = [
    ...[
        "abuse_buckets",
        "account",
        "attachments",
        "audit_events",
        "councils",
        "delivery_attempts",
        "rate_limit",
        "repair_cases",
        "session",
        "user",
        "verification",
    ].map((name) => `public.${name} (BASE TABLE)`),
    ...[
        "delivery_adapter_type",
        "delivery_attempt_status",
        "delivery_status",
        "repair_status",
        "repair_type",
        "user_role",
    ].map((name) => `public.${name} (ENUM)`),
];

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const migrationsFolder = join(projectRoot, "drizzle");

function normalizeRows(result) {
    return Array.from(result);
}

function executorForPostgresClient(client) {
    return {
        async query(text, parameters = []) {
            return normalizeRows(await client.unsafe(text, parameters));
        },
        async transaction(callback) {
            return client.begin((transaction) =>
                callback(executorForPostgresClient(transaction)),
            );
        },
        async acquireMigrationLock() {
            await client.unsafe(
                "select pg_advisory_xact_lock(hashtext('necivia-database-migrations'))",
            );
        },
    };
}

export function requireDatabaseUrl(environment = process.env) {
    const value = environment.DATABASE_URL?.trim();

    if (!value) {
        throw new Error(
            "DATABASE_URL is required. Refusing to use a fallback database.",
        );
    }

    const parsed = new URL(value);

    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
        throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
    }

    return value;
}

export function describeDatabaseTarget(databaseUrl) {
    const parsed = new URL(databaseUrl);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const port = parsed.port ? `:${parsed.port}` : "";

    return `${parsed.hostname}${port}/${databaseName || "(default database)"}`;
}

export function safeDatabaseErrorMessage(error) {
    const message =
        error instanceof Error ? error.message : "Unknown database command failure.";

    return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-database-url]");
}

export function createPostgresMigrationConnection(databaseUrl) {
    const client = postgres(databaseUrl, {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 10,
        prepare: false,
    });

    return {
        executor: executorForPostgresClient(client),
        async close() {
            await client.end({ timeout: 5 });
        },
    };
}

export function loadLocalMigrations(folder = migrationsFolder) {
    const journal = JSON.parse(
        readFileSync(join(folder, "meta", "_journal.json"), "utf8"),
    );
    const migrationData = readMigrationFiles({ migrationsFolder: folder });

    if (
        journal.version !== "7" ||
        journal.dialect !== "postgresql" ||
        !Array.isArray(journal.entries) ||
        journal.entries.length !== migrationData.length
    ) {
        throw new Error("The Drizzle migration journal is malformed or incomplete.");
    }

    const seenTags = new Set();
    let previousTimestamp = -1;

    return journal.entries.map((entry, index) => {
        if (
            entry.idx !== index ||
            entry.version !== "7" ||
            typeof entry.tag !== "string" ||
            !entry.tag ||
            seenTags.has(entry.tag) ||
            !Number.isSafeInteger(entry.when) ||
            entry.when <= previousTimestamp
        ) {
            throw new Error(
                `Migration journal entry ${index} is malformed or out of order.`,
            );
        }

        seenTags.add(entry.tag);
        previousTimestamp = entry.when;
        const migration = migrationData[index];

        if (migration.folderMillis !== entry.when) {
            throw new Error(
                `Migration timestamp mismatch for ${entry.tag}.`,
            );
        }

        return {
            index,
            tag: entry.tag,
            hash: migration.hash,
            createdAt: entry.when,
            statements: migration.sql,
        };
    });
}

export function assessMigrationLedger(localMigrations, appliedRows) {
    const problems = [];
    const seenHashes = new Set();

    for (const [index, row] of appliedRows.entries()) {
        const hash = String(row.hash);
        const createdAt = Number(row.created_at);

        if (seenHashes.has(hash)) {
            problems.push(`Migration ledger contains duplicate hash ${hash}.`);
        }
        seenHashes.add(hash);

        const expected = localMigrations[index];

        if (!expected) {
            problems.push(
                `Migration ledger row ${index + 1} has no checked-in counterpart.`,
            );
            continue;
        }

        if (hash !== expected.hash || createdAt !== expected.createdAt) {
            problems.push(
                `Migration ledger row ${index + 1} does not match ${expected.tag}.`,
            );
        }
    }

    return {
        consistent: problems.length === 0,
        problems,
        appliedCount: appliedRows.length,
        pending: problems.length
            ? []
            : localMigrations.slice(appliedRows.length),
    };
}

async function listApplicationObjects(executor) {
    const relations = await executor.query(`
        select table_schema as schema_name,
               table_name as object_name,
               table_type as object_type
        from information_schema.tables
        where table_schema not in ('pg_catalog', 'information_schema')
          and table_schema not like 'pg_%'
        order by table_schema, table_name
    `);
    const enums = await executor.query(`
        select namespace.nspname as schema_name,
               type.typname as object_name,
               'ENUM' as object_type
        from pg_type as type
        join pg_namespace as namespace on namespace.oid = type.typnamespace
        where type.typtype = 'e'
          and namespace.nspname not in ('pg_catalog', 'information_schema')
          and namespace.nspname not like 'pg_%'
        order by namespace.nspname, type.typname
    `);
    const sequences = await executor.query(`
        select sequence_schema as schema_name,
               sequence_name as object_name,
               'SEQUENCE' as object_type
        from information_schema.sequences
        where sequence_schema not in ('pg_catalog', 'information_schema')
          and sequence_schema not like 'pg_%'
        order by sequence_schema, sequence_name
    `);

    return [...relations, ...enums, ...sequences].filter(
        (object) =>
            !(
                object.schema_name === MIGRATIONS_SCHEMA &&
                (object.object_name === MIGRATIONS_TABLE ||
                    object.object_name === `${MIGRATIONS_TABLE}_id_seq`)
            ),
    );
}

async function inspectMigrationMetadata(executor) {
    const [row] = await executor.query(
        `select to_regclass('${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}') is not null as exists`,
    );
    const exists = row?.exists === true;

    if (!exists) {
        return { exists: false, valid: false, columns: [] };
    }

    const columns = await executor.query(`
        select column_name, data_type
        from information_schema.columns
        where table_schema = '${MIGRATIONS_SCHEMA}'
          and table_name = '${MIGRATIONS_TABLE}'
        order by ordinal_position
    `);
    const columnNames = new Set(columns.map((column) => column.column_name));

    return {
        exists: true,
        valid: ["id", "hash", "created_at"].every((name) =>
            columnNames.has(name),
        ),
        columns,
    };
}

async function readAppliedMigrations(executor, metadata) {
    if (!metadata.valid) {
        return [];
    }

    return executor.query(`
        select id, hash, created_at
        from ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}
        order by id
    `);
}

export async function inspectMigrationState(executor, localMigrations) {
    const [identityRows, applicationObjects, metadata] = await Promise.all([
        executor.query(`
            select current_database() as database_name,
                   current_user as database_user,
                   current_schema() as current_schema
        `),
        listApplicationObjects(executor),
        inspectMigrationMetadata(executor),
    ]);
    const appliedRows = await readAppliedMigrations(executor, metadata);
    const assessment = assessMigrationLedger(localMigrations, appliedRows);

    if (metadata.exists && !metadata.valid) {
        assessment.consistent = false;
        assessment.pending = [];
        assessment.problems.push(
            `Migration metadata table is malformed; found columns: ${metadata.columns.map((column) => column.column_name).join(", ") || "none"}.`,
        );
    }
    const councilsExists = applicationObjects.some(
        (object) =>
            object.schema_name === "public" &&
            object.object_name === "councils" &&
            object.object_type === "BASE TABLE",
    );
    const missingRequiredObjects = findMissingRequiredObjects(applicationObjects);
    const schemaComplete = missingRequiredObjects.length === 0;

    return {
        identity: identityRows[0],
        applicationObjects,
        metadata,
        metadataExists: metadata.exists,
        appliedRows,
        assessment,
        councilsExists,
        missingRequiredObjects,
        schemaComplete,
        ready:
            councilsExists &&
            schemaComplete &&
            metadata.valid &&
            assessment.consistent &&
            assessment.pending.length === 0,
    };
}

async function ensureMigrationMetadata(executor) {
    await executor.query(`create schema if not exists ${MIGRATIONS_SCHEMA}`);
    await executor.query(`
        create table if not exists ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} (
            id serial primary key,
            hash text not null,
            created_at bigint not null
        )
    `);
}

async function applyMigrations(executor, migrations) {
    for (const migration of migrations) {
        for (const statement of migration.statements) {
            await executor.query(statement);
        }

        await executor.query(
            `insert into ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} (hash, created_at) values ($1, $2)`,
            [migration.hash, migration.createdAt],
        );
    }
}

function describeObjects(objects) {
    return objects
        .map(
            (object) =>
                `${object.schema_name}.${object.object_name} (${object.object_type})`,
        )
        .join(", ");
}

function objectIdentity(object) {
    return `${object.schema_name}.${object.object_name} (${object.object_type})`;
}

function findMissingRequiredObjects(applicationObjects) {
    const present = new Set(applicationObjects.map(objectIdentity));
    return requiredNeciviaObjects.filter((object) => !present.has(object));
}

async function runStrictMigration(
    transaction,
    localMigrations,
    initialState,
) {
    let state = initialState;

    if (!state.assessment.consistent) {
        throw new Error(
            `Migration metadata is inconsistent: ${state.assessment.problems.join(" ")} Run npm run db:status and use the explicit bootstrap only for a verified empty database.`,
        );
    }

    if (state.councilsExists && !state.schemaComplete) {
        throw new Error(
            `The Necivia application schema is partial. Missing required objects: ${state.missingRequiredObjects.join(", ")}. Refusing to migrate or delete data.`,
        );
    }

    if (state.appliedRows.length === 0 && state.applicationObjects.length > 0) {
        throw new Error(
            `The migration ledger is empty but application objects already exist: ${describeObjects(state.applicationObjects)}. Refusing to guess or overwrite schema state.`,
        );
    }

    if (state.appliedRows.length > 0 && !state.councilsExists) {
        throw new Error(
            "The migration ledger contains rows but public.councils is absent. Refusing a false-success migration.",
        );
    }

    const pendingMigrations = state.assessment.pending;

    await ensureMigrationMetadata(transaction);
    await applyMigrations(transaction, pendingMigrations);
    state = await inspectMigrationState(transaction, localMigrations);

    if (!state.ready) {
        throw new Error(
            "Migration verification failed after applying pending migrations; the transaction was rolled back.",
        );
    }

    return {
        applied: pendingMigrations,
        state,
    };
}

async function runEmptyDatabaseBootstrap(
    transaction,
    localMigrations,
    initialState,
) {
    let state = initialState;

    if (state.ready) {
        return {
            alreadyReady: true,
            repairedMetadataRows: 0,
            applied: [],
            state,
        };
    }

    if (state.applicationObjects.length > 0) {
        throw new Error(
            `Database bootstrap is allowed only when no application objects exist. Found: ${describeObjects(state.applicationObjects)}. No changes were made.`,
        );
    }

    let repairedMetadataRows = 0;

    if (state.metadata.exists && !state.metadata.valid) {
        await transaction.query(
            `drop table ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`,
        );
    } else if (state.metadata.valid) {
        const [countRow] = await transaction.query(
            `select count(*)::integer as count from ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`,
        );
        repairedMetadataRows = Number(countRow?.count ?? 0);
    }

    await ensureMigrationMetadata(transaction);

    if (repairedMetadataRows > 0) {
        await transaction.query(
            `delete from ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`,
        );
    }

    await applyMigrations(transaction, localMigrations);
    state = await inspectMigrationState(transaction, localMigrations);

    if (!state.ready) {
        throw new Error(
            "Bootstrap verification failed; the schema and metadata transaction was rolled back.",
        );
    }

    return {
        alreadyReady: false,
        repairedMetadataRows,
        applied: localMigrations,
        state,
    };
}

export async function deployPendingMigrations(executor, localMigrations) {
    if (localMigrations.length === 0) {
        throw new Error("No checked-in migrations were found.");
    }

    return executor.transaction(async (transaction) => {
        await transaction.acquireMigrationLock?.();
        const state = await inspectMigrationState(transaction, localMigrations);
        return runStrictMigration(transaction, localMigrations, state);
    });
}

export async function bootstrapEmptyDatabase(executor, localMigrations) {
    if (localMigrations.length === 0) {
        throw new Error("No checked-in migrations were found.");
    }

    return executor.transaction(async (transaction) => {
        await transaction.acquireMigrationLock?.();
        const state = await inspectMigrationState(transaction, localMigrations);
        return runEmptyDatabaseBootstrap(transaction, localMigrations, state);
    });
}

export async function deployDatabase(executor, localMigrations) {
    if (localMigrations.length === 0) {
        throw new Error("No checked-in migrations were found.");
    }

    return executor.transaction(async (transaction) => {
        await transaction.acquireMigrationLock?.();
        const state = await inspectMigrationState(transaction, localMigrations);

        if (state.councilsExists) {
            const result = await runStrictMigration(
                transaction,
                localMigrations,
                state,
            );
            return { mode: "migration", ...result };
        }

        if (state.applicationObjects.length === 0) {
            const result = await runEmptyDatabaseBootstrap(
                transaction,
                localMigrations,
                state,
            );
            return { mode: "bootstrap", ...result };
        }

        throw new Error(
            `First-run bootstrap refused: public.councils is absent, but application objects exist: ${describeObjects(state.applicationObjects)}. No schema objects or data were changed.`,
        );
    });
}

export function printMigrationStatus({ databaseTarget, localMigrations, state }) {
    const identity = state.identity ?? {};

    process.stdout.write(`Database target: ${databaseTarget}\n`);
    process.stdout.write(
        `Connected identity: database=${identity.database_name ?? "unknown"}, user=${identity.database_user ?? "unknown"}, schema=${identity.current_schema ?? "unknown"}\n`,
    );
    process.stdout.write(
        `public.councils: ${state.councilsExists ? "present" : "absent"}\n`,
    );
    process.stdout.write(
        `Required Necivia schema: ${state.schemaComplete ? "complete" : `partial or absent; missing ${state.missingRequiredObjects.join(", ")}`}\n`,
    );
    process.stdout.write(
        `Drizzle metadata: ${state.metadataExists ? `${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} present${state.metadata.valid ? "" : " but malformed"}` : "absent"}\n`,
    );
    process.stdout.write("Checked-in migrations:\n");

    for (const migration of localMigrations) {
        process.stdout.write(
            `  ${migration.tag}  ${migration.hash}  ${migration.createdAt}\n`,
        );
    }

    process.stdout.write("Applied migration rows:\n");
    if (state.appliedRows.length === 0) {
        process.stdout.write("  (none)\n");
    } else {
        for (const row of state.appliedRows) {
            const local = localMigrations.find(
                (migration) => migration.hash === String(row.hash),
            );
            process.stdout.write(
                `  id=${row.id}  ${local?.tag ?? "UNKNOWN"}  ${row.hash}  ${row.created_at}\n`,
            );
        }
    }

    if (!state.assessment.consistent) {
        for (const problem of state.assessment.problems) {
            process.stdout.write(`Metadata problem: ${problem}\n`);
        }
    }

    process.stdout.write(
        `Pending migrations: ${state.assessment.consistent ? state.assessment.pending.map((migration) => migration.tag).join(", ") || "none" : "unknown until metadata is repaired"}\n`,
    );
    process.stdout.write(`Schema ready for seed: ${state.ready ? "YES" : "NO"}\n`);
}
