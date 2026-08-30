# Necivia

Necivia is a secure council-service platform that lets people and assisting
agents work through the same visible, accessible service journey. The live
demonstration is hosted at [necivia.up.railway.app](https://necivia.up.railway.app).

Westbridge Council is a **fictional demonstration tenant**. Use synthetic test
information only. Production councils connect an authorised case-management
endpoint through Necivia’s delivery adapter.

## The problem

Council forms can be hard to use when someone is tired, stressed, has an
accessibility need, or needs help describing a repair. Generic browser
automation can also take a different route from the validation and safety
boundaries protecting human submissions.

Necivia keeps one shared journey:

```text
resident describes a need
→ an agent may adapt the visible page and prepare the shared draft
→ the resident reviews the actual visible report
→ the resident clicks Confirm and submit
→ the server authenticates, authorises, limits and revalidates
→ PostgreSQL stores the case and audit event
→ the configured council delivery adapter runs
→ the server returns the persisted reference
```

There is deliberately no WebMCP submission tool. An agent cannot create a
persistent case, generate a reference, or replace the resident’s final click.

## Flagship journey

Housing Repair supports:

- normal and step-by-step presentation;
- plain-language, reduced-clutter, large-text, large-control and reduced-motion
  preferences;
- one shared human/WebMCP draft;
- required safety questions and immediate-danger guidance;
- authenticated review and server-side submission;
- idempotent PostgreSQL case creation and server-only references;
- up to five private JPEG, PNG or WebP photographs;
- resident case history;
- a tenant-scoped staff repair inbox and workflow statuses; and
- truthful sandbox or authorised-webhook delivery state.

The older missed-bin source remains only as a secondary code example and is not
linked from the production service or presented as a real submission path.

## WebMCP

The six existing tool names are preserved:

| Tool | Purpose | Authentication |
| --- | --- | --- |
| `get_experience_preferences` | Read visible Page Support settings | Public |
| `adapt_experience` | Adapt the current visible page | Public |
| `get_housing_repair_requirements` | Explain repair fields and rules | Public |
| `get_housing_repair_draft` | Read the resident’s shared draft | Resident |
| `update_housing_repair_draft` | Update supplied shared-draft fields | Resident |
| `open_housing_repair_review` | Validate and visibly open review | Resident |

Free-text draft output remains marked as untrusted. Unauthenticated repair
draft/update/review calls return a structured `AUTH_REQUIRED` result. There is
no WebMCP login, password or submit capability.

## Production architecture

- **Next.js App Router / React / TypeScript / Tailwind CSS** provide the civic
  resident and staff interface.
- **Better Auth** provides database-backed email/password sessions. Public
  sign-up is disabled; demo accounts are provisioned by an idempotent seed.
- **Drizzle ORM / PostgreSQL** store tenants, users, sessions, cases,
  attachments, delivery attempts, audits and rate-limit buckets.
- **AWS S3 SDK** talks to the private Railway S3-compatible bucket. Objects are
  retrieved only through the authorised backend.
- **CouncilDeliveryAdapter** selects the Westbridge sandbox by default or a
  statically configured HTTPS/HMAC webhook.
- **Zod plus shared domain validation** reject unknown fields and revalidate
  the complete repair on the server.

See [Production architecture](docs/PRODUCTION_ARCHITECTURE.md) and
[Security model](docs/SECURITY_MODEL.md).

## Authentication and authorisation

- Server sessions use HttpOnly, SameSite=Lax cookies, Secure cookies in
  production and finite eight-hour expiry.
- Tenant and role come from the authenticated database session, never client
  input.
- Residents can only query cases and attachments matching their tenant and user
  ID.
- Staff can only query cases and attachments matching their tenant.
- Only staff can change workflow status or retry failed delivery.
- Every protected route and mutation rechecks its server session.

## Persistence, attachments and delivery

The final visible confirmation sends multipart data to `POST /api/repairs`.
The server validates the idempotency UUID, strict repair schema, file count,
file sizes, MIME declarations and image magic bytes before acknowledging a
case. References and all identity/tenant fields are generated or derived on the
server.

Westbridge sandbox delivery means the persisted case appears in the
authenticated Westbridge staff inbox; it is not an external or real-council
integration. Optional webhook delivery requires a deploy-time HTTPS endpoint
and secret, rejects local/private/reserved targets, signs the normalized body
with HMAC-SHA256, times out, follows no redirects and records only safe response
metadata.

## Local setup

Requirements: Node.js 20.9+, npm and PostgreSQL.

```bash
npm install
copy .env.example .env.local
npm run db:deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Replace every placeholder
in `.env.local`; never use the example credentials in production.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `AUTH_SECRET` | Yes | At least 32 random characters for Better Auth |
| `BETTER_AUTH_URL` | Yes | Exact public application origin |
| `DEMO_MODE` | Demo | Shows the demo notice and permits demo seeding |
| `DEMO_RESIDENT_EMAIL` | Seed | Resident demo email |
| `DEMO_RESIDENT_PASSWORD` | Seed | Resident demo password |
| `DEMO_STAFF_EMAIL` | Seed | Staff demo email |
| `DEMO_STAFF_PASSWORD` | Seed | Staff demo password |
| `S3_BUCKET` | Uploads | Private bucket name |
| `S3_ACCESS_KEY_ID` | Uploads | Server-only bucket key ID |
| `S3_SECRET_ACCESS_KEY` | Uploads | Server-only bucket secret |
| `S3_REGION` | Uploads | Bucket region |
| `S3_ENDPOINT` | Uploads | S3-compatible endpoint |
| `COUNCIL_DELIVERY_MODE` | No | `sandbox` (default) or `webhook` |
| `COUNCIL_WEBHOOK_URL` | Webhook | Authorised static HTTPS endpoint |
| `COUNCIL_WEBHOOK_SECRET` | Webhook | HMAC secret, at least 32 characters |

Railway bucket variables should be connected using Railway Variable
References—not copied into source. See [Deployment](docs/DEPLOYMENT.md).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run db:generate` | Generate reviewed SQL migrations from the schema |
| `npm run db:migrate` | Apply checked-in migrations locally |
| `npm run db:deploy` | Apply checked-in migrations in deployment |
| `npm run db:seed` | Idempotently seed the fictional Westbridge tenant/users |
| `npm run lint` | Run ESLint |
| `npm test` | Run domain, auth, database, security and WebMCP tests |
| `npm run build` | Create/type-check the production build without connecting to a DB |
| `npm start` | Serve the production build |

## Privacy and challenge evidence

The demo is for synthetic data. Production deployments should be operated
under the relevant council/controller arrangements. Necivia is designed to
hand cases to an authorised council system; this repository does not claim a
regulatory certification or compliance status.

- [Testing guide](docs/TESTING.md)
- [WebMCP evaluation plan](docs/WEBMCP_EVALS.md)
- [Build evidence](docs/BUILD_EVIDENCE.md)
- [Evidence checklist](docs/EVIDENCE_CHECKLIST.md)

## License

Licensed under the [MIT License](LICENSE).
