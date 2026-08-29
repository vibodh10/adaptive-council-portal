# Build evidence

Last updated: 28 August 2026 (Europe/London)

This is a living engineering record. It distinguishes automated results that
were actually observed from browser evidence that still needs manual capture.

## Architecture summary

The Next.js App Router page is wrapped by two client-side providers:

- `ExperienceProvider` owns the one effective `ExperiencePreferences` object.
- `HousingRepairProvider` owns the one live `HousingRepairReport` and whether
  the existing review screen is open.

`HousingRepairForm` and `WebMcpRegistration` consume those same providers. The
WebMCP layer is isolated under `src/webmcp` and uses the imperative
`document.modelContext.registerTool(tool, { signal })` API only when feature
detection succeeds.

## Shared-state design

- Human field changes update the provider-owned report.
- WebMCP draft patches update that same provider-owned report.
- Tool closures read current state through refs rather than registering a new
  tool set on every keystroke.
- The registration component immediately mirrors its own tool updates into the
  refs, preserving sequential tool-call consistency before React's next render.
- WebMCP review uses the provider's same validated `openReview` path, so the
  visible existing review screen opens.

There is no hidden agent draft.

## Visual design milestone — 28 August 2026

The flagship journey now uses a distinctive modern civic editorial system:

- warm paper and surface tones, deep navy ink, terracotta actions, restrained
  mint support colour, and accessible status/focus tokens;
- an original text-and-SVG Westbridge masthead rather than external branding;
- an editorial complete-form layout, accessible repair-type choice cards,
  deliberate safety treatments, and a focused guided-mode progress pattern;
- a resident-facing **Make this page easier for me** panel with visible active
  states for all six existing preferences; and
- explicit **Nothing has been sent yet** review messaging plus a finished
  reference-focused success state.

Targeted local browser checks observed no horizontal overflow at a 390-pixel
viewport. All six adaptive controls changed the rendered page, reduced clutter
kept access notes, and the guided count changed to **Step 1 of 8**. Direct local
WebMCP calls populated the same visible draft, opened the redesigned review
screen with `reference: null`, and left **Confirm and submit** visible. Selecting
that visible button then produced the success screen and a `REP-` reference.

These observations are a development smoke check, not saved competition
screenshots. Existing WebMCP evaluation and evidence-checklist result fields
remain unaltered and unclaimed.

## WebMCP inventory

| Tool | State/business mapping |
| --- | --- |
| `get_experience_preferences` | Reads the current `ExperienceProvider` value |
| `adapt_experience` | Strictly validates a partial patch and updates that provider |
| `get_housing_repair_requirements` | Returns model-aligned fields, `REPAIR_TYPES`, date, safety, nullable, and confirmation rules |
| `get_housing_repair_draft` | Reads the provider report and shared domain readiness analysis |
| `update_housing_repair_draft` | Runtime-validates a partial patch and merges it into the provider report |
| `open_housing_repair_review` | Uses shared validation and the provider review transition |

## Human-confirmation boundary

No registered tool imports or invokes `submitHousingRepairReport()`. WebMCP can
only prepare a draft and open review. The reference-generating submission
function is called by `HousingRepairForm.handleConfirm`, which is attached to
the visible **Confirm and submit** button.

The final submission function runs shared validation again, so a changed or
invalid draft cannot bypass the domain rules at confirmation time.

## Validation and security design

`getHousingRepairValidationIssues()` is the shared rule source for:

- required address;
- supported repair type;
- required issue description;
- strict real `YYYY-MM-DD` calendar date;
- non-future problem-start date;
- answered boolean `isGettingWorse`; and
- answered boolean `immediateDanger`.

`validateHousingRepairReport()` throws the first domain issue and remains the
gate called by `submitHousingRepairReport()`. WebMCP partial updates can leave a
draft incomplete, but reject unsupported types, malformed/future dates, invalid
enums, non-boolean safety values, unknown fields, and empty patches.

Draft-returning tools mark `untrustedContentHint: true` because addresses,
descriptions, and notes may contain untrusted human or agent text. Tool
definitions and descriptions are static application code and are never built
from that text.

## Registration lifecycle

- Every registration receives one `AbortController.signal`.
- Cleanup aborts that signal, which is the current WebMCP unregister mechanism.
- A controller stored on `globalThis` is aborted before a new mount registers,
  preventing duplicate names across Strict Mode, remounts, and Fast Refresh.
- A failed partial registration aborts the same controller to remove any tools
  already registered in that batch.
- When `document.modelContext` is absent, registration returns without logging
  or affecting the page.

## Automated tests present

`test/housingRepair.test.mjs` covers valid submission and every required domain
negative case, including explicit false safety answers.

`test/webmcp.test.mjs` covers tool names, no submit tool, enum schemas,
annotations, invalid/partial preference updates, partial shared-draft updates,
invalid repair types, future dates, review refusal/acceptance, absence of a
reference, and lifecycle-signal cleanup/re-registration.

## Commands run and observed results

| Command | Observed result |
| --- | --- |
| `npm run lint` | **PASS** after implementation; ESLint exited 0 |
| `npm test` | **PASS**; 20 tests passed, 0 failed |
| `npm run build` | **PASS**; Next.js production compilation, TypeScript, page data, and static generation completed |
| Ordinary-browser smoke check | **PARTIAL PASS**; HTTP 200, visible council shell/form, silent no-WebMCP fallback, reduced-clutter access notes, hidden additional notes/hints, and dynamic 8-step count were observed |

An initial `npm test` attempt failed before executing assertions because the
sandbox blocked Node test-worker process spawning. The harness was corrected to
use `--test-isolation=none` and explicit suites; the subsequent run passed all
20 tests. No failure was suppressed or reported as a pass.

A later cleanup attempt used a Node flag removed from the installed Node 24
runtime. That unnecessary flag was removed, the package was explicitly marked
as an ES module, and the final test run passed all 20 tests without warnings.

The production build emitted an environment warning that Next.js ignored an
unrelated `package-lock.json` above the git repository. The project build itself
completed successfully; no broad Turbopack-root configuration was added merely
to silence an external-workspace warning.

An earlier in-app-browser session did not expose `document.modelContext`, which
correctly exercised the ordinary-site fallback, and its native date-control
automation did not produce the React change event needed to complete the form.
A later supported browser runtime exposed the six page tools and enabled the
targeted shared-draft, review-boundary, and success-state smoke checks recorded
above. The full natural-language evaluation table and Chrome judge workflow
remain explicitly marked for manual testing rather than being claimed as
passed.

## Verified git history

Only history visible in the repository is recorded:

| Commit | Date | Subject |
| --- | --- | --- |
| `226a5f6` | 2026-08-27 10:21:06 +01:00 | Initial commit from Create Next App |
| `04da50c` | 2026-08-27 20:00:44 +01:00 | feat: build adaptive council housing repair foundation |

The current WebMCP/evidence changes are intentionally uncommitted.

## AI-assisted development

Codex was used to assist with repository inspection, WebMCP API research,
implementation, tests, documentation, and verification. The changes were
reviewed against the supplied requirements and exercised with the automated
commands above. Native browser behaviour still requires the manual checks below.

## Known limitations

- WebMCP is a changing draft browser API.
- Native Chrome and ChatGPT in-app-browser tool calls were not available for
  automated execution in this environment.
- The project uses local minimal TypeScript contracts for the standard API;
  installing the declarations-only `@mcp-b/webmcp-types` package was not
  available in the managed environment.
- The Node test harness requires Node 24 for native TypeScript stripping.
- The application has no persistence/backend; this is an in-browser challenge
  demonstration.
- No deployment was performed.

## Evidence still needed

- Chrome tool-list and schema inspection.
- Manual native tool calls and visible state-change captures.
- ChatGPT in-app-browser natural-language evaluations.
- Immediate-danger and invalid-input captures.
- Human review/confirmation and success-reference captures.
- Mobile responsive capture.
- GitHub license detection/About-panel confirmation after a future push.

See [EVIDENCE_CHECKLIST.md](EVIDENCE_CHECKLIST.md).
