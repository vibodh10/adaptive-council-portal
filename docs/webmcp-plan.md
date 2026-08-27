| Capability                        | What it does                                                    | Consequential?                                 |
| --------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| `get_experience_preferences`      | Reads how the site is currently adapted                         | No                                             |
| `adapt_experience`                | Changes text size, clutter, language, journey mode, target size | No — reversible                                |
| `get_housing_repair_requirements` | Tells the agent what information a repair report needs          | No                                             |
| `update_housing_repair_draft`     | Fills/updates the same housing-repair draft the human sees      | No submission yet                              |
| `submit_housing_repair_report`    | Actually creates the repair report/reference                    | **Yes — requires explicit human confirmation** |
