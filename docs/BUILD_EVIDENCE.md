# Build evidence

Last updated: 30 August 2026 (Europe/London)

This record distinguishes automated evidence from production/manual checks.

## Implemented architecture

- Necivia product branding with fictional Westbridge tenant disclosure.
- Better Auth email/password sessions with disabled public sign-up and
  environment-driven idempotent demo seeding.
- Drizzle/PostgreSQL schema and checked-in migrations for tenants, auth, cases,
  attachments, delivery, audits and durable rate limiting.
- Authenticated, idempotent server case creation with server-only references.
- Private S3-compatible uploads with image signature validation and authorised
  retrieval.
- Westbridge sandbox and optional static HTTPS/HMAC webhook delivery adapters.
- Resident case history and tenant-scoped staff inbox/detail/status workflow.
- Existing six WebMCP tools and shared provider state retained; privileged
  repair handlers now return `AUTH_REQUIRED` without a resident session.

## Human confirmation evidence in source/tests

- No WebMCP submission tool is registered.
- `HousingRepairForm` is the only visible caller of `POST /api/repairs`.
- The browser no longer generates a housing reference.
- The server parses a strict schema, ignores no unknown fields, derives tenant
  and resident from the session, reserves a unique idempotent case, stores an
  audit event, invokes delivery and returns the persisted reference.
- WebMCP review responses still return `submitted: false` and `reference: null`.

## Automated evidence observed during implementation

The final command results are recorded in the final task report after all
changes are complete. During implementation, focused checks observed:

- Better Auth integration: resident/staff login passed; bad password remained
  generic; public sign-up was disabled.
- PostgreSQL service integration: unauthenticated routes rejected; valid cases
  persisted; idempotent replay did not duplicate; cross-resident and
  cross-tenant reads failed; attachment IDOR failed; staff status audit passed.
- Security: JPEG/PNG/WebP magic bytes passed; SVG/executable/MIME/size/count
  failures were rejected; durable 429, cross-origin rejection, sandbox truth
  and webhook HMAC/SSRF checks passed. Partial upload cleanup and truthful
  failed-delivery retry behavior also passed.
- Existing domain/WebMCP tests remained green, including exactly six tools and
  no submission capability.
- `npm audit` reported no high or critical advisories. Four moderate advisories
  remain in Drizzle Kit's legacy esbuild loader chain; npm's only proposed fix
  is a breaking downgrade to Drizzle Kit 0.18.1, so it was not applied.

## Confirmed manual WebMCP observations supplied by the project owner

- Explicit Site Tools prompt selected `adapt_experience`: **PASS**.
- Natural small-text/hard-to-tap prompt selected `adapt_experience` without
  mentioning Site Tools: **PASS**.
- Live production Chrome exposed `document.modelContext` and returned six
  registered tools: **PASS**.

No other manual scenario is claimed. Screenshots remain not captured unless
the evidence checklist says otherwise.

## Outstanding production verification

- Apply migrations and run the seed against Railway PostgreSQL.
- Map Railway bucket variables by reference and run a private upload/retrieval
  smoke test.
- Re-run the full resident/staff journey at the live URL.
- Confirm cookie flags and response security headers in production HTTPS.
- Re-run signed-in/unsigned WebMCP behavior in supported Chrome.
- If webhook mode will be used, test only against an explicitly authorised
  endpoint.

No deployment, commit or push was performed by this implementation task.
