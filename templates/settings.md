# Settings

## Context

## Requirements

## Goal

pr_mode: create_pr_for_review
pr_label_ready: e2e:ready
pr_label_minor_text_diff: e2e:minor-text-diff
pr_label_mismatch: e2e:mismatch

<!--
case_tool, fetch_case, and update_case are only for a case id.
Pasted case text does not use them. Leave them empty if you have no case tool.

pr_mode is create_pr_for_review by default. The other value is ask_before_pr.
A missing pr_mode uses create_pr_for_review. Do not ask.
A missing label uses the default below. Do not ask.

Keys, case tool with Figma on:

case_tool:
fetch_case:
update_case:
figma: on
read_figma:
branch_pattern:
test_command:
png_dir:
pr_mode: create_pr_for_review
pr_label_ready: e2e:ready
pr_label_minor_text_diff: e2e:minor-text-diff
pr_label_mismatch: e2e:mismatch

Keys, case tool with Figma left off:

case_tool:
fetch_case:
update_case:
figma: off
read_figma:
branch_pattern:
test_command:
png_dir:
pr_mode: create_pr_for_review
pr_label_ready: e2e:ready
pr_label_minor_text_diff: e2e:minor-text-diff
pr_label_mismatch: e2e:mismatch
-->
