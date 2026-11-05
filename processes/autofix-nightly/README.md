# AutoFix nightly

**Status: not implemented.**

This directory records an intended future process: explaining a red nightly run and proposing one fix for a human to review. There are no commands, tools, or install step for it. No delivery date is committed, and nothing here is a roadmap commitment.

Create e2e does not call it.

## Planned flow

When this process exists, a nightly run would:

1. Read the real frontend changes since the last run.
2. Rerun the failed tests on Claude to check whether the failure is flaky.
3. Report the reason for the failure.
4. Open a pull request with one proposed fix for a person to review.

None of these steps run today. There is still no command, tool, or install step, and no delivery date.
