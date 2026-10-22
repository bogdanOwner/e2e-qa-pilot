# Create e2e

Author end-to-end coverage from one case. A case id or pasted case text, plus `.e2e-qa-pilot/settings.md`, are the inputs. [review-case](commands/review-case/SKILL.md) is the only router. A case tool is required only for a case id.

```mermaid
flowchart TD
  caseNode[Case id or pasted text]
  review[review-case]
  questions[Ask once then update when the case has an id]
  designSkill[add-from-design]
  stepsSkill[add-from-steps]
  readyPr[Ready pull request]
  stopPr[Draft mismatch PR spec stays red]
  askHuman[Stop and ask]
  caseNode --> review
  review -->|case not ready| questions
  questions --> review
  review -->|"figma.com URL and figma: on"| designSkill
  review -->|"no figma.com URL, or figma: off"| stepsSkill
  stepsSkill -->|every expected result visible| readyPr
  stepsSkill -->|screen shows a different result| stopPr
  designSkill -->|every milestone MATCH| readyPr
  designSkill -->|MINOR or BLOCKER| askHuman
  askHuman -->|gap accepted| readyPr
```

`figma: off` in the settings file ignores a Figma URL and sends the case to [add-from-steps](commands/add-from-steps/SKILL.md).

| Command | When |
|---------|------|
| [review-case](commands/review-case/SKILL.md) | First. Ready checks, one question per hole, update that same case when it came from an id, then route |
| [add-from-design](commands/add-from-design/SKILL.md) | The case has a `figma.com` URL and `figma: on` |
| [add-from-steps](commands/add-from-steps/SKILL.md) | No Figma URL, or `figma: off` |

Shared rules: [ready-rules.md](commands/shared/ready-rules.md) and [pr-evidence.md](commands/shared/pr-evidence.md).

Install with `npx e2e-qa-pilot init` in your project, once the package is published to npm. What to ask, the input contract, and the three tool results are in `mcp.md` in the e2e-qa-pilot package and repository.
