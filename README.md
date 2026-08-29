# Adaptive Council Portal

Adaptive Council Portal is a competition project for the OpenAI WebMCP
Challenge. It explores how a local-council service can remain a familiar,
accessible website for people while also exposing precise, safe browser tools
to an assisting agent.

The repository name is a working name, not a final product brand. The visible
demonstration uses the fictional Westbridge Council identity.

## Problem

Council forms can be difficult to navigate when someone is tired, stressed,
has accessibility needs, or needs help describing an urgent repair. Generic
browser automation can also misread a complex form or use a different path
from the validation protecting human submissions.

This project demonstrates a shared human-and-agent journey in which:

- the person can use the website normally without WebMCP;
- an agent can adapt the same visible interface to the person's needs;
- an agent can read requirements and prepare the same live repair draft;
- the existing domain validation protects both human and agent paths; and
- the final consequential action remains an explicit human confirmation.

## Flagship journey

Housing Repair is the primary journey. It supports:

- normal and step-by-step presentation;
- standard and plain-language questions;
- full and reduced-clutter information density;
- normal, large, and extra-large text;
- normal and large controls;
- reduced motion;
- required safety questions and an immediate-danger warning;
- a review-before-submit stage; and
- a generated reference only after the person presses **Confirm and submit**.

Missed Bin remains in the repository as a secondary working example of the
same shared business-logic approach.

## Why WebMCP matters here

WebMCP lets an agent use explicit tools instead of guessing from screenshots or
simulated clicks. In this project, the tools are connected to the same React
state and domain rules as the visible page. An address or issue description
entered by either participant is immediately part of the one shared draft.

The WebMCP layer uses the current imperative browser API:

```ts
await document.modelContext.registerTool(tool, { signal });
```

The site feature-detects this API. No polyfill or WebMCP runtime is required for
ordinary browser use.

## Architecture

```text
ExperienceProvider ───────────────┐
                                  ├─ WebMcpRegistration
HousingRepairProvider ────────────┤
        │                         │
        └─ one HousingRepairReport┘
                  │
        HousingRepairForm
                  │
     validateHousingRepairReport()
                  │
      human review + confirmation
                  │
      submitHousingRepairReport()
```

- `ExperienceProvider` owns the live adaptive preferences.
- `HousingRepairProvider` owns the live draft and review state.
- `HousingRepairForm` and the WebMCP tools consume those same providers.
- `submitHousingRepairReport()` remains the final protected submission path.
- WebMCP can prepare and open review, but it cannot submit or create a reference.

## WebMCP tools

| Tool | Purpose | Read-only | Untrusted output |
| --- | --- | --- | --- |
| `get_experience_preferences` | Read the effective visible preferences | Yes | No |
| `adapt_experience` | Apply a strict partial preference update | No | No |
| `get_housing_repair_requirements` | Read model, field, date, safety, and review requirements | Yes | No |
| `get_housing_repair_draft` | Read the shared draft and readiness analysis | Yes | Yes—may contain human free text |
| `update_housing_repair_draft` | Patch supplied fields in the shared draft | No | Yes—echoes draft free text |
| `open_housing_repair_review` | Validate and visibly open review | No | No |

There is intentionally no submission tool.

## Human and agent flow

```text
person describes the need
→ agent optionally adapts the visible experience
→ agent reads the real requirements
→ agent updates the shared visible draft
→ agent opens the real review page
→ person reviews the safety answers and all details
→ person presses Confirm and submit
→ shared business validation runs again
→ repair reference is generated
```

## Safety and privacy

- Required fields and safety answers are validated in shared domain code.
- Invalid or future problem-start dates are rejected.
- Free-form draft output is marked with `untrustedContentHint: true`.
- Free text is stored and returned as data; it cannot alter tool definitions.
- Immediate danger produces a visible warning and does not invent emergency
  contact or automation.
- Tool registration is owned by one `AbortController`; aborting the lifecycle
  signal removes registrations.
- A global active-controller guard prevents duplicate registrations during
  Strict Mode, remounts, and Fast Refresh.
- No authentication, database, external API, OpenAI API, or secret is required.

## Local setup

Requirements:

- Node.js 20.9 or newer for Next.js;
- Node.js 24 for the dependency-free `npm test` harness; and
- npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run lint` | Run ESLint and Next.js accessibility rules |
| `npm test` | Run the Node domain and WebMCP test suites once |
| `npm run build` | Create and type-check the production build |
| `npm start` | Serve a completed production build |

## Chrome WebMCP testing

WebMCP is an evolving browser draft. For Chrome 149 or a current supported
Chrome build:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable **WebMCP for testing**.
3. For Chrome's experimental DevTools WebMCP panel, also enable
   `chrome://flags/#devtools-webmcp-support` if it is present.
4. Relaunch Chrome.
5. Open this application and inspect the six registered tools with Chrome's
   WebMCP tooling or the Model Context Tool Inspector.

See [docs/TESTING.md](docs/TESTING.md) for exact manual invocations and safety
checks.

## Evaluation and evidence

- [Manual testing guide](docs/TESTING.md)
- [WebMCP evaluation plan](docs/WEBMCP_EVALS.md)
- [Evidence checklist](docs/EVIDENCE_CHECKLIST.md)
- [Build evidence](docs/BUILD_EVIDENCE.md)
- [Codex prompt evidence](docs/CODEX_PROMPTS.md)

The evaluation and screenshot result fields remain marked **NOT YET TESTED**
or **NOT YET CAPTURED** until a person runs them in a supported browser.

## Known limitations

- WebMCP is still a draft and requires supported browser tooling or flags.
- Native Chrome/ChatGPT WebMCP scenarios require manual testing; automated
  tests cover the definitions, schemas, state adapters, validation, and
  registration lifecycle.
- The application has no persistence or backend; references exist only in the
  current browser session.
- The test harness uses Node 24's built-in TypeScript stripping because adding
  an external test framework was not available in the implementation environment.
- Deployment is deliberately outside this repository task.

## Challenge work statement

The WebMCP integration, shared-state refactor, automated tests, and competition
evidence foundation were developed for the OpenAI WebMCP Challenge. Codex
assisted implementation; the repository records actual automated results and
leaves browser evidence unclaimed until manually captured.

## License

This project is available under the [MIT License](LICENSE). After pushing to
GitHub, manually confirm that GitHub recognises the license and displays it in
the repository About panel.
