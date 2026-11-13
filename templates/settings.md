# Settings

> The keys every project shares. An empty value is unset: the first run asks once for the ones it needs and writes your answers here. Everything specific to this repository (ticket id, branch and commit format, case tool, Figma, feature flags, other repositories) goes in `.e2e-qa-pilot/project.md`, and a section there wins over the matching key here. Never put a token here.

## Context

`case_tool`, `fetch_case`, and `update_case` are only for a case id. Pasted case text does not use them. Leave them empty if you have no case tool. `figma` is `on` or `off`. `read_figma` is needed only with `figma: on`.

case_tool:
fetch_case:
update_case:
figma:
read_figma:

## Requirements

test_command:
png_dir:

## Goal

`branch_pattern` names the branch. `{title_slug}` is the case title in kebab-case. `{case_id}` is filled in only for a case id. A value without a placeholder is a literal name and puts every case on that one branch. With no value, the branch is `e2e/{title_slug}`, or `e2e/{case_id}-{title_slug}` for a case id. `pr_mode` is `create_pr_for_review` or `ask_before_pr`. A missing `pr_mode` or label uses the value shown here, without a question.

branch_pattern: e2e/{title_slug}
pr_mode: create_pr_for_review
pr_label_ready: e2e:ready
pr_label_minor_text_diff: e2e:minor-text-diff
pr_label_mismatch: e2e:mismatch
