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

Input is exactly one of `case_id` or `case_text`, plus `.e2e-qa-pilot/settings.md` and `.e2e-qa-pilot/project.md`. Read both first. [project-config.md](../shared/project-config.md) says how `project.md` is read and what to do instead of asking. The tool call names the mode. Do not decide which one a string is by reading its contents.

`case_id`: fetch the case with `fetch_case` from that file. If the case tool errors or the case does not exist, stop and report that. Do not invent the case. Do not treat this id as test case text.

`case_text`: the pasted text is the case. Do not call `fetch_case`. Do not call `update_case`. A case tool is not required.

Read `read_figma`, `png_dir`, `branch_pattern`, and `test_command` from that file. A missing or empty `branch_pattern` uses the default in [workflow.md](../shared/workflow.md#workflow-resolution).

If `figma`, `read_figma`, or `test_command` is still empty, stop and run [review-case](../review-case/SKILL.md). This command runs only with `figma: on`, so `read_figma` is needed here. `## Design` in `project.md` answers `figma` and `read_figma`. Do the same for an empty `png_dir` when `project.md` does not name the screenshot directory. Do not ask a second time. A missing `pr_mode` means `create_pr_for_review`. A missing label uses `e2e:ready`, `e2e:minor-text-diff`, or `e2e:mismatch`. Empty `case_tool`, `fetch_case`, and `update_case` are expected in `case_text` mode.

Title, duplicate check, branch name, git steps, commit subject, and file locations are in [workflow.md](../shared/workflow.md). Follow it. Stop on a duplicate before any docs or spec. Do not open a pull request until Phase D is clear.

Context repos are read-only: read them for locators and test ids, never write to one, and open the pull request only in this repository ([project-config.md](../shared/project-config.md#context-repos)). Feature flags are never changed, by you or by the spec. Keep any `Feature flag:` precondition lines from review-case and copy them into the pull request body. Use the `{ticket_id}` that review-case recorded, and ask once only when `## Ticket` requires an id and none was recorded.

**Match the repo, then code.** Resolve locations in [Where files live](../shared/workflow.md#where-files-live). When that resolution is the reference layout, do not add a spec until the feature has an overview, Gherkin, and page contracts. Otherwise do not create `overview.md`, `specs/`, or `pages/`.

Case steps define *what* to automate. Page contracts and Figma define *what the screen should look like*.

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
- Before each milestone attachment, push annotations. The example calls `attachMilestoneScreenshot`, a helper from one project. This package does not provide it. Use the helper the repo already has. A repo without one attaches the image in the same place with `await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' })`.

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

Use the locations from [Where files live](../shared/workflow.md#where-files-live). Reuse page objects and flows only when the repo already has them. Import `test` from the fixture existing specs already use. When the repo has no fixture, import `test` the way those specs do. Do not add a fixture file. The spec goes in the resolved spec directory.

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
