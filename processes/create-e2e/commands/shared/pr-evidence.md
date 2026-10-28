# Pull request evidence

PR template and evidence names for [add-from-steps](../add-from-steps/SKILL.md).

This command checks the expected-result text. It does not use the Figma visual review.

A failed functional assertion is a mismatch. It is not, by itself, a confirmed product regression. A narrow text difference is not a failed assertion.

## Word rule

The spec asserts functional outcomes: the control is present, the modal closes, the preview updates, the chart dot appears, and the other visible behavior in the expected result. Copy that behavior from the case into the assertion, including awkward grammar.

Do not put the quoted case sentence in an assertion when, after lowercasing, stripping punctuation, and dropping the filler words `a`, `the`, `has`, and `been`, the remaining words match in the same order. Record the case sentence and the screen sentence in the steps table and in the pull request comments. The verdict for that quoted sentence is not `pass`. Example: case **"Your diary entry has successfully created"** and screen **Your Diary entry successfully created!**

That difference is not an exact-text pass. Functional checks in the same step stay `pass` when they pass. State that the original exact sentence was not a passing assertion.

When the remaining words do not match in the same order, the text difference is unresolved. Assert the case sentence and leave that assertion failing. The spec stays red. Do not treat it as a minor text difference.

Do not rewrite the expected sentence. Do not change an assertion so the exact case sentence appears to pass. `assertion_edits` stays 0. Comparing with this rule is not an assertion edit. A green run bought by editing the expected sentence is a failed skill run. Revert it and open the mismatch pull request.

When this minor difference is the only issue, and required screenshot evidence meets the acceptance criteria, the pull request label is `pr_label_minor_text_diff` from the settings file. The default is `e2e:minor-text-diff`. It is not `e2e:ready`.

A different message (another verb, a missing screen, a missing control) is a functional mismatch. Leave the functional assertion. The spec stays red. A failed functional assertion is a mismatch. It is not, by itself, a confirmed product regression.

## Screenshot gate

Look at the PNG before it is copied into `png_dir` from the settings file or linked in the pull request.

- Keep it when the image shows the control or change named in that row (open modal, open picker, filled chip, new tab, toast).
- A picture that matches an earlier step does not prove this step.
- One retry only: capture the proving control (`locator.screenshot` or a clip of that control), not the same full viewport.
- If the second image still does not show the step, omit the file. The table row stays. The Screenshot cell is `—`. No image heading for that step.
- An omitted earlier image is not, by itself, a failed assertion.
- The required end-state screenshot must show the expected end state. A narrow wording difference on that image does not, by itself, mean the screenshot missed the expected end state. If the image does not show the expected end state, do not publish it as passing evidence. That is a screenshot finding. It does not, by itself, prove that a functional assertion failed. A functional assertion failure does not, by itself, mark the screenshot inadequate. Report the two findings separately in the steps table and in the pull request comments.
- Either finding blocks `e2e:ready`. A required end-state screenshot that misses the expected end state selects `e2e:mismatch`, unless the only issue in the run is the narrow text difference above.
- Do not change the expected result to match a useless screenshot.

`assertion_edits` stays 0. Rewriting the expected sentence so the spec goes green is an assertion edit. Comparing with the word rule above is not. A green run bought by editing the expected sentence is a failed skill run. Revert it and open the mismatch pull request.

Name the file for the screen state (`diary-date-picker.png`), not for the case id. Kebab rules: lowercase, spaces to `-`, drop quotes and trailing periods. One file per distinct screen that shows the step (open modal, open picker, filled chip, new tab, toast). The page contract `## States` block and the overview coverage table cite the same path. A step whose capture repeated an earlier screen has no file. The end-state file is kept only when it shows the expected end state.

Mismatch pull request: one file, the failed step, named for that state, when that image shows the mismatch. Steps that never ran have no file.

Do not commit `test-results/` or the HTML report folder.

In the pull request body, do not use a relative path. The host turns that into a compare URL and the image does not render. Use the head branch. Link text stays `step-01`. `<blob-url>` and `<raw-url>` are the head-branch blob and raw URLs for `png_dir` from the settings file.

## Outcome

One pull request to `main`. Never auto-merge. Read `pr_mode`, `pr_label_ready`, `pr_label_minor_text_diff`, and `pr_label_mismatch` from the settings file. A missing or empty `pr_mode` means `create_pr_for_review`. Do not ask. The other legal value is `ask_before_pr`. Any other value: ask once. A missing or empty label uses its default: `e2e:ready`, `e2e:minor-text-diff`, or `e2e:mismatch`. Create each label you apply if it is missing, then apply exactly one.

Precedence:

1. A functional assertion failure, an unresolved difference, or required screenshot evidence that does not show the expected end state: `pr_label_mismatch`. Draft. If a functional assertion failed, the spec stays red. A screenshot finding does not, by itself, fail the functional assertion. A narrow wording difference is not, by itself, a screenshot miss. If a narrow minor text difference is also present, document it and still use this label.
2. Functional behavior matches, required screenshot evidence meets the acceptance criteria, and the only difference is the narrow text rule: `pr_label_minor_text_diff`. Open for review. Not a draft. Not `e2e:ready`. The exact sentence is not a passed assertion.
3. Functional assertions passed, the expected behavior matches, and required screenshot evidence meets the acceptance criteria: `pr_label_ready`. Open for review. Not a draft. The label does not mean approved or merged.

`create_pr_for_review` creates that pull request for human QA review. It does not stop first for a narrow minor text difference.

`ask_before_pr` stops before creating a pull request when a functional mismatch, an unresolved difference, or a failed final-screenshot gate remains. Stop and ask in chat. A narrow minor text difference does not trigger this stop, so the `e2e:minor-text-diff` pull request is still created. After the user responds, continue from the clarified requirements. If the user changes the expected behavior, later assertions follow that clarification and the pull request quotes the change. If the discrepancy remains, create the pull request only after the user explicitly authorizes it. When the expected behavior has not changed, preserve the failing assertion. If the answer is still unclear, ask once more and do not open a pull request.

If GitHub access is missing, report that the pull request step cannot be completed. Leave the local spec, table, and screenshots. Do not claim a pull request exists.

| Outcome | Label | PR |
|---------|--------|----|
| Functional assertions passed, the expected behavior matches, and required screenshot evidence meets the acceptance criteria. `assertion_edits` is 0 | `pr_label_ready` (default `e2e:ready`) | Open for review. Not a draft |
| Functional behavior matches, required screenshots meet the acceptance criteria, and the only difference is the narrow text rule | `pr_label_minor_text_diff` (default `e2e:minor-text-diff`) | Open for review. Not a draft. Not `e2e:ready` |
| A functional or unresolved mismatch, or required screenshot evidence does not show the expected end state | `pr_label_mismatch` (default `e2e:mismatch`) | Draft. A failed assertion stays red |

Do not apply `pr_label_ready` when `assertion_edits` is anything but 0. Do not apply `pr_label_ready` when the only difference is a minor text difference.

Screenshot links in the body are head-branch blob and raw URLs. A relative path does not open the file. Link text stays `step-01`. A step whose image failed the Screenshot gate has `—` in the Screenshot cell and no image block. Assertion findings and screenshot findings are separate comments. When the only issue is the narrow text rule, the body records the case sentence and the screen sentence and states that the exact sentence was not a passing assertion. The agent does not edit the case. That difference is not an assertion edit. Steps that never ran have no PNG. Do not use `test.fixme`. A red pull-request check is the expected CI result on a mismatch.

Do not edit the nightly workflow.

Title:

- `case_id`: `<case-id> <case title>`
- `case_text`: the trimmed title. Trim surrounding whitespace. Keep the original casing and internal wording. Do not invent an id. The spec `test()` title and filenames use that trimmed string. Do not leave leading or trailing whitespace in those names. The duplicate check starts from that trimmed title. Display text in the case heading preserves the original casing and internal wording.

Base: `main`.

Actual result is the sentence or control that was on screen. When the words match the case exactly, repeat the expected result. When they match only under the narrow text rule, write the on-screen sentence and do not mark that quoted sentence `pass`.

Under the table, one heading and one raw image per step that has a PNG. A step whose Screenshot cell is `—` has no heading. The end-state image is included only when it shows the expected end state.

Omit Attempts and Not verified.

When the only issue is the narrow text rule, add the text difference block. Omit it when every quoted string already matches the screen. The agent does not edit the case. In `case_text` mode, omit the case link. Record the case sentence and the screen sentence. Do not create a case.

## Case heading

- `case_id`: `- Automation case: [<case-id>](<case-url>)`
- `case_text`: `- Case: <display title>`. No URL. Do not invent an id. The heading shows the original casing and internal wording, with surrounding whitespace removed.

The worked example below is `case_id` mode.

On a mismatch, the steps table has rows only through the failed step. Verdict for that row is `mismatch`. Actual result is what the screen showed. The image uses the same blob and raw URLs. The spec stays red. The pull request is a draft.

## Worked example

```markdown
## Case

- Automation case: [<case-id>](<case-url>)

## Steps

| Step | Expected result | Actual result | Screenshot | Verdict |
|------|-----------------|---------------|------------|---------|
| 1. Open the Personal Space page | The Mood Diary component is displayed. | The Mood Diary component is displayed. | [step-01](<blob-url>/mood-diary.png) | pass |
| 2. Click the Awesome mood emoji | The Create Diary Entry modal opens with Awesome preselected. | The Create Diary Entry modal opened with Awesome preselected. | — | pass |
| 3. Click the date picker | The date picker opens. | The date picker opened. | [step-03](<blob-url>/diary-date-picker.png) | pass |
| 4. Select any date in the past and click Next | The date picker closes, and the selected date is applied. | The date picker closed, and the selected date was applied. | — | pass |
| 5. Open the time picker, select a time, and click Next | The time picker closes, and the selected time is applied. | The time picker closed, and 14:30 was applied. | — | pass |
| 6. Select several emotions and click Next | The Reasons tab opens. | The Reasons tab opened. | — | pass |
| 7. Select one option in each category and click Next | The Thoughts tab opens. | The Thoughts tab opened. | — | pass |
| 8. Enter the thoughts text and click Save | The success toast message appears: "Your diary entry has successfully created". The Create Diary Entry modal closes. The newly created diary entry appears in the Mood Diary component preview. A dot representing the new entry appears on the Mood Diary chart. | Functional: the modal closed, the preview showed Awesome, and a chart dot was visible. Quoted toast on screen: Your Diary entry successfully created! | [step-08](<blob-url>/diary-entry-saved.png) | minor-text-diff |

## Screenshots

### 1. Open the Personal Space page

![step 1](<raw-url>/mood-diary.png)

### 3. Click the date picker

![step 3](<raw-url>/diary-date-picker.png)

### 8. Enter the thoughts text and click Save

![step 8](<raw-url>/diary-entry-saved.png)

## Text difference

Step 8 quoted toast. The functional checks passed. The exact sentence did not.

- Case: "Your diary entry has successfully created"
- Screen: Your Diary entry successfully created!

This is not a passed exact-text assertion. The expected sentence was not rewritten. Label: `e2e:minor-text-diff`.
```
