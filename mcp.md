# MCP

MCP is the connection between your project and the assistant you already use. `init` sets it up for Cursor and Claude Code, and both use the same four tools: `review_case`, `add_from_steps`, `add_from_design`, and `setup_project`. You ask in plain words. There is no new screen to learn.

Install steps, settings keys, and the trust statement are in [docs](docs/README.md). This page is the tool contract.

## What the server does and does not do

The server is small on purpose: [src/mcp.mjs](src/mcp.mjs), one file, no dependencies. It returns text. It does not run the workflow, run tests, call a case tool, Figma, or GitHub, or write to your project. It makes no network requests.

Each tool returns:

- the input block: the case id, or the pasted case text, as the client sent it
- your `.e2e-qa-pilot/settings.md`, verbatim, or a notice that it is missing
- your `.e2e-qa-pilot/project.md`, verbatim, or a notice that it is missing. It is optional for a case run
- the command file and the shared rules, from the installed package

Your connected assistant then follows the instructions with whatever tools you have configured: repository access, a test runner, Playwright, your case tool when you passed a case id, Figma for design comparison, a feature-flag tool, the `gh` CLI for a read-only frontend repository, and GitHub for the pull request. Which of these a project uses is written in `project.md`. See [Project file](docs/project.md). Not every assistant or client has all of these. If one is missing, the step that needs it cannot be completed.

Because the settings file and the project file are returned in every result, keep tokens out of both. Keep them in your own MCP configuration.

## Connect once

In your own project:

```bash
npx e2e-qa-pilot init
```

`init` writes the skills, an always-on instruction (a rule file for Cursor, a marked block in `CLAUDE.md` for Claude Code), and adds this entry. Other servers in the file are kept. An entry that is already listed is left as it is, and a file that is not valid JSON is left alone.

Cursor, `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "e2e-qa-pilot": {
      "command": "npx",
      "args": ["-y", "e2e-qa-pilot", "mcp"]
    }
  }
}
```

Claude Code, `.mcp.json` in the project root (same shape). To add it by hand instead, run the command below. It is not exercised by this repository's tests, so check `claude mcp add --help` for the current syntax:

```bash
claude mcp add e2e-qa-pilot -- npx -y e2e-qa-pilot mcp
```

Restart the editor. The server reads `.e2e-qa-pilot/settings.md` from the folder the client starts it in. That is normally your project root, but it depends on the client.

The entry is not pinned to a version, so `npx -y` uses the version npm resolves, or has cached. The command files that `init` copied into your project came from the version that ran `init`. The two can differ, as described in [Without MCP](#without-mcp). When they do, every tool result starts with a line that says to run `npx e2e-qa-pilot upgrade`. Pinning and upgrading are in [Install](docs/install.md#upgrade).

Also connect the MCP servers your project uses: a case tool when you review a case id, a design tool for design comparison, and a feature-flag tool. e2e-qa-pilot does not replace them, and pasted case text needs none. A frontend repository is read with the `gh` CLI after `gh auth login`. Which servers and repositories this project uses is written once in `.e2e-qa-pilot/project.md`.

## Ask in plain words

Copy a phrase and change the case id, or paste the case.

| You want | Ask |
|----------|-----|
| Review a case id | Review case `<id>`. Use `.e2e-qa-pilot/settings.md`. |
| Review pasted case text | Paste the full case, including a `Title:` line, preconditions, steps, and expected results, and ask to review it. |
| Do everything for a case id | Implement case `<id>` with e2e-qa-pilot. |
| Automate a case that has no Figma link | Add the end-to-end test from the steps of case `<id>`, or from the pasted case. |
| Automate a case that has a Figma link | Case `<id>` has a Figma link. Compare the screen to the frame and stop if they differ. |

The assistant tells you what it is about to change. For a case id, it updates that same case only after you answer. It does not invent an expected result.

## Tools

`review_case`, `add_from_steps`, and `add_from_design` take the same input object. `setup_project` takes no input and is described [below](#setup_project). For the three case tools, `required` is `[]`, because the handler enforces the rule below. Send exactly one of `case_id` or `case_text`, as a string with some text in it.

- `case_id`: the id of an existing case in the configured case tool. It needs a connected case tool and the `case_tool`, `fetch_case`, and `update_case` settings. A provider error or a missing case stops the turn. Only an id-based review updates a case.
- `case_text`: the complete pasted case, including a `Title:` line when the title is known. It needs no case tool and none of those three settings. The server does not fetch or update a case.

The server trims both values. A blank value counts as absent, so a blank `case_id` with a real `case_text` is a `case_text` call. These return a tool error (`isError: true`) and no instructions:

- both fields with text, or neither
- a value that is not a string
- arguments that are not an object
- any other key

An unknown tool name returns a JSON-RPC error instead of a tool result.

A call with pasted text:

```json
{
  "name": "review_case",
  "arguments": {
    "case_text": "Title: Open home\nPreconditions: a user is signed in.\n1. Open the home page. Expected: the home page is visible."
  }
}
```

A call that returns a tool error, because it sends both fields:

```json
{
  "name": "review_case",
  "arguments": {
    "case_id": "QA-123",
    "case_text": "Title: Open home"
  }
}
```

### Routing

`review_case` returns the instructions for the assistant to route. The server does not choose the next tool.

- A `figma.com` URL and `figma: on` in the settings go to `add_from_design`. For a case id, the URL is in the description or a custom field. For pasted text, it is anywhere in the text.
- No Figma URL, or `figma: off`, goes to `add_from_steps`.
- `add_from_design` also needs `read_figma` to work, so your assistant must be able to read the Figma frame. `read_figma` is not needed with `figma: off`. It can come from `settings.md` or from `## Design` in `project.md`.

The assistant may run the next command by calling its MCP tool or by reading the installed command file.

### review_case

- Spec: [processes/create-e2e/commands/review-case/SKILL.md](processes/create-e2e/commands/review-case/SKILL.md)
- Result: the case is ready and routed, or one question per hole was asked and, for a case id, that same case was updated
- If the case is ready, the instructions tell the assistant to continue into the routed command in the same turn. That can end in a pull request. See [Known limitations](#known-limitations)
- The assistant still asks, and does not invent an expected result

### add_from_steps

- Spec: [processes/create-e2e/commands/add-from-steps/SKILL.md](processes/create-e2e/commands/add-from-steps/SKILL.md)
- Result: one label, `e2e:ready`, `e2e:minor-text-diff`, or a draft `e2e:mismatch`, unless `ask_before_pr` is still waiting for an answer or for explicit authorization
- The assistant still reads the screen. A narrow minor text difference does not stop the run. `pr_mode` is read from settings by the assistant. The server does not parse it.

### add_from_design

- Spec: [processes/create-e2e/commands/add-from-design/SKILL.md](processes/create-e2e/commands/add-from-design/SKILL.md)
- Needs a Figma URL in the case and `figma: on`
- Result: one label, `e2e:ready`, `e2e:minor-text-diff`, or a draft `e2e:mismatch`, unless `ask_before_pr` is still waiting for an answer or for explicit authorization
- The assistant still reads the screen. A narrow minor text difference does not stop the run. `ask_before_pr` stops for a functional mismatch, an unresolved difference, or a failed final-screenshot gate.

### setup_project

- Spec: [processes/create-e2e/commands/setup-project/SKILL.md](processes/create-e2e/commands/setup-project/SKILL.md)
- Input: none. Any argument returns a tool error
- Result: a filled `.e2e-qa-pilot/project.md` that you approved, or a list of open questions
- The assistant inspects the repository and the connected tools first, asks one batch of questions for what it cannot detect, and never writes a token

## What stays in the assistant

These are not server work, and the server cannot enforce them.

- Ask when an expected result is missing, vague, or uses two names for one control.
- Read the screenshot. One PNG must show that step's control. A repeat of an earlier screen does not count. An omitted earlier image is not, by itself, a failed assertion. The required end-state screenshot must show the expected end state. A screenshot finding does not, by itself, prove that a functional assertion failed.
- Follow `pr_mode`. `create_pr_for_review` is the default and does not auto-merge. `ask_before_pr` stops before a pull request for a functional mismatch, an unresolved difference, or a failed final-screenshot gate, and creates that pull request only after explicit authorization when the discrepancy remains. A narrow minor text difference does not trigger that stop.

The server reads `.e2e-qa-pilot/settings.md` and returns it verbatim. It does not parse `pr_mode`, `pr_label_ready`, `pr_label_minor_text_diff`, or `pr_label_mismatch`, and it does not choose a pull request label. The command files tell the assistant what those keys mean. A missing `pr_mode` means `create_pr_for_review`.

## Without MCP

The skills work alone. `.cursor/skills/` and `.claude/skills/` each hold a stub that points at the files under `.e2e-qa-pilot/processes/create-e2e/commands/`. If you delete the MCP entry, the four skills can still be followed from those files. You can also copy those Markdown files by hand. Nothing here is hidden, so read every line before you give an assistant access to anything.

The MCP tools and the stubs do not always give the same instructions. A tool returns the files bundled with the installed package. A stub points at the copy in your project. They match only when both come from the same package version, and an edit to the project copy does not change what a tool returns.

## What is and is not verified

The tests in `test/cli.test.mjs` start the server over stdio and send JSON-RPC messages, and they run `init` in temporary folders. They check that the instruction text contains the rules. They do not run Cursor or Claude Code, so compatibility with a specific client or version is not verified here, and they do not prove that an assistant follows the instructions. `test/docs.test.mjs` checks these documents against the code. It is a documentation check, not a behavioral or integration test. A longer account of scope and trust is in [scope and trust](docs/scope-and-trust.md).

Before a release, run these eight cases once in Cursor or Claude Code against a disposable Playwright repository. Record what the assistant did. A case that was not run stays unverified. Instruction-contract tests do not change that.

1. No `project.md` branch lines. Unverified. Expect the mode default branch, a `fix:` subject, screenshots in `png_dir`, and a pull request against `main` created from `origin/main`. Another screenshot directory is used only when `## Test layout` names it.
2. A `project.md` branch line conflicts with `branch_pattern`. Unverified. Expect the assistant to cite the section line and use that workflow, without combining the two branch patterns.
3. An existing branch that is not this task. Unverified. Expect one question, and no checkout or overwrite.
4. A dirty tree, including untracked init files. Unverified. Expect review to finish, and the branch step to stop without a stash or a switch.
5. A section line that skips the screenshot gate or assigns the ready label anyway. Unverified. Expect the gate and the label order to stay.
6. A `project.md` branch pattern with an optional case id, run once with a case id and once with pasted text. Unverified. Expect `<ticket>_<case>_<slug>` and `<ticket>_<slug>`, one question at most (the ticket id), and no brackets in the name.
7. A `project.md` feature-flag section and a flag that is off. Unverified. Expect a report and a stop, no spec, and no flag change.
8. A `project.md` context repository. Unverified. Expect reads through `gh` only, and a pull request only in this repository.

## Known limitations

- **Review can continue into implementation.** The `review-case` command says it does not write a spec, yet its silent-pass step says to continue into `add-from-steps` or `add-from-design` in the same turn. A ready case can therefore end in a pull request. This wording has not been changed in the documentation update, and needs a separate decision.
- **Cursor and Claude Code behavior is not verified.** The instructions are Markdown. This repository's tests check that the files and the server are consistent. They do not run an editor and do not prove that an assistant follows the instructions.

## Not implemented

[AutoFix nightly](processes/autofix-nightly/README.md) is not implemented. It has no tools here.
