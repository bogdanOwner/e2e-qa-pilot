# Create e2e

Author end-to-end coverage from one existing case. The case id and `.e2e-qa-pilot/settings.md` are the inputs. [review-case](commands/review-case/SKILL.md) is the only router.

```mermaid
flowchart TD
  caseNode[Existing case from settings]
  review[review-case]
  questions[Ask once then update that case]
  designSkill[add-from-design]
  stepsSkill[add-from-steps]
  readyPr[Ready PR one PNG per step]
  stopPr[Draft mismatch PR spec stays red]
  askHuman[Stop and ask]
  caseNode --> review
  review -->|expected result missing or vague| questions
  questions --> review
  review -->|case has a Figma URL| designSkill
  review -->|no Figma URL| stepsSkill
  stepsSkill -->|every expected result visible| readyPr
  stepsSkill -->|screen shows a different result| stopPr
  designSkill -->|visual mismatch| askHuman
```

`figma: off` in the settings file ignores a Figma URL and sends the case to [add-from-steps](commands/add-from-steps/SKILL.md).

| Command | When |
|---------|------|
| [review-case](commands/review-case/SKILL.md) | First. Ready checks, one question per hole, update that same case, then route |
| [add-from-design](commands/add-from-design/SKILL.md) | The case has a `figma.com` URL and `figma: on` |
| [add-from-steps](commands/add-from-steps/SKILL.md) | No Figma URL, or `figma: off` |

Shared rules: [ready-rules.md](commands/shared/ready-rules.md) and [pr-evidence.md](commands/shared/pr-evidence.md).

Install with `npx e2e-qa-pilot init` in your project. What to ask and the three tool results are in `mcp.md` in the e2e-qa-pilot repository.
