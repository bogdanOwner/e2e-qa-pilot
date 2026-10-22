---
name: add-from-design
description: >-
  Add or extend end-to-end tests from a case that has a Figma URL. The case
  is an existing id or pasted test case text. Docs first. Compare each
  milestone to the case, the page contract, and the Figma frame. Stop and
  ask in chat before a pull request.
---

# Add end-to-end coverage from Figma

Runs only after [review-case](../review-case/SKILL.md) routes here: the settings file has `figma: on`, and the resolved case has a `figma.com` URL. `case_id`: that URL is in the description or a custom field. `case_text`: that URL is anywhere in the pasted text.

Input is exactly one of `case_id` or `case_text`, plus `.e2e-qa-pilot/settings.md`. The tool call names the mode. Do not decide which one a string is by reading its contents.

`case_id`: fetch the case with `fetch_case` from that file. If the case tool errors or the case does not exist, stop and report that. Do not invent the case. Do not treat this id as test case text.

`case_text`: the pasted text is the case. Do not call `fetch_case`. Do not call `update_case`. A case tool is not required.

Read `read_figma`, `png_dir`, `branch_pattern`, and `test_command` from that file.

If a generation key is still empty (`figma`, `read_figma`, `branch_pattern`, `test_command`, `png_dir`, `pr_label_ready`, `pr_label_mismatch`), stop and run [review-case](../review-case/SKILL.md). Do not ask a second time. Empty `case_tool`, `fetch_case`, and `update_case` are expected in `case_text` mode.

**Docs first, code second.** Do not add a spec until the feature has an overview, Gherkin, and page contracts.

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

`case_text`: search existing spec titles in the spec location from settings. Normalize by trimming, lowercasing, collapsing whitespace, and stripping punctuation. An equal normalized title is the existing spec. Do not add another. A normalized title that contains the other, in either direction, is only a likely match. Read that spec. Ask one question only when the read leaves it ambiguous whether it is the same test. Do not block a genuinely different test because its title contains similar words. If the spec location cannot be listed or read, say the duplicate check could not be completed. Do not claim that no duplicate exists.

## Branch

Read `branch_pattern` from the settings file. It is the configured branch name, not a template. This package does not substitute placeholders.

If this run has no external case id and the saved value contains `<case-id>`, `{case_id}`, or the words `case id`, ask once for a branch name. Never invent an id.

Run `git check-ref-format --branch` on the final name. If Git accepts the configured value, use it. If Git rejects it, ask once for another name.

From fresh `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b <branch from branch_pattern>
```

If that branch already exists on the remote, check it out and pull. Do not create a second branch. The pull request targets `main`. Never auto-merge. Do not open a pull request until Phase D is clear.

## Phase A — Intake: step coverage map (before coding)

1. From the resolved case, extract **steps**, **preconditions**, and the **Figma URL**. `case_id` reads that URL from the description or a custom field. `case_text` reads it from the pasted text.
2. Add a **step coverage table** to the feature `overview.md`:

| Step | Gherkin / action | Page contract | Milestone attachment | Figma frame |
|------|------------------|---------------|----------------------|-------------|
| 1. Open Personal Space | `When the user opens Personal Space…` | the page contract for that screen | `02-personal-space` | node id from the Figma URL |

3. For each page in the table, capture a **reference image**:
   - **Preferred:** `read_figma` from the settings file, saved under `png_dir`
   - **Fallback:** a capture from the running app if the Figma frame is missing or outdated
4. Add `## Case coverage` to affected page contracts. Fill `## Visible copy` and `## States` from the Figma frame: exact titles, button labels, placeholders, and one state block per distinct screen, each citing its screenshot under `png_dir`.

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
- Include the case id in the feature `overview.md`, or the inline display title when there is no id.
- **Spec test title:** `case_id` uses the exact case title prefixed with the case id — for example `test('<case-id> As a User I can edit the personal goal.', …)`. Use the title from `fetch_case`. `case_text` uses the trimmed title, with no invented id. Do not invent a separate descriptive name.

Read the settings file for where page objects, flows, and the spec live. Reuse existing page objects and flows.

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

- `MATCH` — no action
- `MINOR` — copy, spacing, or icon drift → proceed to Phase D
- `BLOCKER` — wrong screen, missing step, broken flow, or `01-final-screen` does not cover the case → proceed to Phase D; do not open a pull request until resolved

## Phase D — Clarify unexpected diffs

**Stop and ask in chat** when Phase C finds any `MINOR` or `BLOCKER` diff. Do not assume drift is acceptable.

For **each** diff, present:

1. **Milestone** — attachment name (for example `02-personal-space`)
2. **Case step** — expected action and result from the case
3. **Figma / page contract** — what the design and the docs say should appear
4. **Actual screenshot** — describe the real diff (missing element, wrong copy, extra modal, wrong tab state)
5. **Question** — *Is this difference expected?*

| User answer | Agent action |
|-------------|--------------|
| **Expected** (case or Figma outdated, known deploy gap) | Document in `## Known visual gaps` in the feature `overview.md`, and add **Visual parity notes** in the pull request |
| **Not expected** | Fix the test, update the page contract, or flag a product bug — then run Phase C again |
| **Unclear** | Ask one follow-up; do not proceed to a pull request |

Never silently ship a `MINOR` or `BLOCKER` without a human answer. No pull request until every milestone is `MATCH` or the human has accepted the gap.

After that answer, the pull request body follows [pr-evidence.md](../shared/pr-evidence.md). Read `pr_label_ready` and `pr_label_mismatch` from the settings file.

## Future tool

`add_from_design`

- Inputs: exactly one of `case_id` or `case_text`, and the settings file `.e2e-qa-pilot/settings.md`
- Result: each milestone is `MATCH`, or the agent stopped for a human answer on a `MINOR` or `BLOCKER` against the Figma frame
- The agent still reads the screen and asks. No pull request until that answer
