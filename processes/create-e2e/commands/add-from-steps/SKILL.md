---
name: add-from-steps
description: >-
  Add an end-to-end spec from one case whose steps name a screen, control, or
  visible change, and whose description has no Figma URL. Branches from the
  settings file and opens a pull request to main. Assertions stay on the
  expected results. The case is an existing id or pasted test case text.
  Use when review-case passes with no Figma link, or the user asks to
  automate a case from its steps.
---

# Add end-to-end coverage from case steps

The steps are the contract. Input is exactly one of `case_id` or `case_text`, plus `.e2e-qa-pilot/settings.md`. The tool call names the mode. Do not decide which one a string is by reading its contents.

`case_id`: fetch the case with `fetch_case` from that file. If the case tool errors or the case does not exist, stop and report that. Do not invent the case. Do not treat this id as test case text.

`case_text`: the pasted text is the case. Do not call `fetch_case`. Do not call `update_case`. A case tool is not required.

This skill does not call `update_case`. A case that is not ready to assert is [review-case](../review-case/SKILL.md).

This skill checks the expected-result text. It does not run a Figma visual review and it does not stop to ask whether a visual difference is acceptable.

PR body, the word rule, and the screenshot gate: [pr-evidence.md](../shared/pr-evidence.md). Ready checks: [ready-rules.md](../shared/ready-rules.md).

If a generation key is still empty (`figma`, `read_figma`, `branch_pattern`, `test_command`, `png_dir`, `pr_label_ready`, `pr_label_mismatch`), stop and run [review-case](../review-case/SKILL.md). Do not ask a second time. Empty `case_tool`, `fetch_case`, and `update_case` are expected in `case_text` mode.

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

## Gate

Stop before any docs or spec when any of these is true:

- `case_id`: a spec whose title starts with `<case-id>` already exists. Do not add a second spec.
- `case_text`: search existing spec titles in the spec location from settings. Normalize by trimming, lowercasing, collapsing whitespace, and stripping punctuation. An equal normalized title is the existing spec. Do not add another. A normalized title that contains the other, in either direction, is only a likely match. Read that spec. Ask one question only when the read leaves it ambiguous whether it is the same test. Do not block a genuinely different test because its title contains similar words. If the spec location cannot be listed or read, say the duplicate check could not be completed. Do not claim that no duplicate exists.
- `case_id`: the description or a custom field contains a `figma.com` URL and the settings file has `figma: on`. `case_text`: a `figma.com` URL anywhere in the pasted text and `figma: on`. Use [add-from-design](../add-from-design/SKILL.md).
- A step has no expected result, uses `correct`, `properly`, or `etc.`, gives one control two names, or contradicts another step. Use [review-case](../review-case/SKILL.md). Do not implement in that turn.

`source-hash` in the description is not a gate. Do not compare it to another case. Do not open a hash-mismatch pull request. The contract is the current steps.

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

4. Thin spec. `case_id` title: `<case-id> <case title>`. `case_text` title: the trimmed title, with no invented id. Import `test` from the fixture named in the settings file.

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

- Inputs: exactly one of `case_id` or `case_text`, and the settings file `.e2e-qa-pilot/settings.md`
- Result: a ready pull request, or a draft pull request whose spec stays red
- The agent still reads the screen
