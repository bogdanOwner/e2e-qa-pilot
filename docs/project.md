# Project file

`.e2e-qa-pilot/project.md` holds what is specific to your repository: how tickets, branches, and commits look, which case tool and design tool you use, which feature-flag tool to check, which other repositories to read, and where tests live. [Settings](settings.md) keeps only the keys every project shares.

`init` creates the file once and never overwrites it. The assistant reads it on every run, so the file is sent to the model each time. Do not put a token in it.

## Fill it in

Ask your assistant in a new chat:

```text
Set up e2e-qa-pilot for this project.
```

That runs `setup_project`. The assistant reads your git branches, Playwright config, MCP server names, and `gh` login, then asks one batch of questions for what it could not detect, shows you the finished file, and writes it after you agree. You can also edit the file by hand. Commit it before a run that creates a branch.

Or copy the closest example and change the names. A project with no tracker, no case tool, and no other repository needs nothing here: leave the file as `init` wrote it.

| Your stack | Example |
|------------|---------|
| Jira key in the branch, Xray, LaunchDarkly, no Figma | [jira-xray-launchdarkly.md](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/examples/project-files/jira-xray-launchdarkly.md) |
| Plane number in the branch, Qase, Figma per case, GrowthBook, frontend repository | [plane-qase-growthbook.md](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/examples/project-files/plane-qase-growthbook.md) |

## Sections

Every section is optional. A heading with nothing under it is unset. A block quote, a code block, and an HTML comment are explanation and examples, not answers. The rules the assistant follows for each section are in [project-config.md](../processes/create-e2e/commands/shared/project-config.md).

| Section | Write | For example |
|---------|-------|-------------|
| `## Ticket` | Tracker, whether an id is required, and whether `{ticket_id}` is the full key or only the number | Jira, Linear, Plane, GitHub Issues, none |
| `## Branch & commit` | Start branch, pull-request base, branch pattern, commit subject | `{ticket_id}[_{case_id}]_{title_slug}` |
| `## Case tool` | The MCP server, how to fetch a case by id, how to update it | Qase, TestRail, Xray, Zephyr |
| `## Design` | `Figma: on` or `Figma: off`, and how to read a frame | Figma, or off |
| `## Feature flags` | The MCP server and the environment to check. Read only | GrowthBook, LaunchDarkly, Unleash, Statsig |
| `## Context repos` | Other repositories to read through `gh`. Read only | your frontend |
| `## Test layout` | Spec directory, page objects, fixture, screenshot directory | `tests/e2e` |
| `## Rules` | Extra rules in plain sentences | |

A `project.md` value answers the matching settings key, so the assistant does not ask for it: `## Case tool` answers `case_tool`, `fetch_case`, `update_case`. `## Design` answers `figma` and `read_figma`. `## Test layout` answers `png_dir`. `## Branch & commit` answers `branch_pattern`. No line in this file can weaken the ready checks, the word rule, the screenshot gate, the labels, or `pr_mode`.

The tool names in the table are examples. The file names the MCP server your editor already has. This package does not talk to any of them. It tells the assistant which one to use and when.

## Branch and commit placeholders

| Placeholder | Meaning |
|-------------|---------|
| `{ticket_id}` | The ticket id for this run, for any tracker. The assistant asks once when `## Ticket` says an id is required and none was given. It never invents one and never creates a ticket |
| `{case_id}` | The case id, and only when the case came from an id |
| `{title_slug}` | The case title in kebab-case, at most 50 characters |
| `{explanation}` | The short explanation the assistant writes for the commit subject |
| `[ ... ]` | An optional group. Text in square brackets that holds a placeholder is dropped, with its separator, when that placeholder has no value, and the assistant does not ask. The brackets are never part of the name |

With `Branch: {ticket_id}[_{case_id}]_{title_slug}`, ticket `PROJ-123`, case id `qase-7`, and title "Login error", the branch is `PROJ-123_qase-7_login-error`. A pasted case has no id, so it gets `PROJ-123_login-error`.

## Feature flags

The assistant checks, and never changes. When it reviews a case, it finds the flags the feature depends on (from the case text, the context repository, and the linked frontend pull request), reads each one in the environment you named, and adds a line to the case preconditions:

```text
Feature flag: new-checkout = on (staging)
```

If a needed flag is off, or cannot be read, the assistant says so and stops. No spec is written. The decision is yours.

## Context repos

Other repositories, such as your frontend, are read with the `gh` CLI. The assistant uses them to find routes, test ids, labels, and flag keys, and to read a frontend pull request you link. It never clones, pushes to, comments on, or opens a pull request in one. Every pull request goes to the repository where `init` ran. If `gh` is not signed in, the assistant says so, continues with what the screen shows, and marks the unread facts as unverified. Run `gh auth login` once.

## Claude Code and Cursor

The file is the same in both editors. Only the place where you configure MCP servers differs. See [Install](install.md#set-up-for-your-editor).
