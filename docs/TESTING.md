# Testing guide

## Automated checks

The automated suite uses Node’s test runner and an embedded PGlite database. It
applies the checked-in PostgreSQL migrations and does not contact Railway,
production PostgreSQL, the private bucket or a real webhook.

```bash
npm run lint
npm test
npm run build
git diff --check
```

Coverage includes:

- shared repair validation, including real/non-future dates and answered safety
  booleans;
- Better Auth resident/staff password login, fresh sessions, logout
  invalidation, generic bad-password failure and disabled sign-up;
- unauthenticated submission and case-read rejection;
- server-side persistence, unique references and idempotency;
- rejection of client-supplied server fields;
- resident ownership, staff tenant isolation, status permissions and audits;
- attachment IDOR prevention;
- partial attachment failure cleanup without an abandoned case reservation;
- JPEG/PNG/WebP signature acceptance and SVG/executable/MIME/size/count
  rejection;
- durable 429 behavior, origin checks, webhook URL/HMAC safety and sandbox
  delivery, including truthful failed-delivery state and staff retry; and
- all six WebMCP definitions, schemas, authentication behavior, review boundary
  and registration lifecycle.

## Local authenticated journey

1. Configure `.env.local` from `.env.example` with a local PostgreSQL database.
2. Run `npm run db:deploy` and `npm run db:seed`.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Confirm the fictional-tenant notice is visible when `DEMO_MODE=true`.
5. Before signing in, confirm Page Support works and the repair form is not
   available.
6. Sign in with the resident seed account supplied through environment
   variables.
7. Complete the housing repair, optionally attach safe test images, review the
   report and click **Confirm and submit**.
8. Confirm no success/reference appears before server acknowledgement.
9. Refresh `/repairs`; confirm the case persists.
10. Sign out, sign in as staff, and confirm the case appears at
    `/staff/repairs` with delivery and danger state.
11. Change the workflow status and confirm the activity history updates.

Status: **NOT YET MANUALLY RE-RUN AFTER PRODUCTION HARDENING**.

## WebMCP checks

In a supported Chrome build, verify exactly these tools:

1. `get_experience_preferences`
2. `adapt_experience`
3. `get_housing_repair_requirements`
4. `get_housing_repair_draft`
5. `update_housing_repair_draft`
6. `open_housing_repair_review`

There must be no submission/login/password tool.

Before resident login:

- adaptation and public requirements must work;
- repair draft/update/review must return `AUTH_REQUIRED`; and
- no repair state may change.

After resident login, repeat the shared-draft and review invocations in
[WEBMCP_EVALS.md](WEBMCP_EVALS.md). Confirm the visible **Confirm and submit**
button is still required and the tool response never contains a persistent
reference.

Confirmed observations supplied for this project:

- explicit “use this website’s site tools only” selected `adapt_experience`;
- the natural request about small writing and hard-to-tap buttons later selected
  `adapt_experience` without mentioning site tools; and
- production Chrome returned six tools from
  `document.modelContext.getTools()`.

Do not mark any other manual evaluation as passed without recording it.

## Security smoke tests

- Directly request another resident’s case/attachment ID; expect not found.
- Use a staff session from another tenant; expect not found.
- Send a mutation with a mismatched `Origin`; expect 403.
- Retry one idempotency key; expect the same case/reference.
- Rename an executable/SVG to `.jpg`; expect upload rejection.
- Exceed login, submission and upload limits in a non-production test database;
  expect structured 429 responses.
- Configure sandbox mode and verify no external request occurs.
- Configure a controlled test webhook and verify HMAC, timeout, no redirects and
  safe failure metadata.
