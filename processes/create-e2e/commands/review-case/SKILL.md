---
name: review-case
description: >-
  Check whether a case has steps specific enough to assert. The case is an
  existing id or pasted test case text. Ask when a step cannot be checked,
  then update that same case when it came from an id. Use before automating
  a case. Does not write a spec.
---

# Review case steps

Input is exactly one of `case_id` or `case_text`, plus `.e2e-qa-pilot/settings.md` in this project.

- `case_id`: the id of an existing case in the configured case tool.
- `case_text`: the complete test case, including preconditions, steps, and expected results.

The tool call names the mode. Do not decide which one a string is by reading its contents. Both values are ambiguous: ask the human which one to use and stop. Neither value: ask for one of them and stop.

This skill does not write a spec and does not create a second case. Implementation is a later skill, and only after a silent pass.

Ready checks, the question shape, and the mood-diary example: [ready-rules.md](../shared/ready-rules.md).

## Settings

Read `.e2e-qa-pilot/settings.md`. The keys live in the template comment.

Generation keys, both modes: `figma`, `read_figma`, `branch_pattern`, `test_command`, `png_dir`, `pr_label_ready`, `pr_label_mismatch`.

Provider keys, `case_id` mode only: `case_tool`, `fetch_case`, `update_case`.

If a required key for this mode has no value, ask once in chat for every empty key in that set. Write the answers into the file, then continue:

- Context: `figma`, `read_figma`, and in `case_id` mode also `case_tool`, `fetch_case`, `update_case`
- Requirements: `branch_pattern`, `test_command`, `png_dir`
- Goal: `pr_label_ready`, `pr_label_mismatch`

`case_text` mode does not ask for `case_tool`, `fetch_case`, or `update_case`, and does not write placeholder values for them.

Do not ask again on a later run when the keys already have values.

## Resolve the case

`case_id` mode: fetch the case with `fetch_case` from the settings file. If the case tool errors or the case does not exist, stop and report that. Do not invent the case. Do not treat this id as test case text. Do not switch this request to `case_text`.

`case_text` mode: the pasted text is the case. Do not call `fetch_case`. Do not call `update_case`. A case tool is not required. A configured provider is ignored for this call.

The same ready checks apply to the resolved case from either source.

## Title

`case_id` mode uses the title returned by `fetch_case`.

`case_text` mode chooses a title before a spec, a filename, or a pull request is named:

- Prefer a `Title:` line.
- If that line is absent, use the first Markdown H1 (`# `, not `##`).
- If both exist, compare the trimmed texts. A difference in case or surrounding whitespace still uses the `Title:` line. Any other difference asks one question. Do not pick silently.
- If neither exists, ask for a short title before generating the spec.
- Do not take a precondition or a step as the title.
- Do not invent an external id or a case URL.

Display text preserves the original casing and internal wording, with surrounding whitespace removed. Filenames, the pull request title, the spec title, and the duplicate check use that trimmed title. Do not leave leading or trailing whitespace in those names.

## Ready

Follow [ready-rules.md](../shared/ready-rules.md).

A missing Figma URL is recorded as "steps are the oracle". It does not fail the case.

## Silent pass

Say the case is ready in one or two sentences, then continue in the same turn:

- `case_id` mode: a `figma.com` URL in the description or a custom field, and `figma: on` in the settings file → [add-from-design](../add-from-design/SKILL.md).
- `case_text` mode: a `figma.com` URL anywhere in the pasted text, and `figma: on` → [add-from-design](../add-from-design/SKILL.md).
- No such URL, or `figma: off` → [add-from-steps](../add-from-steps/SKILL.md).

Pass the same input mode to that skill. `case_text` mode passes the pasted text, including any clarified steps and the chosen title. That skill applies the duplicate search and the `branch_pattern` rule.

## Not ready

Stop. Ask in chat. One question per hole. Quote the step. Do not invent the expected result. Do not implement in that turn.

Holes: no expected result, a vague word, two names for one control, contradictory steps, or preconditions that do not say who is signed in and where they start.

After the user answers, show the step diff.

`case_id` mode: update that same case with `update_case` from the settings file. Re-read the case with `fetch_case`. Confirm the written preconditions and steps match the diff. If an answer is still missing, do not write.

`case_text` mode: do not call `update_case` and do not call `fetch_case`. Do not create a case. The clarified text is the case for the next turn.

The next turn, after the re-read matches or the clarified text is the case, starts the implementation skill from the silent-pass routes above.

## Update

This section applies only in `case_id` mode.

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

## Tool contract

`review_case`

- Inputs: exactly one of `case_id` or `case_text`, and the settings file `.e2e-qa-pilot/settings.md`
- Result: the case is ready and routed, or one question per hole was asked and that same case was updated when it came from an id
- The agent still asks, and does not invent an expected result
