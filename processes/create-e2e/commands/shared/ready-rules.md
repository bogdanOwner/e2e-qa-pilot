# Ready rules

Templates for [review-case](../review-case/SKILL.md).

All of these hold:

- Preconditions say who is signed in and where they start.
- Every step has an action and an expected result.
- The expected result names a screen, quotes a control, or states a visible change.
- No `correct`, `properly`, `etc.`, and no second name for the same control.
- Steps do not contradict each other.

A missing Figma URL is recorded as "steps are the oracle". It does not fail the case. A case written like the mood diary list below passes with no question.

## Ready example

A mood-diary list passes with no question. Each expected result names something visible:

1. Action: Open the Personal Space page. Expected: The Mood Diary component is displayed.
2. Action: Click the Awesome mood emoji. Expected: The Create Diary Entry modal opens with Awesome preselected.
3. Action: Click Save, after the earlier fields. Expected: toast "Your diary entry has successfully created", the modal closes, the entry appears in the preview, a dot appears on the chart.

Awkward product copy stays quoted. Do not correct it.

## Not ready example

Steps 3–6 say "Save button". Step 7 says "Start achieving" for the same submit control. That is two names. Ask which control the later step means. Do not pick one.

## Question

One question per hole. Quote the step. Do not invent the expected result.

```text
Step 7 expected result: "Start achieving button remains enabled."
Steps 3–6 call the same control "Save button".
Which label is on the control after the time is selected?
```

Holes: no expected result, a vague word, two names for one control, contradictory steps, or preconditions that do not say who is signed in and where they start.
