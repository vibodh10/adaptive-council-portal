# Evidence checklist

Challenge evidence is stored inside the repository under:

```text
docs/evidence/
├─ ui/
├─ webmcp/
├─ production/
└─ terminal/
```

Westbridge Council is fictional and all captured form/case information must use
synthetic test data.

## UI evidence

| Evidence | Status | What it proves |
| --- | --- | --- |
| `ui/01-normal-housing-repair.png` | **CAPTURED** | Baseline Housing Repair experience works as a normal website |
| `ui/02-adapted-experience.png` | **CAPTURED** | The same interface can adapt for accessibility/situational needs |
| `ui/08-review-human-confirmation.png` | **CAPTURED** | Review is visible before final human submission |
| `ui/09-success-reference.png` | **CAPTURED** | A reference appears after the final confirmation path |
| `ui/11-mobile-responsive.png` | **CAPTURED** | The production interface reflows to a mobile viewport |

## WebMCP implementation evidence

| Evidence | Status | What it proves |
| --- | --- | --- |
| `webmcp/03-webmcp-tool-list.png` | **CAPTURED** | Six WebMCP tools are registered |
| `webmcp/03b-chatgpt-site-tools-menu.png` | **CAPTURED** | ChatGPT discovers six Necivia Site Tools |
| `webmcp/04-tool-schema-adapt-experience.png` | **CAPTURED** | `adapt_experience` exposes constrained structured inputs |
| `webmcp/05-webmcp-adapts-live-ui.png` | **CAPTURED** | A WebMCP call changes the visible interface |
| `webmcp/06-webmcp-updates-visible-draft.png` | **CAPTURED** | WebMCP and the resident share the same repair draft |
| `webmcp/07-invalid-date-rejected.png` | **CAPTURED** | Invalid/future repair dates are rejected |

## Agent-selection evidence

| Evidence | Status | What it proves |
| --- | --- | --- |
| `webmcp/WMCP-EXPLICIT-01-explicit-site-tools.png` | **CAPTURED** | Explicit Site Tools invocation works |
| `webmcp/WMCP-01-natural-adaptation.png` | **CAPTURED** | ChatGPT naturally selected `adapt_experience` |
| `webmcp/wmcp-02-to-12-final-evals.json` | **CAPTURED** | Reproducible final automated eval definitions |
| `webmcp/WMCP-02-to-12-automated-selection-report.html` | **CAPTURED** | Human-readable final WebMCP Evals report |
| `webmcp/WMCP-02-to-12-automated-selection-report.json` | **CAPTURED** | Machine-readable final evaluation result |
| `webmcp/WMCP-02-to-12-automated-selection-summary.png` | **CAPTURED** | Final 11/11, 100% automated selection summary |

Final automated selection result:

**11 passed / 11 total — 100.0%, 0 failures, 0 errors.**

## Terminal / engineering evidence

| Evidence | Status | What it proves                                                                                                             |
| --- | --- |----------------------------------------------------------------------------------------------------------------------------|
| `terminal/12a-lint-test.png` | **CAPTURED — VERIFY CURRENT COUNT** | Lint/test evidence. Refresh before submission if it does not visibly show the current **20 passed, 0 failed** test result. |
| `terminal/12b-build.png` | **CAPTURED** | Optimized production build succeeds                                                                                        |
| `terminal/12c-git-diff-check.png` | **CAPTURED** | Git whitespace/error check succeeds                                                                                        |

Current verified automated result:

**20 tests passed, 0 failed.**

## Production evidence still to capture

These screenshots should be captured from
`https://necivia.up.railway.app`, not localhost.

| Filename | Status | What it should show                                                 |
| --- | --- |---------------------------------------------------------------------|
| `production/01-live-six-webmcp-tools.png` | **CAPTURED** | Production `document.modelContext.getTools()` returning six tools   |
| `production/02-resident-login.png` | **CAPTURED** | Successful demo resident sign-in                                    |
| `production/03-resident-submission-reference.png` | **CAPTURED** | Server-generated `NEC-...` after human confirmation                 |
| `production/04-resident-repair-persists-after-refresh.png` | **CAPTURED** | Same case/reference still present after refresh                     |
| `production/05-staff-inbox-same-reference.png` | **CAPTURED** | Staff inbox contains the resident's exact reference                 |
| `production/06-staff-case-detail-attachment.png` | **CAPTURED** | Authorised staff case view and test attachment/details              |
| `production/07-staff-status-update-persisted.png` | **CAPTURED** | Staff workflow status remains changed after refresh                 |
| `production/08-unauthenticated-access-denied.png` | **CAPTURED** | Direct access to a protected URL while signed out redirects to the login page without exposing protected information |

The production journey has already been functionally verified; this section
tracks the remaining screenshot evidence.

## Capture rules

- Do not edit screenshots to hide failures, warnings or inconvenient output.
- Use synthetic information only.
- Do not expose passwords, API keys, cookies, database URLs or other secrets.
- Prefer screenshots that show both the action and its consequence.
- Evidence descriptions must distinguish automated tool-selection tests from
  authenticated execution tests.
- Do not claim an evidence item as captured until the corresponding file exists
  in the repository.