# Codex prompt evidence

This file is supplemental development evidence, not an official challenge
requirement. It records prompt intent without inventing results or hidden work.

## 27 August 2026 — production WebMCP and evidence foundation

The current goal asked Codex to treat the repository as competition production
work for the OpenAI WebMCP Challenge and to:

- inspect and preserve the existing Next.js, adaptive experience, council shell,
  Housing Repair, Missed Bin, validation, review, and accessibility architecture;
- move Housing Repair draft/review state into one source shared by the visible
  form and WebMCP;
- use the current imperative `document.modelContext.registerTool()` API with
  feature detection, `AbortController` lifecycle cleanup, and duplicate guards;
- implement six tools: preference read/adaptation, repair requirements, shared
  draft read/update, and open review;
- strictly forbid a WebMCP final-submit/reference capability;
- use shared business validation and strict schemas/annotations;
- add substantive automated domain and WebMCP tests;
- create manual eval, testing, evidence, build, and prompt documentation;
- upgrade the README and add an MIT license if absent;
- run lint, tests, build, and security/privacy checks; and
- leave deployment, commit, and push for later human review.

The complete original prompt remains in the Codex task history. It is not copied
verbatim here to keep repository evidence readable.

## Earlier prompts available in this Codex session

The following earlier prompt sequence is reliably available and is summarised
without reconstructing wording that was not preserved:

1. Scaffold a minimal Next.js App Router project with React, TypeScript,
   Tailwind CSS, and ESLint, plus empty `components`, `types`, `lib`, and
   `features` folders.
2. Implement the existing `targetSize` preference for the Missed Bin form and
   add a manual large-controls toggle.
3. Add a polished fictional UK local-council shell while retaining the existing
   adaptive and form behaviour.
4. Make Housing Repair the flagship homepage journey, retain Missed Bin as a
   secondary reference, and add shared report types, business validation,
   adaptive normal/step-by-step presentation, safety questions, review, and
   explicit human confirmation.
5. Keep access notes available in reduced clutter and add `role="alert"` to
   dynamic Housing Repair errors.

No earlier prompt outside the current Codex session is claimed.
