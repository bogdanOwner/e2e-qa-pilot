---
name: review-case
description: >-
  Check whether an existing case has steps specific enough to assert. Ask when
  a step cannot be checked, then update that same case. Use when the user
  gives a case id, asks if a case is ready, or before automating a case.
  Does not write a spec.
---

# Review case steps

Input is one existing case id, plus `.e2e-qa-pilot/settings.md` in this project.

This skill does not write a spec and does not create a second case. Implementation is a later skill, and only after a silent pass.

Ready checks, the question shape, and the mood-diary example: [ready-rules.md](../shared/ready-rules.md).

## Settings

Read `.e2e-qa-pilot/settings.md`. The keys live in the template comment: `case_tool`, `fetch_case`, `update_case`, `figma`, `read_figma`, `branch_pattern`, `test_command`, `png_dir`, `pr_label_ready`, `pr_label_mismatch`.

If any of those keys has no value, ask once in chat for every empty key. Write the answers into the file, then continue:

- Context: `case_tool`, `fetch_case`, `update_case`, `figma`, `read_figma`
- Requirements: `branch_pattern`, `test_command`, `png_dir`
- Goal: `pr_label_ready`, `pr_label_mismatch`

Do not ask again on a later run when the keys already have values.

Fetch the case with `fetch_case` from that file.

## Ready

Follow [ready-rules.md](../shared/ready-rules.md).

A missing Figma URL is recorded as "steps are the oracle". It does not fail the case.

## Silent pass

Say the case is ready in one or two sentences, then continue in the same turn:

- A `figma.com` URL in the description or a custom field, and `figma: on` in the settings file → [add-from-design](../add-from-design/SKILL.md).
- No such URL, or `figma: off` → [add-from-steps](../add-from-steps/SKILL.md).

## Not ready

Stop. Ask in chat. One question per hole. Quote the step. Do not invent the expected result. Do not implement in that turn.

Holes: no expected result, a vague word, two names for one control, contradictory steps, or preconditions that do not say who is signed in and where they start.

After the user answers, show the step diff. Then update that same case with `update_case` from the settings file. Re-read the case with `fetch_case`. Confirm the written preconditions and steps match the diff. If an answer is still missing, do not write.

The next turn, after the re-read matches, starts the implementation skill from the silent-pass routes above.

## Update

`update_case` updates when the id is set. Omitting the id creates a new case. Always pass the id.

- id: the existing case id
- title: the current title, unless the user's answer changes it
- automation, status, suite id, tags: the values just read. Leave automation status alone
- preconditions: the clarified text
- steps type: `classic`
- steps: action, expected result, and data when the step has input data
- description: keep the existing text. Append:

```text
Steps clarified YYYY-MM-DD. Assertions follow this case.
```

Do not delete the case.

Then `fetch_case` the same id. The stored preconditions and steps match the diff you showed. A mismatch stops. Do not write again with a guessed fix.

## Future tool

`review_case`

- Inputs: the case id, and the settings file `.e2e-qa-pilot/settings.md`
- Result: the case is ready and routed, or one question per hole was asked and that same case was updated
- The agent still asks, and does not invent an expected result
