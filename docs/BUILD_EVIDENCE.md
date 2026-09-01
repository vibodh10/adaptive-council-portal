# Build evidence

Last updated: 1 September 2026 (Europe/London)

This record distinguishes implementation evidence, automated verification,
WebMCP evaluation and production/manual verification.

## Implemented architecture

- Necivia product branding with fictional Westbridge Council tenant disclosure.
- Next.js App Router, React, TypeScript and Tailwind CSS resident/staff UI.
- Better Auth email/password database sessions.
- Public account sign-up disabled.
- Environment-driven idempotent resident/staff demo seeding.
- Drizzle/PostgreSQL persistence for councils, users, sessions, repair cases,
  attachments, delivery attempts, audit events and durable abuse controls.
- Safe first-run database deployment with strict migration-ledger validation.
- Authenticated idempotent case creation with server-generated references.
- Private S3-compatible attachment storage and authorised retrieval.
- Westbridge sandbox delivery plus optional static HTTPS/HMAC webhook adapter.
- Resident repair history.
- Tenant-scoped staff repair inbox, case view and workflow status updates.
- Six WebMCP capabilities operating on shared resident-facing state.
- Structured `AUTH_REQUIRED` responses for protected WebMCP operations.

## Human-confirmation boundary

Necivia deliberately exposes no WebMCP submission capability.

- WebMCP can adapt the visible experience.
- WebMCP can explain repair requirements.
- An authenticated agent can read/update the same visible draft.
- An authenticated agent can open the review screen.
- WebMCP cannot create a persistent case.
- WebMCP cannot create a `NEC-...` reference.
- The resident must visibly press **Confirm and submit**.
- The server re-authenticates/re-authorises and revalidates before persistence.

This boundary is covered by source structure, automated tests and manual
evidence.

## Database deployment evidence

The production database deployment path was hardened after reproducing a
Drizzle migration-ledger watermark failure.

`npm run db:deploy` is now the permanent Railway pre-deploy command.

It:

- validates checked-in migration order and hashes;
- takes a PostgreSQL advisory lock;
- safely bootstraps a verified-empty first deployment;
- applies normal strict migrations for initialized deployments;
- repairs stale Drizzle metadata only when the application schema is proven
  empty;
- refuses partial or unknown application schemas without deletion;
- verifies the resulting schema and ledger; and
- never automatically seeds demo users.

Production migration/bootstrap completed successfully.

The fictional Westbridge tenant, resident and staff demo users were then seeded
successfully.

## Automated engineering evidence

Current verified result:

- `npm run lint`: **PASS**
- `npm test`: **20 passed, 0 failed**
- `npm run build`: **PASS**
- `git diff --check`: **PASS**

Coverage includes authentication, authorisation, persistence, tenant
isolation, IDOR protection, file validation, rate limiting, origin protection,
delivery behaviour, migration safety, WebMCP schemas/state and the
human-confirmation boundary.

Terminal screenshots are stored under:

`docs/evidence/terminal/`

## WebMCP evidence

Production Chrome confirmed:

- `document.modelContext` is available; and
- exactly six Necivia WebMCP tools are registered.

Captured ChatGPT Site Tools results:

- explicit Site Tools adaptation request: **PASS**
- natural small-text/hard-to-tap request selecting `adapt_experience`: **PASS**

Final automated WebMCP selection suite:

- evaluator: WebMCP Evals
- target: `https://necivia.up.railway.app`
- model: `openai:gpt-5.2`
- test cases: **11**
- passed: **11**
- failed: **0**
- errors: **0**
- pass rate: **100.0%**

Final evaluator evidence:

- `docs/evidence/webmcp/wmcp-02-to-12-final-evals.json`
- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-report.html`
- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-report.json`
- `docs/evidence/webmcp/WMCP-02-to-12-automated-selection-summary.png`

Additional WebMCP screenshots are stored under:

`docs/evidence/webmcp/`

## Production verification

The live application is:

`https://necivia.up.railway.app`

Production verification completed successfully:

- application deployed successfully;
- PostgreSQL schema deployed successfully;
- demo seed completed successfully;
- signed-out housing repair access is protected;
- public Page Support remains usable;
- resident authentication works;
- a resident repair can be reviewed and submitted;
- the server returns a persistent server-generated reference;
- the case survives refresh;
- the same case/reference appears to authorised Westbridge staff;
- staff workflow status updates persist;
- protected information is inaccessible after sign-out; and
- six WebMCP tools remain exposed by the production page.

Production screenshot packaging is tracked in:

`docs/EVIDENCE_CHECKLIST.md`

## Evidence structure

```text
docs/evidence/
├─ ui/
├─ webmcp/
├─ production/
└─ terminal/
```

The `production/` screenshot set is the remaining evidence-capture task; the
production workflow itself has already been functionally verified.

## Challenge evidence principles

- All resident/case information used in evidence is synthetic.
- Westbridge Council is explicitly fictional.
- Failed exploratory evaluation/configuration attempts are not presented as
  final evidence.
- Final automated reports correspond to the published final evaluation
  definitions.
- Automated tool-selection evidence is distinguished from authenticated
  functional execution evidence.
- Screenshots must not be edited to hide failures or warnings.
- No credentials or secrets are included in challenge evidence.