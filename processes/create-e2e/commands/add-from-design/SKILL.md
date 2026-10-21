---
name: add-from-design
description: >-
  Add or extend end-to-end tests from a case that has a Figma URL. Docs first.
  Compare each milestone to the case, the page contract, and the Figma frame.
  Stop and ask in chat before a pull request.
---

# Add end-to-end coverage from Figma

Runs only after [review-case](../review-case/SKILL.md) routes here: the settings file has `figma: on`, and the case description or a custom field contains a `figma.com` URL.

Input is one case id, plus `.e2e-qa-pilot/settings.md`. Fetch the case with `fetch_case` from that file. Read `read_figma`, `png_dir`, `branch_pattern`, and `test_command` from that file.

If the settings keys are still empty, stop and run [review-case](../review-case/SKILL.md). Do not ask a second time.

**Docs first, code second.** Do not add a spec until the feature has an overview, Gherkin, and page contracts.

Case steps define *what* to automate. Page contracts and Figma define *what the screen should look like*.

Read `branch_pattern` from the settings file. From fresh `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b <branch from branch_pattern>
```

If that branch already exists on the remote, check it out and pull. Do not create a second branch. The pull request targets `main`. Never auto-merge. Do not open a pull request until Phase D is clear.

## Phase A — Intake: step coverage map (before coding)

1. From the fetched case, extract **steps**, **preconditions**, and the **Figma URL**.
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
- Include the case id in the feature `overview.md`.
- **Spec test title:** set the `test()` name to the exact case title prefixed with the case id — for example `test('<case-id> As a User I can edit the personal goal.', …)`. Use the title from `fetch_case`. Do not invent a separate descriptive name.

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

- Inputs: the case id, and the settings file `.e2e-qa-pilot/settings.md`
- Result: each milestone is `MATCH`, or the agent stopped for a human answer on a `MINOR` or `BLOCKER` against the Figma frame
- The agent still reads the screen and asks. No pull request until that answer
