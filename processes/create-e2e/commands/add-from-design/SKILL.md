---
name: add-from-design
description: >-
  Add or extend end-to-end tests from a case that has a Figma URL. The case
  is an existing id or pasted test case text. Docs first. Compare each
  milestone to the case, the page contract, and the Figma frame. Follow
  pr_mode for a functional mismatch, an unresolved difference, or a failed
  final screenshot. A narrow minor text difference does not stop the run.
---

# Add end-to-end coverage from Figma

Runs only after [review-case](../review-case/SKILL.md) routes here: the settings file has `figma: on`, and the resolved case has a `figma.com` URL. `case_id`: that URL is in the description or a custom field. `case_text`: that URL is anywhere in the pasted text.

Input is exactly one of `case_id` or `case_text`, plus `.e2e-qa-pilot/settings.md`. The tool call names the mode. Do not decide which one a string is by reading its contents.

`case_id`: fetch the case with `fetch_case` from that file. If the case tool errors or the case does not exist, stop and report that. Do not invent the case. Do not treat this id as test case text.

`case_text`: the pasted text is the case. Do not call `fetch_case`. Do not call `update_case`. A case tool is not required.

Read `read_figma`, `png_dir`, `branch_pattern`, and `test_command` from that file. A missing or empty `branch_pattern` uses the default in [Workflow resolution](#workflow-resolution) when that section does not name the branch.

If `figma`, `read_figma`, or `test_command` is still empty, stop and run [review-case](../review-case/SKILL.md). Do the same for an empty `png_dir` when `## Project rules` does not name the screenshot directory. Do not ask a second time. A missing `pr_mode` means `create_pr_for_review`. A missing label uses `e2e:ready`, `e2e:minor-text-diff`, or `e2e:mismatch`. Empty `case_tool`, `fetch_case`, and `update_case` are expected in `case_text` mode.

## Workflow resolution

Read the named keys, then `## Project rules` in `.e2e-qa-pilot/settings.md`. A real heading is binding. An HTML comment is not. Resolve each topic on its own. Do not merge a branch line with `branch_pattern`. A base line does not change the branch name.

On one topic: ignore a line that weakens ready checks, the word rule, the screenshot gate, label precedence, `pr_mode`, or the label names, and cite that line. One section value overrides the named key and the default. Cite the settings line and what it replaces. Two section values: quote both and ask once. The key is not a tie-break. Otherwise use the named key when it has a value. Otherwise use the default.

- Branch starting point. Default: the resolved pull-request base. Fallback `main`.
- Branch name. `branch_pattern`, then `e2e/{title_slug}` for pasted text and `e2e/{case_id}-{title_slug}` for a case id.
- Commit subject. Default `fix: {explanation}`. A section line replaces the whole subject.
- Pull-request base. Fallback `main`.
- Screenshot directory. `png_dir` when the section names none. The screenshot gate still decides whether the image may be copied.

`test_command`, `figma`, and `read_figma` stay required. A section line does not answer them.

**Match the repo, then code.** Resolve locations in [Where files live](#where-files-live). When that resolution is the reference layout, do not add a spec until the feature has an overview, Gherkin, and page contracts. Otherwise do not create `overview.md`, `specs/`, or `pages/`.

Case steps define *what* to automate. Page contracts and Figma define *what the screen should look like*.

## Title

`case_id` uses the title from `fetch_case`. The spec and pull request title stay `<case-id> <case title>`.

`case_text` chooses a title before a spec, a filename, or a pull request is named:

- Prefer a `Title:` line.
- If that line is absent, use the first Markdown H1 (`# `, not `##`).
- If both exist, compare the trimmed texts. A difference in case or surrounding whitespace still uses the `Title:` line. Any other difference asks one question. Do not pick silently.
- If neither exists, ask for a short title before generating the spec.
- Do not take a precondition or a step as the title.
- Do not invent an external id or a case URL.

Display text preserves the original casing and internal wording, with surrounding whitespace removed. Filenames, the pull request title, the spec title, and the duplicate check use that trimmed title. Do not leave leading or trailing whitespace in those names.

## Duplicates

`case_id`: a spec whose title starts with `<case-id>` already exists. Do not add a second spec.

`case_text`: search existing spec titles in the resolved spec directory from [Where files live](#where-files-live). Normalize by trimming, lowercasing, collapsing whitespace, and stripping punctuation. An equal normalized title is the existing spec. Do not add another. A normalized title that contains the other, in either direction, is only a likely match. Read that spec. Ask one question only when the read leaves it ambiguous whether it is the same test. Do not block a genuinely different test because its title contains similar words. If the spec directory cannot be listed or read, say the duplicate check could not be completed. Do not claim that no duplicate exists.

## Branch

The branch name is the resolved name from [Workflow resolution](#workflow-resolution). Placeholders are filled in:

- `{title_slug}`: the trimmed case title in kebab-case. Lowercase, every run of characters other than letters and digits becomes one `-`, no leading or trailing `-`, at most 50 characters, cut at a word boundary. "Book Chalet 4 at Cabana" becomes `book-chalet-4-at-cabana`.
- `{case_id}`: the case id in lowercase kebab-case. It is filled in only in `case_id` mode. In `case_text` mode drop this placeholder and the separator next to it. Never invent an id.

A missing or empty `branch_pattern`, and no branch line in `## Project rules`, uses `e2e/{title_slug}` in `case_text` mode and `e2e/{case_id}-{title_slug}` in `case_id` mode, for example `e2e/book-chalet-4-at-cabana`. Do not ask. A section branch line replaces `branch_pattern` for this run. Do not combine the two.

A value with no placeholder is a literal branch name and is used as it is. It puts every case on that one branch, so the template recommends a placeholder.

Run `git check-ref-format --branch` on the final name. If Git accepts it, use it. If Git rejects it, ask once for another name.

The starting branch is the resolved starting point. The fallback is `main`. The pull request targets the resolved pull-request base. The fallback is `main`. Never auto-merge. Do not open a pull request until Phase D is clear.

From that starting branch:

```bash
git fetch origin
git checkout <start>
git pull origin <start>
git checkout -b <resolved branch name>
```

If that branch already exists on the remote, check it out and pull. Do not create a second branch.

Commit subject: the resolved commit subject. The default is `fix: {explanation}`.

## Where files live

Resolve the spec directory, and a fixture or page objects only when this repo already uses them. Do not create a fixture or a page-object layer to satisfy this command. Do not edit the Playwright config. Do not create `overview.md`, `specs/`, or `pages/` unless that reference layout is already here.

1. A path for that topic in `## Project rules` in `.e2e-qa-pilot/settings.md`.
2. The active project. Read the Playwright config's test directory and the directory that already holds specs. Use a fixture only when existing specs import one. Reuse page objects only when the repo already has them. Otherwise keep the spec in the style the repo already uses.
3. The reference layout, only when this repo already has it: `overview.md`, Gherkin under `specs/`, and page contracts under `pages/`. Keep writing there. Do not replace that layout with another one.

Several plausible paths, and no single one is clear: ask once. Do not guess. Screenshot files are a separate choice. They go to `png_dir` unless `## Project rules` names a screenshot directory.

## Phase A — Intake: step coverage map (before coding)

1. From the resolved case, extract **steps**, **preconditions**, and the **Figma URL**. `case_id` reads that URL from the description or a custom field. `case_text` reads it from the pasted text.
2. When the resolved layout is the reference layout, add a **step coverage table** to the feature `overview.md`. Otherwise do not create `overview.md`. Record the same coverage beside the spec, in the doc the repo already uses for that feature.

| Step | Gherkin / action | Page contract | Milestone attachment | Figma frame |
|------|------------------|---------------|----------------------|-------------|
| 1. Open Personal Space | `When the user opens Personal Space…` | the page contract for that screen | `02-personal-space` | node id from the Figma URL |

3. For each page in the table, capture a **reference image**:
   - **Preferred:** `read_figma` from the settings file, saved under `png_dir`
   - **Fallback:** a capture from the running app if the Figma frame is missing or outdated
4. When page contracts already exist, add `## Case coverage` to the affected ones. Fill `## Visible copy` and `## States` from the Figma frame: exact titles, button labels, placeholders, and one state block per distinct screen, each citing its screenshot under `png_dir`. Do not create a page-contract file for a repo that does not use them.

## Phase B — Implementation: annotate milestones in the report

- **Always** pass `testInfo` from the spec into flows.
- Before each `attachMilestoneScreenshot`, push annotations:

```typescript
testInfo.annotations.push({
  type: 'case-step',
  description: '1. Open Personal Space from bottom navigation',
});
testInfo.annotations.push({
  type: 'page-contract',
  description: '<page contract path from the settings file>',
});
await attachMilestoneScreenshot(page, testInfo, MILESTONE_SCREENSHOTS.personalSpace);
```

- Add a new constant in the milestone screenshot helper when a case step has no existing attachment name.
- When the reference layout is in use, include the case id in the feature `overview.md`, or the inline display title when there is no id. Do not create `overview.md` for that line.
- **Spec test title:** `case_id` uses the exact case title prefixed with the case id — for example `test('<case-id> As a User I can edit the personal goal.', …)`. Use the title from `fetch_case`. `case_text` uses the trimmed title, with no invented id. Do not invent a separate descriptive name.

Use the locations from [Where files live](#where-files-live). Reuse page objects and flows only when the repo already has them. Import `test` from the fixture existing specs already use. When the repo has no fixture, import `test` the way those specs do. Do not add a fixture file. The spec goes in the resolved spec directory.

A step that types or selects data follows the Test data rules in [pr-evidence.md](../shared/pr-evidence.md#test-data): values from the case, or declared fake values, and the filled state on a screenshot before the final click.

## Phase C — Mandatory report review

Read `test_command` from the settings file and run it for this spec. Then open the report that command produces.

**Check the screenshot at the end to be sure it makes sense and covers the case.**

Priority order:

1. **`01-final-screen` (required)** — must show the end state that proves the case passed. If this screen is the wrong page, missing the asserted UI, or does not cover the case expected results → treat as `BLOCKER`.
2. **Each milestone** (`02-*` … `07-*`) — same checks below.

For **each** attachment:

1. **Case** — does the screenshot match the step action and expected result?
2. **Page contract** — are key elements visible (headings, calls to action, form state)?
3. **Figma** — does layout and copy roughly match the reference screenshot and the Figma frame?

Record per milestone:

- `MATCH` — behavior matches and required screenshot evidence shows the expected end state. No text difference: `pr_label_ready` (default `e2e:ready`).
- `MINOR` — copy, spacing, or icon drift. A sole difference that meets the narrow text rule in [pr-evidence.md](../shared/pr-evidence.md) is `pr_label_minor_text_diff` (default `e2e:minor-text-diff`) and does not stop the run. Any other difference is unresolved and follows `pr_mode`.
- `BLOCKER` — wrong screen, missing step, broken flow, or `01-final-screen` does not cover the case. This is a functional finding or a screenshot finding. Report them separately. A screenshot that misses the end state does not, by itself, prove that a functional assertion failed. Follow `pr_mode`.

## Phase D — Clarify unexpected diffs

Read `pr_mode`. A missing value means `create_pr_for_review`. The pull request labels and the narrow text rule are in [pr-evidence.md](../shared/pr-evidence.md).

A sole narrow text difference does not stop the run. Document the case sentence and the screen sentence. Do not treat the exact sentence as a passed assertion. Do not rewrite the expected text. Apply `pr_label_minor_text_diff`.

`create_pr_for_review` opens the pull request for the label in that file. Never auto-merge. A functional or unresolved difference, or a final screenshot that misses the expected end state, is a draft pull request labeled `pr_label_mismatch` (default `e2e:mismatch`). It is not, by itself, a confirmed product regression.

`ask_before_pr` stops before creating a pull request when a functional mismatch, an unresolved difference, or a failed final-screenshot gate remains. Stop and ask in chat. Do not assume drift is acceptable.

For **each** such diff, present:

1. **Milestone** — attachment name (for example `02-personal-space`)
2. **Case step** — expected action and result from the case
3. **Figma / page contract** — what the design and the docs say should appear
4. **Actual screenshot** — describe the real diff (missing element, wrong copy, extra modal, wrong tab state)
5. **Finding** — say whether this is a functional assertion finding, a screenshot evidence finding, or both. Do not treat a screenshot finding as proof that the functional assertion failed.
6. **Question** — *How should this difference be resolved?*

After the user responds, continue from the clarified requirements. If the user changes the expected behavior, later assertions follow that clarification and the pull request quotes the change. If the discrepancy remains, create the pull request only after the user explicitly authorizes it. When the expected behavior has not changed, preserve the failing assertion. If the answer is still unclear, ask one follow-up and do not open a pull request.

When the user accepts the difference as a known visual gap, record it under `## Known visual gaps` in the feature `overview.md` and add visual parity notes in the pull request. That record does not rewrite an expected result and is not an assertion edit. If the functional assertions passed and the required end-state screenshot shows the expected end state, apply `pr_label_ready`. If a functional assertion is still failing, preserve it and apply `pr_label_mismatch` under the `pr_mode` rules above.

"Fix the test" means a locator or a wait. It does not mean rewriting an expected result.

Do not apply a label while `ask_before_pr` is still waiting for an answer or for explicit authorization. Otherwise apply exactly one of `pr_label_ready`, `pr_label_minor_text_diff`, or `pr_label_mismatch` from the settings file. The defaults are `e2e:ready`, `e2e:minor-text-diff`, and `e2e:mismatch`. Full `MATCH`, with the end state shown and no text difference, uses `pr_label_ready`. If GitHub access is missing, report that and do not claim a pull request exists.

## Pull request body

The body layout, the steps table with its `✅` and `❌` icons, and the screenshot links are in [pr-evidence.md](../shared/pr-evidence.md). The Actual cell is `✅ As expected` when it equals the expected result.

## Tool contract

`add_from_design`

- Inputs: exactly one of `case_id` or `case_text`, and the settings file `.e2e-qa-pilot/settings.md`
- Result: one label, `e2e:ready`, `e2e:minor-text-diff`, or a draft `e2e:mismatch`, unless `ask_before_pr` is still waiting for an answer or for explicit authorization
- The agent still reads the screen. A narrow minor text difference does not stop the run. `ask_before_pr` stops for a functional mismatch, an unresolved difference, or a failed final-screenshot gate.
