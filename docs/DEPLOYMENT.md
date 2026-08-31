# Railway deployment

Production URL: [https://necivia.up.railway.app](https://necivia.up.railway.app)

No deployment is performed by this repository change. Complete these steps in
the existing Railway project after reviewing the migration and environment.

## Application variables

Configure server-only variables on the Next.js service:

```text
DATABASE_URL
AUTH_SECRET
BETTER_AUTH_URL=https://necivia.up.railway.app
DEMO_MODE=true
DEMO_RESIDENT_EMAIL
DEMO_RESIDENT_PASSWORD
DEMO_STAFF_EMAIL
DEMO_STAFF_PASSWORD
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_REGION
S3_ENDPOINT
COUNCIL_DELIVERY_MODE=sandbox
COUNCIL_WEBHOOK_URL            # optional, webhook mode only
COUNCIL_WEBHOOK_SECRET         # optional, webhook mode only
```

Generate `AUTH_SECRET` and demo passwords outside source control. Do not place
secrets in `NEXT_PUBLIC_*` variables, build logs or the public README.

## Railway bucket references

The private bucket service exposes:

```text
BUCKET
ACCESS_KEY_ID
SECRET_ACCESS_KEY
REGION
ENDPOINT
```

Use Railway Variable References from the app service rather than copying the
values manually:

```text
S3_BUCKET              -> bucket.BUCKET
S3_ACCESS_KEY_ID       -> bucket.ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY   -> bucket.SECRET_ACCESS_KEY
S3_REGION              -> bucket.REGION
S3_ENDPOINT            -> bucket.ENDPOINT
```

Keep the bucket private. Do not configure a public object URL.

## Migration status and execution

Necivia does not use `drizzle-kit migrate` in deployment. In the installed
Drizzle ORM 0.45.2 path, PostgreSQL migration application uses the greatest
`created_at` value in `drizzle.__drizzle_migrations` as a single high-water
mark. A stale row with a later value can therefore make the CLI skip
checked-in migrations whose hashes were never applied while still exiting
successfully.

The permanent `npm run db:deploy` command chooses one of two paths under one
transaction and PostgreSQL advisory lock:

- **Initialized database:** when `public.councils` exists, validate every
  ledger row against the ordered checked-in hash and timestamp, refuse a
  partial schema, apply pending SQL and ledger inserts, and verify the result.
- **First deployment:** when `public.councils` is absent, enumerate application
  tables, views, enums and sequences. Only when none exist may it reuse the
  empty-database bootstrap, repair stale Drizzle metadata, apply all checked-in
  migrations, and verify the result.

If `public.councils` is absent but any application object exists, or if an
initialized schema/ledger is partial or inconsistent, deployment aborts without
deleting or resetting application data. Railway logs identify either
`first-run bootstrap`, `normal strict migration`, or the precise refusal
reason.

Inspect a target without changing it:

```bash
npm run db:status
```

The command prints the host and database without URL credentials, connected
database identity, whether `public.councils` and Drizzle metadata exist, every
local and applied migration hash, pending migrations, and whether seeding is
safe. It exits non-zero until the complete schema is ready.

### Railway pre-deploy and first deployment

Keep the already-saved Railway pre-deploy command unchanged from the first
successful deployment onward:

```bash
npm run db:deploy
```

The first run safely selects bootstrap only after proving the application
database is empty. Subsequent runs see the complete Necivia schema and select
normal strict migration. The explicit `npm run db:bootstrap` command remains
available for diagnosis or emergency recovery, but Railway does not need it as
its pre-deploy setting.

After the first deployment, confirm its logs show `Deployment mode: first-run
bootstrap` and end with `Schema ready for seed: YES`.

Seeding remains a separate operator action. For one later deployment, after
the migration deployment has succeeded, temporarily use:

```bash
npm run db:status && npm run db:seed
```

The status command must return success before the idempotent Westbridge seed
runs. After that deployment succeeds, restore the permanent pre-deploy command
to `npm run db:deploy`. `db:deploy` itself never invokes the seed.

Outside Railway, the equivalent post-bootstrap commands are:

```bash
npm run db:status
npm run db:seed
```

The seed remains idempotent and explicitly fails before writing if the schema
or migration metadata is incomplete.

The private Railway hostname does not need to be reachable through local
`railway run` or SSH for this flow; migration and seeding execute inside normal
Railway pre-deploy environments.

## Initial installation and seed

From an environment with `DATABASE_URL` connected to the intended database:

```bash
npm ci
npm run db:deploy
npm run db:status
npm run db:seed
```

For a verified-empty database, `db:deploy` safely bootstraps even when Drizzle
metadata is poisoned. For an initialized database, it applies only pending
checked-in migrations and records exact hashes. It does not reset application
data and never seeds. `db:seed` requires `DEMO_MODE=true`, creates or updates
the fictional Westbridge tenant and the two environment-specified demo users,
hashes their passwords, and is safe to run repeatedly.

Do not run `drizzle-kit push`, an interactive migration command or a database
reset in production.

## Build/start

```bash
npm run lint
npm test
npm run build
npm start
```

The build does not connect to PostgreSQL. Protected runtime requests fail
closed if `DATABASE_URL` or `AUTH_SECRET` is missing.

## Delivery modes

`sandbox` is the default and recommended challenge setting. It means the real
persisted case is available in the Westbridge staff inbox; no external council
is contacted.

Use `webhook` only when a council-authorised HTTPS endpoint has been supplied.
Configure a secret of at least 32 characters. The adapter signs the exact body
in `X-Necivia-Signature: sha256=<hex>` and sends the internal reference in
`X-Necivia-Reference`. Failed delivery is recorded and may be retried by
authenticated staff.

## Post-deploy checks

1. Run `npm run db:deploy`, status, and then the separate seed once.
2. Sign in with the private resident demo credentials.
3. Submit a synthetic repair and confirm the server reference persists after a
   refresh.
4. Sign out, then sign in as staff and verify the case appears in the inbox.
5. Confirm another tenant/user cannot access the case or attachment URL.
6. Confirm the private bucket contains generated keys and no public URL.
7. In supported production Chrome, verify
   `document.modelContext.getTools()` still returns exactly six tools and no
   submission tool.
