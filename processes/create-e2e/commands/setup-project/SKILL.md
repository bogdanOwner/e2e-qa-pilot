---
name: setup-project
description: >-
  Fill in .e2e-qa-pilot/project.md for this repository. Inspects the repo and
  the connected tools first, then asks one batch of questions for what it
  cannot detect. Use after init, when a project changes its ticket, branch,
  case tool, Figma, feature flag, or frontend repository setup, or when the
  person asks to set up e2e-qa-pilot.
---

# Set up the project file

Input: none. Output: a filled `.e2e-qa-pilot/project.md` that the person approved, and a short result with what to commit and a first case to try. This skill writes no spec, opens no pull request, and writes nothing outside `.e2e-qa-pilot/`.

How the file is read, section by section: [project-config.md](../shared/project-config.md). Read it first.

## 1. Look before asking

Detect what you can. Do not ask about anything you find.

- The file: read `.e2e-qa-pilot/project.md`. A filled section stays unless the person asks to change it. If the file is missing, the tool result includes the template. Write the file from that template. Without the tool result, copy `templates/project.md` from the e2e-qa-pilot package, or use the `## Heading` lines listed in [Sections](../shared/project-config.md#sections).
- Git: `git remote -v`, `git symbolic-ref refs/remotes/origin/HEAD`, `git branch -r`, and the last 20 branch names from `git for-each-ref --sort=-committerdate --count=20 refs/remotes/origin`. Look for a ticket id in branch names (`DEV_1234_...`, `PROJ-123-...`) and name the shape you see. Read `git log -20 --format=%s` for the commit subject shape.
- Playwright: find the config file and read `testDir`, the folder of existing specs, and whether specs import a fixture or page objects. Read `package.json` scripts for the test command.
- Editor tools: list only the server names in `.cursor/mcp.json` and `.mcp.json`, for example `jq '.mcpServers | keys' .mcp.json`. Do not open or print the whole file, because `env` and `headers` often hold tokens. Match each server name against the tools you know, for example a case tool (Qase, TestRail, Xray, Zephyr), a design tool (Figma), and a feature-flag tool (GrowthBook, LaunchDarkly, Unleash, Statsig). A server that matches none is not guessed: ask what it is for. An MCP server can also come from an editor plugin or from user settings and not appear in either file, for example the Cursor Figma plugin. Count a server you can call in this session as connected, and name it as the session shows it. A tool you find only in code (a helper, an SDK, a URL) and not as a server is *found in code only*. Do not write it in the file. List it in the result instead.
- GitHub: `gh auth status`, then `gh repo view --json nameWithOwner,defaultBranchRef`. If the person named another repository, `gh repo view <owner/repo>` to confirm it can be read.

### Start from an example, for a complex setup

A complex setup has a ticket id and a case id in the branch name, feature flags, or a frontend repository. For one, read the closest file in [examples/](examples/) next to this skill:

- [jira-xray-launchdarkly.md](examples/jira-xray-launchdarkly.md): Jira key in the branch, Xray, LaunchDarkly, no Figma.
- [plane-qase-growthbook.md](examples/plane-qase-growthbook.md): Plane number in the branch, Qase, Figma per case, GrowthBook, frontend repository.

The examples show how each section is written. They are not answers. Keep only what this project uses, with this project's names and values. Do not copy a tool, name, or value from an example.

## 2. Ask once

Send one message with every question that is still open, each with the value you recommend. Skip a section the project does not use. Questions you may need:

- Ticket: tracker (Jira, Linear, Plane, GitHub Issues, or none), required or not, the id format, and whether `{ticket_id}` is the full key or only the number.
- Branch & commit: start branch, pull-request base, the branch pattern (use an optional group for an id that is not always there), the commit subject.
- Case tool: which server, how to fetch a case by id, how to update it, and whether the case id belongs in the branch.
- Design: whether Figma is used, and whether it is for every case or only a case with a Figma link.
- Feature flags: which server, which environment to read, and what to do when a flag is off.
- Context repos: which repositories, and what to read in them.
- Test layout: only if it could not be detected.

Do not ask for a token, a key, or a password. If the person pastes one, do not write it down. Tell them to move it into the editor's MCP configuration.

## 3. Write

Edit `.e2e-qa-pilot/project.md` only, except for `test_command` below. Fill the sections you have answers for, as short `Name: value` lines and plain sentences. The template's block quotes and code blocks are guidance and examples. Write your answers as plain lines under the heading, and delete the quote and example of every section you filled or skipped, so the file holds only answers. Leave the heading of a section the project does not use, with nothing under it. Delete the introduction quote at the top once the file is filled. Do not write a value that was not detected and not answered.

Fill `## Feature flags` only when a flag MCP server is connected. A flag tool found only in code leaves the heading empty, so no flag check runs.

Never write a password, a token, or a key, including a test-user password. Name the env var or the file the tests read it from instead.

Common keys that belong in `settings.md` (`test_command`, `pr_mode`, labels) stay there. If you detected a `test_command` and the settings file has none, offer it and write it only after approval.

Then show the finished file to the person and ask for a yes. Do not commit it.

## 4. Check

Before you finish, confirm each of these and say which you could not check:

- Every MCP server the file names appears in the editor's MCP configuration, or is available in this session from an editor plugin or user settings.
- `gh` can read every context repository.
- The branch pattern gives a name that passes `git check-ref-format --branch` for an example id and title, with and without a case id.
- No section holds a secret.

## 5. Finish

End with a short result, not a report:

- What is set, with ⭐ next to each recommended choice you made.
- Tools found in code only, and what connecting each one as an MCP server would add.
- What to do next, in order:
  1. Review `.e2e-qa-pilot/` and the editor files `init` wrote.
  2. Commit them on their own branch from the start branch, not on a feature branch. A run that creates a branch does not start while they are uncommitted. Do not commit `.cursor/mcp.json` or `.mcp.json` if it holds a credential or is gitignored.
  3. Send the first case below.
- A first case to paste, written from a real page or flow in this project. Use 3 to 4 numbered steps with one action and one `Expected:` result each, and no "or" and no "if". Prefer a flow that needs no new account or special test data. Start it with `Review this case with e2e-qa-pilot and implement it if it is ready:` and a `Title:` line.

## Tool contract

`setup_project`

- Inputs: none, plus `.e2e-qa-pilot/project.md` and `.e2e-qa-pilot/settings.md`
- Result: a filled project file the person approved, or a list of open questions
- The agent asks once, does not guess, and never writes a secret
- The result lists tools found in code only, says what to commit and where, and ends with a first case to paste
