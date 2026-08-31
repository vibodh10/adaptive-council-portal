import {
    bootstrapEmptyDatabase,
    createPostgresMigrationConnection,
    describeDatabaseTarget,
    loadLocalMigrations,
    printMigrationStatus,
    requireDatabaseUrl,
    safeDatabaseErrorMessage,
} from "./database-migrations.mjs";

async function main() {
    const databaseUrl = requireDatabaseUrl();
    const connection = createPostgresMigrationConnection(databaseUrl);

    try {
        const localMigrations = loadLocalMigrations();
        const result = await bootstrapEmptyDatabase(
            connection.executor,
            localMigrations,
        );

        if (result.alreadyReady) {
            process.stdout.write(
                "Database schema and migration metadata are already ready.\n",
            );
        } else {
            process.stdout.write(
                `Created the Necivia schema from checked-in migrations. Repaired metadata rows: ${result.repairedMetadataRows}.\n`,
            );
        }

        printMigrationStatus({
            databaseTarget: describeDatabaseTarget(databaseUrl),
            localMigrations,
            state: result.state,
        });
    } finally {
        await connection.close();
    }
}

main().catch((error) => {
    process.stderr.write(`Database bootstrap failed: ${safeDatabaseErrorMessage(error)}\n`);
    process.exitCode = 1;
});
