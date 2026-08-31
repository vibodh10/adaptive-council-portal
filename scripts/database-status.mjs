import {
    createPostgresMigrationConnection,
    describeDatabaseTarget,
    inspectMigrationState,
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
        const state = await inspectMigrationState(
            connection.executor,
            localMigrations,
        );
        printMigrationStatus({
            databaseTarget: describeDatabaseTarget(databaseUrl),
            localMigrations,
            state,
        });

        if (!state.ready) {
            process.exitCode = 1;
        }
    } finally {
        await connection.close();
    }
}

main().catch((error) => {
    process.stderr.write(`Database status failed: ${safeDatabaseErrorMessage(error)}\n`);
    process.exitCode = 1;
});
