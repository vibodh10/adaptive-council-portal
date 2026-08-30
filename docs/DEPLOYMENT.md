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

## Migration and seed

From an environment with `DATABASE_URL` connected to the intended database:

```bash
npm ci
npm run db:deploy
npm run db:seed
```

`db:deploy` applies checked-in migrations and records them in Drizzle’s
migration table. It does not reset data. `db:seed` requires `DEMO_MODE=true`,
creates or updates the fictional Westbridge tenant and the two environment-
specified demo users, hashes their passwords, and is safe to run repeatedly.

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

1. Run migrations and seed once.
2. Sign in with the private resident demo credentials.
3. Submit a synthetic repair and confirm the server reference persists after a
   refresh.
4. Sign out, then sign in as staff and verify the case appears in the inbox.
5. Confirm another tenant/user cannot access the case or attachment URL.
6. Confirm the private bucket contains generated keys and no public URL.
7. In supported production Chrome, verify
   `document.modelContext.getTools()` still returns exactly six tools and no
   submission tool.
