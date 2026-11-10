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

Most projects only need the named keys above. Set the branch name with `branch_pattern` and the screenshot directory with `png_dir`. `## Project rules` is optional. The generated settings file does not include the heading. Leave it out to keep those keys and their defaults.

Add the heading when the repository needs a workflow convention the keys do not cover, such as the Git starting branch, the pull-request base, the commit subject, or a ticket step the repository already runs. One line for a topic replaces that key or default. Other topics stay as they are. Two lines for the same topic on the same run are quoted, and the assistant asks once. Project rules cannot override ready checks, the word rule, the screenshot gate, pull-request label precedence, `pr_mode`, `pr_label_ready`, `pr_label_minor_text_diff`, or `pr_label_mismatch`. `test_command`, `figma`, and `read_figma` stay required named settings. A line in this section does not answer them.

### Simple customization

Use this when new work starts from `develop` and the commit subject should differ from `fix: {explanation}`.

```markdown
## Project rules

Start from `develop`.
Open the pull request against `develop`.
Commit subject: `test(e2e): {explanation}`
```

`Start from` is the branch new work is created from. `Open the pull request against` is the pull-request base. They are separate, and the base line leaves the branch name unchanged. With no start line, the start is the resolved pull-request base. With neither line, each falls back to `main`.

### An existing project's workflow

Adapt this example. The paths belong to one repository and are not required for every Playwright project. e2e-qa-pilot does not provide built-in Jira, Plane, or GitHub Issues clients. The ticket lines are one approach. Replace them when this repository already uses a different step.

```markdown
## Project rules

Start from `develop`.
Open the pull request against `develop`.

Use an existing issue key for this run.
If none was provided, ask once for the full issue key.
Record it as `{plane_id}`.
Do not create a ticket.

Branch: `{plane_id}-{title_slug}`
Commit subject: `fix({plane_id}): {explanation}`

Screenshots: `tests/account/screenshots`
Fixture: `tests/fixture.ts`
Specs: `tests/e2e`
Pages: `tests/pages`
```

The issue identifier comes from the ticket system your repository already uses. For example:

- **Jira:** `PROJ-123`
- **Plane:** `DEV-123`
- **GitHub Issues:** `123` (unique only within its repository)
- **Other trackers:** Any identifier supported by your repository's workflow.

`{plane_id}` is the only issue-identifier placeholder currently supported by the e2e-qa-pilot skills. Despite its historical name, it can hold an identifier from **any ticket system**, not just Plane.

These identifiers are examples, not required formats. The skills use the identifier recorded for the current run; they do not automatically retrieve or create tickets.

If your repository does not use issue identifiers, remove the ticket instructions and use a commit subject without an issue placeholder. Configure the branch name with `branch_pattern`. Write the whole commit line. Deleting only `{plane_id}` from a subject such as `fix({plane_id}): {explanation}` leaves `fix():`.

- `{title_slug}` is the case title in kebab-case. `Verify Login` becomes `verify-login`.
- `{case_id}` is the case id, and only when this run uses a case id. A Project rules line that still contains `{case_id}` asks once when this run has no case id.
- `{plane_id}` is the full issue identifier recorded for the run. It does not create or retrieve a ticket. A missing value asks once, and the run does not invent one. A prefix written in front of the token, such as `PROJ-{plane_id}`, asks once when the recorded key already starts with `PROJ-`.
- `{explanation}` is the short explanation written for the commit subject. With no commit line, the subject is `fix: {explanation}`.

In the example above, the branch line replaces `branch_pattern` for that run. `Screenshots` replaces `png_dir`. `Fixture`, `Specs`, and `Pages` name paths the repository already uses.

## Reference conventions

Reference conventions in the commands, which another project may adapt, include `overview.md`, Gherkin under `specs/`, page contracts under `pages/`, page objects, flows, and a Playwright fixture. There is no settings key for those paths. A project does not have to copy that layout for the server to start. The [Cabana example](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/examples/boutique-cabin/README.md) uses it so the reference workflow can be read in one place. That directory is in this git repository and is not part of the published package. Figma helpers such as `attachMilestoneScreenshot` are not in the example and are not provided by this package.
