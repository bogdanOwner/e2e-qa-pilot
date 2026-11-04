# Settings

```text
# create_pr_for_review always opens the pull request, including a draft for a mismatch.
# The other value is ask_before_pr, which stops before a pull request when a functional
# mismatch, an unresolved difference, or a failed final screenshot remains.
pr_mode: create_pr_for_review

# Branch name for git checkout -b. {title_slug} is the case title in kebab-case,
# for example e2e/book-chalet-4-at-cabana. {case_id} is filled in only for a case id.
# A name without a placeholder is used as it is and puts every case on one branch.
branch_pattern: e2e/{title_slug}

# Folder for the screenshot PNGs linked from the pull request.
png_dir: screenshots/png

# Label when behavior matches and the required screenshots are adequate.
pr_label_ready: e2e:ready

# Label when behavior matches and the only issue is a narrow wording difference.
pr_label_minor_text_diff: e2e:minor-text-diff

# Label for a functional or unresolved mismatch, or inadequate screenshots. The pull request is a draft.
pr_label_mismatch: e2e:mismatch

# Command that runs the spec against the live page. Do not install a browser here.
test_command: npm run test:live

# on or off. off ignores a Figma URL and uses the case steps as the oracle.
figma: off

# How to read a Figma frame. Still required when figma is off. This example does not read a frame.
read_figma: not used while figma is off

# Only for a case id. This example pastes the case or points at a file, so these stay empty.
# Do not put tokens here.
case_tool:
fetch_case:
update_case:
```
