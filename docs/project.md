# Project file

`.e2e-qa-pilot/project.md` records what is specific to your repository: ticket format, branch naming, case tool, and so on. You do not write it yourself. The setup skill fills it in through MCP, and you can edit it later.

## The easy way: let setup write it

**Recommended.** Start here, even for a large project. You can switch to an example later.

1. **Run `init`** in your project root, then restart the editor and open a new chat. See [Install](install.md).

   ```bash
   npx e2e-qa-pilot init
   ```

2. **Ask for setup.** In the new chat, send this. It runs the `setup_project` tool through MCP:

   ```text
   Set up e2e-qa-pilot for this project.
   ```

   Or send `/setup-project`, which runs the same skill.

3. **Answer what is missing.** The assistant first reads your git branches, Playwright config, the names of your MCP servers, and your `gh` login. It asks one batch of questions only for what it could not find, then shows you the finished file and writes it after you agree.
4. **Review and commit** the file before a run that creates a branch.

You can save a question or two by naming your tools in the same message:

```text
Set up e2e-qa-pilot for this project. We use Jira keys like PROJ-123 in branch names, cases are in Xray, and flags are in LaunchDarkly.
```

Almost everything in the file is optional. A project with no ticket tracker, no case tool, and no other repository can leave the file as `init` wrote it. `init` creates the file once and never overwrites it. The assistant reads it on every run, so do not put a token in it.

If `project.md` and [Settings](settings.md) answer the same question, `project.md` wins. [Settings](settings.md) keeps only the keys every project shares.

## For a more complex setup: start from an example

Use an example when your project has several moving parts (a ticket id and a case id in the branch name, a feature-flag tool, a frontend repository), or when you want to see what a finished file looks like before setup writes yours.

1. Open the example closest to your stack and copy it into `.e2e-qa-pilot/project.md`.
2. Change the names: tracker, branch format, MCP server names, environment, repositories. Delete the sections you do not use.
3. Run setup again with `Set up e2e-qa-pilot for this project.` It keeps the sections you filled in, asks only about what is still open, and checks that each MCP server the file names is configured, that `gh` can read each context repository, and that the branch pattern makes a valid git branch name.

| Your stack | Example |
|------------|---------|
| Jira key in the branch, Xray, LaunchDarkly, no Figma | [jira-xray-launchdarkly.md](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/processes/create-e2e/commands/setup-project/examples/jira-xray-launchdarkly.md) |
| Plane number in the branch, Qase, Figma per case, GrowthBook, frontend repository | [plane-qase-growthbook.md](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/processes/create-e2e/commands/setup-project/examples/plane-qase-growthbook.md) |

## Sections

This section and the ones below are reference. You do not need them to get started.

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
