# WebMCP capability plan

The implemented WebMCP surface prepares and adapts the visible Housing Repair
journey. It deliberately does not expose final submission.

| Capability | What it does | State impact |
| --- | --- | --- |
| `get_experience_preferences` | Reads the preferences used by the visible site | Read-only |
| `adapt_experience` | Applies a partial update to the visible adaptive experience | Reversible visible-state change |
| `get_housing_repair_requirements` | Describes the real report model and validation requirements | Read-only |
| `get_housing_repair_draft` | Reads the same live draft shown in the form | Read-only; may return untrusted free text |
| `update_housing_repair_draft` | Partially updates the same live draft without submitting | Draft-only visible-state change |
| `open_housing_repair_review` | Validates the draft and opens the existing visible review | Visible-state change; no submission |

Final submission remains a human-only action through the visible
**Confirm and submit** button. No registered WebMCP tool calls
`submitHousingRepairReport()` or generates a repair reference.
