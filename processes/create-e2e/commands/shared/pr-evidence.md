# Pull request evidence

PR template and evidence names for [add-from-steps](../add-from-steps/SKILL.md).

This command checks the expected-result text. It does not use the Figma visual review.

## Word rule

Assert every expected-result sentence, including a multi-bullet result (toast text, modal closed, preview entry, chart dot). Copy the case wording into the assertion message, including awkward grammar.

Quoted copy is the same message when, after lowercasing and stripping punctuation, the words match once filler words `a`, `the`, `has`, and `been` are ignored. Record the on-screen sentence. Do not change the case. Do not add the mismatch label for that difference. Use `sameVisibleMessage`. Example: case **"Your diary entry has successfully created"** and screen **Your Diary entry successfully created!** are the same message.

A different message (another verb, a missing screen, a missing control) is a mismatch. Leave the assertion. The spec stays red.

## Screenshot gate

Look at the PNG before it is copied into `png_dir` from the settings file or linked in the pull request.

- Keep it when the image shows the control or change named in that row (open modal, open picker, filled chip, new tab, toast).
- A picture that matches an earlier step does not prove this step.
- One retry only: capture the proving control (`locator.screenshot` or a clip of that control), not the same full viewport.
- If the second image still does not show the step, omit the file. The table row stays. The Screenshot cell is `—`. No image heading for that step.
- The last step always keeps its PNG. That shot is the end state.
- A missing image is not a failed assertion. Do not change the expected result to match a useless screenshot.

`assertion_edits` stays 0. Rewriting the expected sentence so the spec goes green is an assertion edit. Comparing with the word rule above is not. A green run bought by editing the expected sentence is a failed skill run. Revert it and open the mismatch pull request.

Name the file for the screen state (`diary-date-picker.png`), not for the case id. Kebab rules: lowercase, spaces to `-`, drop quotes and trailing periods. One file per distinct screen that shows the step (open modal, open picker, filled chip, new tab, toast). The page contract `## States` block and the overview coverage table cite the same path. A step whose capture repeated an earlier screen has no file. The last step always has a file.

Mismatch pull request: one file, the failed step, named for that state, when that image shows the mismatch. Steps that never ran have no file.

Do not commit `test-results/` or the HTML report folder.

In the pull request body, do not use a relative path. The host turns that into a compare URL and the image does not render. Use the head branch. Link text stays `step-01`. `<blob-url>` and `<raw-url>` are the head-branch blob and raw URLs for `png_dir` from the settings file.

## Outcome

One pull request to `main`. Read `pr_label_ready` and `pr_label_mismatch` from the settings file. Create each label if it is missing, then apply one of them.

| Outcome | Label | PR |
|---------|--------|----|
| Every expected result is functionally visible, including a same-message wording difference. Each published PNG passes the Screenshot gate, and the last step has a PNG. `assertion_edits` is 0 | `pr_label_ready` | Ready |
| The screen shows a different result | `pr_label_mismatch` | Draft. The spec stays red |

Do not apply `pr_label_ready` when `assertion_edits` is anything but 0.

Screenshot links in the body are head-branch blob and raw URLs. A relative path does not open the file. Link text stays `step-01`. A step whose image failed the Screenshot gate has `—` in the Screenshot cell and no image block. When a step passes only because of a small wording difference, the body includes the QA action block and `## Visible copy` records the on-screen sentence. The agent does not edit the case. That difference is not an assertion edit. Steps that never ran have no PNG. Do not use `test.fixme`. A red pull-request check is the expected CI result on a mismatch.

Do not edit the nightly workflow.

Title: `<case-id> <case title>`

Base: `main`.

Actual result is the sentence or control that was on screen. When the words match the case exactly, repeat the expected result. When they match only under the word rule, write the on-screen sentence.

Under the table, one heading and one raw image per step that has a PNG. A step whose Screenshot cell is `—` has no heading. The last step always has a heading and an image.

Omit Attempts and Not verified.

When a step passes only because of a small wording difference, add the QA action block. Omit it when every quoted string already matches the screen. The agent does not edit the case.

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
| 8. Enter the thoughts text and click Save | The success toast message appears: "Your diary entry has successfully created". The Create Diary Entry modal closes. The newly created diary entry appears in the Mood Diary component preview. A dot representing the new entry appears on the Mood Diary chart. | Your Diary entry successfully created! The modal closed. The preview showed Awesome. A chart dot was visible. | [step-08](<blob-url>/diary-entry-saved.png) | pass |

## Screenshots

### 1. Open the Personal Space page

![step 1](<raw-url>/mood-diary.png)

### 3. Click the date picker

![step 3](<raw-url>/diary-date-picker.png)

### 8. Enter the thoughts text and click Save

![step 8](<raw-url>/diary-entry-saved.png)

## QA action

Update [<case-id>](<case-url>) step 8 expected result.

- Case now: "Your diary entry has successfully created"
- Screen: Your Diary entry successfully created!

Replace the quoted toast with the screen sentence so the next run does not record this difference.
```
