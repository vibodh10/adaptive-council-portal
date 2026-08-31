import {
    createPostgresMigrationConnection,
    deployDatabase,
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
        const result = await deployDatabase(
            connection.executor,
            localMigrations,
        );

        if (result.mode === "bootstrap") {
            process.stdout.write(
                `Deployment mode: first-run bootstrap. Verified an empty application database and repaired ${result.repairedMetadataRows} stale migration metadata row(s).\n`,
            );
        } else {
            process.stdout.write(
                "Deployment mode: normal strict migration.\n",
            );
        }

        process.stdout.write(
            result.applied.length > 0
                ? `Applied migrations: ${result.applied.map((migration) => migration.tag).join(", ")}\n`
                : "Database already has every checked-in migration.\n",
        );
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
    process.stderr.write(`Database migration failed: ${safeDatabaseErrorMessage(error)}\n`);
    process.exitCode = 1;
});
