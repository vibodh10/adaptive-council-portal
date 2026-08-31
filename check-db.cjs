// Backward-compatible local diagnostic alias. The maintained command is
// `npm run db:status`, which redacts credentials and verifies migration hashes.
void import("./scripts/database-status.mjs");
