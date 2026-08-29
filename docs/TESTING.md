# Testing guide

This guide separates automated checks from manual browser evidence. Do not mark
the manual sections as passed until they have been performed in the named
environment.

## Prerequisites

- Node.js 20.9+ for the Next.js application.
- Node.js 24 for the dependency-free automated test harness.
- npm.
- For native WebMCP testing: Chrome 149+ or a current version that exposes the
  WebMCP testing flag.

## Automated checks

From the repository root:

```bash
npm install
npm run lint
npm test
npm run build
```

`npm test` runs 20 substantive domain and WebMCP tests. It uses Node's built-in
test runner, runs once, and does not watch.

## A. Normal browser functionality

1. Run `npm run dev`.
2. Open `http://localhost:3000` in an ordinary browser with no WebMCP setup.
3. Confirm the Westbridge Council Housing Repair page renders without a console
   or visible WebMCP error.
4. Complete the form in normal mode.
5. Select **Review repair report** and verify the summary.
6. Select **Back and change answers** and confirm all values remain.
7. Return to review and select **Confirm and submit**.
8. Confirm that a `REP-` reference appears only after that click.

Status: **NOT YET MANUALLY TESTED**.

Observed automated browser smoke coverage on 27 August 2026: the page returned
HTTP 200, rendered the Westbridge Council shell and Housing Repair form, emitted
no browser warnings/errors when `document.modelContext` was absent, retained
access instructions in reduced clutter, hid additional notes and the example
hint, and showed the correct reduced-clutter count of **Step 1 of 8**. The full
normal journey remains unclaimed because the browser-control surface could not
reliably drive the native date input.

## B. Chrome WebMCP setup

1. Install or open Chrome 149+ (or the current supported release).
2. Navigate to `chrome://flags/#enable-webmcp-testing`.
3. Enable **WebMCP for testing**.
4. If testing Chrome's experimental DevTools panel and the flag is available,
   also enable `chrome://flags/#devtools-webmcp-support`.
5. Relaunch Chrome when prompted.
6. Start the application with `npm run dev` and open
   `http://localhost:3000`.

WebMCP is a draft. Flag names and exposed debugging surfaces may change between
Chrome releases; record the actual browser version used.

Status: **NOT YET MANUALLY TESTED**.

## C. Model Context Tool Inspector

Use Chrome's WebMCP DevTools support or the Model Context Tool Inspector for the
active page.

### Inspect registration

Verify exactly these six tools are present:

1. `get_experience_preferences`
2. `adapt_experience`
3. `get_housing_repair_requirements`
4. `get_housing_repair_draft`
5. `update_housing_repair_draft`
6. `open_housing_repair_review`

Confirm that there is no submission tool.

### Inspect schemas

- Confirm every input schema is an object with `additionalProperties: false`.
- Confirm preference fields use the real enum values.
- Confirm `repairType` uses the eight real housing categories.
- Confirm safety answers are booleans and the date field uses `format: "date"`.
- Confirm the three get tools are marked read-only.
- Confirm draft-reading/echoing tools mark untrusted output.

### Manual invocations

Invoke `adapt_experience`:

```json
{
  "textSize": "extraLarge",
  "targetSize": "large",
  "languageMode": "plain",
  "journeyMode": "stepByStep",
  "informationDensity": "reduced",
  "motion": "reduced"
}
```

Verify the visible UI changes immediately and still includes access notes.

Invoke `update_housing_repair_draft` with a past date:

```json
{
  "address": "12 Example Street",
  "repairType": "roof_or_ceiling",
  "issueDescription": "There is water leaking through my ceiling.",
  "whenProblemStarted": "2026-08-26",
  "isGettingWorse": true,
  "immediateDanger": false,
  "accessNotes": "Use the side entrance."
}
```

Verify every supplied value appears in the visible form and no reference is
created. Then invoke `get_housing_repair_draft` and compare its draft with the
visible values.

Invoke `open_housing_repair_review` with `{}`. Verify the visible review screen
opens and still contains **Confirm and submit**.

Status: **NOT YET MANUALLY TESTED**.

## D. ChatGPT in-app browser

1. Open the deployed URL in the ChatGPT in-app browser.
2. Use the natural-language prompts in [WEBMCP_EVALS.md](WEBMCP_EVALS.md).
3. For each prompt, record the tools and arguments actually used.
4. Confirm changes happen in the visible page, not in a hidden draft.
5. Confirm the agent can open review but cannot create a reference.

A deployed URL is not part of the current implementation task.

Status: **NOT YET MANUALLY TESTED**.

## E. Safety testing

### Invalid date

Call `update_housing_repair_draft` with tomorrow's date. Expect a structured
error, no draft mutation, and no review transition.

### Missing required data

On an empty draft, call `open_housing_repair_review`. Expect
`reviewOpened: false`, missing required fields, and validation issues.

### Immediate danger

Set `immediateDanger: true`. Verify the visible warning says to move away from
the affected area and truthfully says the form does not contact emergency
services.

### Confirmation boundary

Inspect the tool list and source. Confirm:

- no tool invokes `submitHousingRepairReport()`;
- no tool returns a generated `REP-` reference; and
- only the visible **Confirm and submit** handler invokes final submission.

Status: **NOT YET MANUALLY TESTED**.

## F. Regression smoke test

Test each item without WebMCP first, then repeat relevant changes through
`adapt_experience`:

- [ ] Normal mode shows one coherent form.
- [ ] Plain language changes question wording.
- [ ] Reduced clutter hides non-essential hints and additional notes but keeps
      access notes.
- [ ] Large text changes Housing Repair typography.
- [ ] Large controls enlarge inputs, radios, and buttons.
- [ ] Reduced motion shortens non-essential transitions.
- [ ] Step-by-step shows one logical question at a time and the correct count.
- [ ] Back/Next preserves values.
- [ ] Review shows all important answers, including immediate danger.
- [ ] Final submit/reference occurs only after visible human confirmation.
- [ ] Missed Bin files and business logic still build as the secondary example.

Status: **NOT YET MANUALLY TESTED**.
