# Testing guide

Necivia uses automated domain/security tests, WebMCP tool-selection evaluations,
manual browser verification and production end-to-end testing.

## Current verification status

- **Automated Node tests:** 20 passed, 0 failed
- **ESLint:** passed
- **Production build:** passed
- **`git diff --check`:** passed
- **Final WebMCP automated selection suite:** 11/11 passed, 100.0%
- **Production resident/staff journey:** passed
- **Production WebMCP registration:** six tools confirmed

## Automated checks

Run:

```bash
npm run lint
npm test
npm run build
git diff --check
```

The automated test suite uses Node's test runner and an embedded PGlite
database. It applies the checked-in PostgreSQL migrations and does not contact
Railway production PostgreSQL, the private production bucket or a real council
webhook.

Coverage includes:

- shared repair validation, including real/non-future dates and required safety
  booleans;
- Better Auth resident/staff password login, fresh sessions, logout
  invalidation, generic bad-password failure and disabled public sign-up;
- unauthenticated submission and case-read rejection;
- server-side persistence, server-generated unique references and idempotency;
- rejection of client-supplied server fields;
- resident ownership and staff tenant isolation;
- staff-only workflow status changes and audit events;
- attachment IDOR prevention;
- cleanup after partial attachment/upload failures;
- JPEG, PNG and WebP signature acceptance;
- SVG, executable, mismatched MIME, oversized and excessive upload rejection;
- origin checks and durable rate limiting;
- sandbox delivery and webhook URL/HMAC protections;
- truthful failed-delivery state and staff retry;
- all six WebMCP definitions, schemas and authentication boundaries;
- review without WebMCP submission;
- WebMCP registration lifecycle cleanup;
- checked-in migration journal ordering and hashes;
- safe blank/poisoned-ledger first-run database deployment;
- strict initialized-database migration and idempotency;
- refusal to reset partial or unexpected application schemas; and
- proof that deployment never silently runs the separate seed operation.

Current result:

**20 passed, 0 failed.**

## Production authenticated journey

The production application is:

`https://necivia.up.railway.app`

The following end-to-end journey has been manually verified:

1. Visit Housing Repair while signed out.
2. Confirm Page Support remains available but resident repair data does not.
3. Sign in with the fictional demo resident account.
4. Complete a Housing Repair using synthetic test information.
5. Review the visible report.
6. Manually press **Confirm and submit**.
7. Confirm a server-generated persistent repair reference is returned.
8. Refresh the resident repair history and confirm the case persists.
9. Sign out.
10. Sign in with the fictional demo staff account.
11. Confirm the same case/reference appears in the tenant-scoped staff inbox.
12. Open the case and verify its persisted details.
13. Change workflow status and confirm the change persists.
14. Sign out and confirm protected resident/staff information is unavailable.
15. Verify the production page still exposes exactly six WebMCP tools.

Status:

**PASS — production end-to-end verification completed after production
hardening and database seeding.**

## Production WebMCP checks

Production browser:

**Google Chrome 152.0.7977.65 (Official Build) (64-bit)** with WebMCP testing
enabled.

The production page exposes exactly:

1. `get_experience_preferences`
2. `adapt_experience`
3. `get_housing_repair_requirements`
4. `get_housing_repair_draft`
5. `update_housing_repair_draft`
6. `open_housing_repair_review`

There is no WebMCP:

- submission tool;
- login/password tool; or
- case-reference creation tool.

Before resident login:

- adaptation remains available;
- repair requirements remain available;
- draft read/update/review return structured `AUTH_REQUIRED`; and
- repair state cannot be changed.

After resident login:

- draft read/update operate on the same visible draft as the resident;
- shared validation applies to WebMCP updates;
- review can be opened only through the review capability;
- review does not create a persistent case/reference; and
- the visible **Confirm and submit** action remains required.

## ChatGPT Site Tools observations

Captured observations include:

- an explicit “use this website's site tools only” request selected
  `adapt_experience`;
- the natural request about small writing and hard-to-tap controls selected
  `adapt_experience` without mentioning Site Tools; and
- the production Site Tools interface exposed six Necivia tools.

Evidence:

`docs/evidence/webmcp/WMCP-EXPLICIT-01-explicit-site-tools.png`

`docs/evidence/webmcp/WMCP-01-natural-adaptation.png`

## Automated WebMCP selection evaluation

WMCP-02 through WMCP-12 were evaluated against the production URL using
WebMCP Evals with `openai:gpt-5.2`.

Final command:

```bash
npx webmcp-evals browser -u https://necivia.up.railway.app -e docs/evidence/webmcp/wmcp-02-to-12-final-evals.json -b vercel -m openai:gpt-5.2 --chrome-channel chrome --reporter console json html --open
```

Final result:

**11 passed / 11 total — 100.0%, 0 failures, 0 errors.**

This suite evaluates natural-language WebMCP tool selection. Because its
browser session is fresh and unauthenticated, authenticated draft execution is
verified separately through the signed-in production journey and functional
browser evidence.

Final reports:

- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-report.html`
- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-report.json`
- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-summary.png`

See [WEBMCP_EVALS.md](WEBMCP_EVALS.md) for individual cases.

## Security smoke tests

Automated coverage includes:

- cross-resident case/attachment denial;
- cross-tenant staff denial;
- mismatched-origin mutation rejection;
- idempotency replay;
- executable/SVG disguised as image rejection;
- login/submission/upload rate limiting;
- sandbox delivery isolation;
- webhook HMAC signing and URL restrictions; and
- preservation of application data when migration state is unsafe.

Production testing uses synthetic demo information only.