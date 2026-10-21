---
name: add-from-steps
description: >-
  Add an end-to-end spec from one case whose steps name a screen, control, or
  visible change, and whose description has no Figma URL. Branches from the
  settings file and opens a pull request to main. Assertions stay on the
  expected results. Use when review-case passes with no Figma link, or the
  user asks to automate a case from its steps.
---

# Add end-to-end coverage from case steps

The steps are the contract. Input is one case id, plus `.e2e-qa-pilot/settings.md`. Fetch the case with `fetch_case` from that file.

This skill does not call `update_case`. A case that is not ready to assert is [review-case](../review-case/SKILL.md).

This skill checks the expected-result text. It does not run a Figma visual review and it does not stop to ask whether a visual difference is acceptable.

PR body, the word rule, and the screenshot gate: [pr-evidence.md](../shared/pr-evidence.md). Ready checks: [ready-rules.md](../shared/ready-rules.md).

If the settings keys are still empty, stop and run [review-case](../review-case/SKILL.md). Do not ask a second time.

## Gate

Stop before any docs or spec when any of these is true:

- A spec whose title starts with `<case-id>` already exists. Do not add a second spec.
- The description or a custom field contains a `figma.com` URL and the settings file has `figma: on`. Use [add-from-design](../add-from-design/SKILL.md).
- A step has no expected result, uses `correct`, `properly`, or `etc.`, gives one control two names, or contradicts another step. Use [review-case](../review-case/SKILL.md). Do not implement in that turn.

`source-hash` in the description is not a gate. Do not compare it to another case. Do not open a hash-mismatch pull request. The contract is the current steps.

## Branch

Read `branch_pattern` from the settings file. From fresh `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b <branch from branch_pattern>
```

If that branch already exists on the remote, check it out and pull. Do not create a second branch. The pull request targets `main`. Never auto-merge.

Commit messages: `fix: <short explanation>`.

## Docs, then code

Read `png_dir` from the settings file. Read the settings file for where page objects, flows, and the spec live.

1. `overview.md`, Gherkin under `specs/`, page contracts under `pages/`. Copy each expected result into `## Expected behavior`. Locator hints in `## Elements` may change between runs. Expected-behavior text may not. `## Reference` says "Captured from the running app" and cites `screenshots/<state>.png` under `png_dir`. Do not invent a Figma node. `## Visible copy` records the exact on-screen title, button labels, placeholders, tab names, and toast text. `## States` has one block per distinct screen (open picker, filled chip, next tab, toast), each naming its screenshot and case step. The overview coverage table has the step, the action, the page contract, and the screenshot. No Figma column. One modal stays one page contract. A different dialog gets its own page contract.
2. Page objects. Reuse existing ones. Read the settings file for where they live.
3. Flows. Reuse existing ones. Pass `testInfo`. Before each screenshot:

```typescript
testInfo.annotations.push({
  type: 'case-step',
  description: '1. <action from the case step>',
});
testInfo.annotations.push({
  type: 'page-contract',
  description: '<page contract path from the settings file>',
});
```

4. Thin spec. Title: `<case-id> <case title>`. Import `test` from the fixture named in the settings file.

Prefer `getByRole`, `getByLabel`, `getByPlaceholder`. Wait with `expect(...).toBeVisible()` or `toHaveURL()`.

On each run, compare the screenshot to the page contract's Elements, Visible copy, and the expected result. Do not edit the app.

After a green run, copy a PNG into `png_dir` only when it passes the Screenshot gate in [pr-evidence.md](../shared/pr-evidence.md). The page contract and the overview step-coverage table cite those files. A step with no image cites none. Do not write a second copy under a case folder. Do not write docs from the spec on every run.

## Assertions

Follow the word rule in [pr-evidence.md](../shared/pr-evidence.md).

Assert every expected-result sentence, including a multi-bullet result (toast text, modal closed, preview entry, chart dot). Copy the case wording into the assertion message, including awkward grammar.

Quoted copy is the same message when, after lowercasing and stripping punctuation, the words match once filler words `a`, `the`, `has`, and `been` are ignored. Record the on-screen sentence. Do not change the case. Do not add the mismatch label for that difference. Use `sameVisibleMessage`. Example: case **"Your diary entry has successfully created"** and screen **Your Diary entry successfully created!** are the same message.

A different message (another verb, a missing screen, a missing control) is a mismatch. Leave the assertion. The spec stays red.

Take the step PNG of the control that proves the step (modal, open picker, toast) while that result is still on screen. A toast that auto-dismisses is captured while it is visible.

## Screenshot gate

Follow [pr-evidence.md](../shared/pr-evidence.md).

Look at the PNG before it is copied into `png_dir` or linked in the pull request.

- Keep it when the image shows the control or change named in that row (open modal, open picker, filled chip, new tab, toast).
- A picture that matches an earlier step does not prove this step.
- One retry only: capture the proving control (`locator.screenshot` or a clip of that control), not the same full viewport.
- If the second image still does not show the step, omit the file. The table row stays. The Screenshot cell is `—`. No image heading for that step.
- The last step always keeps its PNG. That shot is the end state.
- A missing image is not a failed assertion. Do not change the expected result to match a useless screenshot.

`assertion_edits` stays 0. Rewriting the expected sentence so the spec goes green is an assertion edit. Comparing with the word rule above is not. A green run bought by editing the expected sentence is a failed skill run. Revert it and open the mismatch pull request.

## Run loop

Read `test_command` from the settings file. Run that command for this spec with retries off. Never install browsers. The browser is already installed.

The five-run ceiling is for the whole spec, not five per step. Each command is one run. Retries off disables the runner's automatic repeat of the same failure. Stop early when the expected result passes.

- Locator or timing: the control named by the action is not on screen yet. Change the locator or the wait. Run again.
- Same message: the on-screen sentence matches the case under the word rule in Assertions. Record the screen sentence and continue the later sentences of that step.
- Behavior: a found control's text or state is a different result. Stop on that run. Do not spend the remaining attempts searching for a different string. Leave the assertion. Do not treat later steps as passed.

## Pull request

One PR to `main`. Evidence rules and the body template are in [pr-evidence.md](../shared/pr-evidence.md).

| Outcome | Label | PR |
|---------|--------|----|
| Every expected result is functionally visible, including a same-message wording difference. Each published PNG passes the Screenshot gate, and the last step has a PNG. `assertion_edits` is 0 | `pr_label_ready` from the settings file | Ready |
| The screen shows a different result | `pr_label_mismatch` from the settings file | Draft. The spec stays red |

Screenshot links in the body are head-branch blob and raw URLs. The path is `png_dir` from the settings file. A relative path does not open the file. Link text stays `step-01`. A step whose image failed the Screenshot gate has `—` in the Screenshot cell and no image block. When a step passes only because of a small wording difference, the body includes the QA action block and `## Visible copy` records the on-screen sentence. The agent does not edit the case. That difference is not an assertion edit. Steps that never ran have no PNG. Do not commit `test-results/` or the HTML report folder. Do not use `test.fixme`. A red pull-request check is the expected CI result on a mismatch.

Do not edit the nightly workflow.

## Future tool

`add_from_steps`

- Inputs: the case id, and the settings file `.e2e-qa-pilot/settings.md`
- Result: a ready pull request, or a draft pull request whose spec stays red
- The agent still reads the screen
