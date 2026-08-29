# Evidence checklist

No screenshots or native-browser evidence have been captured by this task.
Every item below is an explicit future capture target.

| Filename | Status | What it proves | Judging relevance | How to reproduce |
| --- | --- | --- | --- | --- |
| `01-normal-housing-repair.png` | **NOT YET CAPTURED** | The polished Housing Repair journey works as an ordinary website | Product quality and usefulness | Open the homepage without WebMCP and capture the normal form |
| `02-adapted-experience.png` | **NOT YET CAPTURED** | Large text, large targets, plain language, reduced clutter, and step-by-step presentation work together | Accessibility and adaptive UX | Apply the settings manually or with `adapt_experience`, then capture the visible page |
| `03-webmcp-tool-list.png` | **NOT YET CAPTURED** | Exactly six meaningful tools are registered and no submit tool exists | WebMCP implementation and safety | Open the Chrome WebMCP/Model Context inspector and capture the complete tool list |
| `04-tool-schema-adapt-experience.png` | **NOT YET CAPTURED** | Preference inputs use strict enums and reject additional properties | Tool quality and reliability | Inspect the `adapt_experience` schema in the tool inspector |
| `05-agent-adapts-live-ui.png` | **NOT YET CAPTURED** | An agent tool call changes the same visible experience | Human-agent collaboration | Invoke `adapt_experience` and capture the resulting page plus invocation evidence |
| `06-agent-updates-visible-draft.png` | **NOT YET CAPTURED** | Agent and human share one live Housing Repair draft | Shared state and flagship value | Invoke `update_housing_repair_draft` and capture populated visible fields |
| `07-invalid-date-rejected.png` | **NOT YET CAPTURED** | A future date is rejected without corrupting the draft | Validation and safety | Invoke the update tool with tomorrow's date and capture the structured error and unchanged field |
| `08-review-human-confirmation.png` | **NOT YET CAPTURED** | WebMCP can open review but the person must press **Confirm and submit** | Human-in-the-loop safety | Complete the draft, invoke `open_housing_repair_review`, and capture the review screen |
| `09-success-reference.png` | **NOT YET CAPTURED** | A reference is generated only after visible human confirmation | End-to-end completion and safety boundary | From review, manually press **Confirm and submit**, then capture the reference |
| `10-webmcp-eval-results.png` | **NOT YET CAPTURED** | Natural-language evaluations were run and recorded truthfully | Evaluation quality | Run the eval table in a supported agent browser and capture results with tool calls |
| `11-mobile-responsive.png` | **NOT YET CAPTURED** | The council shell and repair journey remain usable at a mobile width | Responsive product quality | Use responsive DevTools at a representative mobile viewport and capture the page |
| `12-lint-test-build.png` | **NOT YET CAPTURED** | The repository passes its automated quality commands | Engineering quality | Run `npm run lint`, `npm test`, and `npm run build`; capture the unedited terminal output |

## Capture rules

- Do not edit screenshots to hide failures or warnings.
- Record the browser, browser version, viewport, commit, and date alongside the
  evidence.
- Keep personal data out of captures; use fictional values such as
  `12 Example Street`.
- Update the matching result in [WEBMCP_EVALS.md](WEBMCP_EVALS.md) only after
  the evidence exists.
