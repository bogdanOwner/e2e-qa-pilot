# Settings

The first `review_case` run reads `.e2e-qa-pilot/settings.md`. If a key it needs is empty, the assistant asks once in chat and writes your answers into that file. A case id needs `case_tool`, `fetch_case`, and `update_case`. Pasted case text does not. Both inputs need `figma`, `read_figma`, and `test_command`. `png_dir` is required unless `## Project rules` names the screenshot directory. `branch_pattern` has a default.

The settings file is included in every tool result, so do not store tokens in it. Put how to fetch and update a case in the file, and keep tokens in your own MCP configuration. Do not paste a secret into the chat.

| Key | Meaning |
|-----|---------|
| `case_tool`, `fetch_case`, `update_case` | Where cases live and how to read and update one. Used only for a case id |
| `figma`, `read_figma` | `on` or `off`, and how to read a frame |
| `branch_pattern` | Branch name. `{title_slug}` is the case title in kebab-case and `{case_id}` is the case id, for a case id only. Default `e2e/{title_slug}`, or `e2e/{case_id}-{title_slug}` for a case id. A name with no placeholder is used as it is |
| `test_command`, `png_dir` | How to run the spec, and where PNGs go |
| `pr_mode` | `create_pr_for_review` (default) or `ask_before_pr`. A missing value means `create_pr_for_review` |
| `pr_label_ready` | Label when behavior matches and required screenshot evidence is adequate. Default `e2e:ready` |
| `pr_label_minor_text_diff` | Label when the only issue is a narrow wording difference. Default `e2e:minor-text-diff` |
| `pr_label_mismatch` | Label for a functional or unresolved mismatch, or inadequate required screenshot evidence. Default `e2e:mismatch` |

The command files list `read_figma` among the required keys even when `figma: off`. The settings template leaves it blank in that case. Until that is settled, expect to be asked for it once. Changing that behavior is outside the current instructions. See [Known limitations](../mcp.md#known-limitations).

## Pull request outcomes

When the assistant has the tools and permissions the commands name, the intended deliverables are a Playwright spec, a step-by-step results table, screenshot evidence, pull request comments, and a pull request for human QA review. A label is a review outcome. It does not mean the change is approved or merged.

A green test run means only that the assertions executed by that run passed. It does not prove that every expected behavior was tested or that the screenshots demonstrate every required state. A failed assertion and inadequate screenshot evidence are separate findings. Inadequate screenshot evidence does not, by itself, prove that a functional assertion failed.

- `e2e:ready` — functional assertions passed, the expected behavior matches, and all required screenshot evidence meets the acceptance criteria.
- `e2e:minor-text-diff` — functional behavior matches, and the only discrepancy is a minor wording difference that meets the documented classification rule. The difference is explicitly recorded. It is not reported as a passed exact-text assertion.
- `e2e:mismatch` — a functional mismatch or unresolved discrepancy exists, or required screenshot evidence fails to demonstrate the expected end state. The pull request is a draft. It is not a confirmed product regression.

Nothing is auto-merged. The default `pr_mode` is `create_pr_for_review`. It allows the assistant to create a pull request for review without auto-merging it. The optional `ask_before_pr` mode requires the assistant to stop and ask before creating a pull request when a functional mismatch, unresolved discrepancy, or failed final-screenshot gate remains. If the discrepancy remains after clarification, the assistant must obtain explicit authorization before creating the pull request.

## Required inputs

The server requires exactly one of `case_id` or `case_text`. Pasted text needs no case tool. A case id needs `case_tool`, `fetch_case`, `update_case`, and an external case-tool MCP. Generating a spec needs `figma`, `read_figma`, and `test_command`. It also needs `png_dir` unless `## Project rules` names the screenshot directory. `branch_pattern`, `pr_mode`, `pr_label_ready`, `pr_label_minor_text_diff`, and `pr_label_mismatch` have defaults, so a missing value is not a question. The input contract is in [mcp.md](../mcp.md).

## Project rules

An optional `## Project rules` heading in `.e2e-qa-pilot/settings.md` customizes workflow for one repository. The generated template does not include that heading. With no heading, the keys and the defaults above stay in force.

A section line wins over a conflicting key for the topic it names. Other topics stay on their keys or defaults. The section cannot change ready checks, the word rule, the screenshot gate, label precedence, or `pr_mode`.

### Simple customization

This is enough for a project that only wants its own branch name, commit subject, and screenshot folder. No ticket tool is required.

```markdown
## Project rules

Branch: `qa/{title_slug}`
Commit subject: `test(e2e): {explanation}`
Screenshots: `tests/e2e/screenshots`
```

The branch name uses the case title. Commit messages use that subject instead of `fix: {explanation}`. Screenshots go to `tests/e2e/screenshots` instead of `png_dir`. The pull-request base stays `main`, and the rest of the workflow stays on its configured value or default.

### An existing project's workflow

Use this only when the repository already works this way. e2e-qa-pilot does not install or call Plane. Replace the ticket sentence with the step that repository already runs. `{plane_id}` means the full key that step records, such as `DEV-123`.

```markdown
## Project rules

Start from `develop`. Open the pull request against `develop`.

When this repo's ticket step applies, create that ticket first. Replace this sentence with the ticket step your repo already runs. `{plane_id}` is the full key, such as `DEV-123`.

Branch for a case id: `{plane_id}-AS-{case_id}-{title_slug}`
Branch for pasted text: `{plane_id}-{title_slug}`
Commit subject: `fix({plane_id}): {explanation}`

Screenshots: `tests/account/screenshots`
Fixture: `tests/fixture.ts`
Specs: `tests/e2e`
Pages: `tests/pages`
```

A pasted case has no case id, so it uses the second branch line. A line that contains `{case_id}` when the run has no case id asks once instead of inventing one.

## Reference conventions

Reference conventions in the commands, which another project may adapt, include `overview.md`, Gherkin under `specs/`, page contracts under `pages/`, page objects, flows, and a Playwright fixture. There is no settings key for those paths. A project does not have to copy that layout for the server to start. The [Cabana example](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/examples/boutique-cabin/README.md) uses it so the reference workflow can be read in one place. That directory is in this git repository and is not part of the published package. Figma helpers such as `attachMilestoneScreenshot` are not in the example and are not provided by this package.
