# e2e-qa-pilot

An MCP server and set of Markdown commands that guide your AI assistant from a manual test case to a reviewed Playwright spec and a pull request, with a human deciding when the case or the screen is unclear.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Playwright](https://img.shields.io/badge/tests-Playwright-45ba4b.svg)
![init targets](https://img.shields.io/badge/init%20targets-Cursor%20%7C%20Claude%20Code-black.svg)

You have a manual test case: an id in the case tool you configure, such as Qase, or the full case text pasted into chat. You already use Cursor or Claude Code. e2e-qa-pilot gives your assistant the instructions to turn that case into a Playwright spec and a pull request, and to stop and ask you when the case is vague.

## What is implemented today

- **Create e2e (implemented).** Three tools, `review_case`, `add_from_steps`, and `add_from_design`, hand your assistant instructions for turning one case into a Playwright spec and a pull request. While writing the spec, the assistant may adjust locators or waits in that spec. A failed expected result is reported as a mismatch: a draft pull request, with the spec left red. It is not classified as a product regression.
- **AutoFix nightly (not implemented).** There are no commands, tools, or install step for it. This project does not detect failures in an existing suite, diagnose their cause, or propose fixes. Generating a test, detecting a failure, diagnosing its cause, and proposing a fix are separate steps, and only the first is covered today. See [AutoFix nightly](processes/autofix-nightly/README.md).

## Prerequisites

- Node 22 or later.
- A project where Playwright is already set up. The commands never install browsers.
- Git with `main` as the base branch. The commands branch from `main` and target it.
- An assistant that can read and edit your repository, run your test command, and open pull requests.
- A case tool connected to your assistant, only when you pass a case id. Qase is the worked example.
- Access to Figma from your assistant, only for design comparison.

These are capabilities of your assistant and its own MCP servers, not of this package. `init` does not configure them, and not every assistant or client has all of them. If one is missing, the step that needs it cannot be completed.

## Quick start

In your own project:

```bash
npm install -g e2e-qa-pilot     # or skip this and use npx
cd my-project
e2e-qa-pilot init
```

With `npx` and no install: `npx e2e-qa-pilot init`.

Restart Cursor or Claude Code, then ask in the chat.

**A case id.** Connect your case tool first (for example Qase).

```text
Review case QA-123, then implement it with e2e-qa-pilot.
```

**A pasted case.** No case tool and no case id are needed. Include a `Title:` line, or the assistant will ask for one.

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Create a mood diary entry
Preconditions: the user is signed in and on the Personal Space page.
1. Click the Awesome mood emoji.
   Expected: the Create Diary Entry modal opens with Awesome preselected.
2. Enter the thoughts text and click Save.
   Expected: a success toast appears, the modal closes, and the new entry shows in the Mood Diary preview.
```

Pasted text needs no case tool, but the first run still asks once for the settings that generating a spec needs, such as `test_command` and `png_dir` (see [Settings](#settings)). If the case is ready, `review_case` carries on into the matching command in the same turn, and that can end in a pull request. The instructions do not define a review-only mode. Details are in [mcp.md](mcp.md#review_case).

`init` works on the folder you are in, or on a path you pass: `e2e-qa-pilot init [path]`. It looks for `.cursor/` and `.claude/`, sets up the one it finds, and sets up both when both folders are present or when neither is. To choose, pass `--integration cursor`, `--integration claude`, or `--integration all`. Cursor and Claude Code are the two editors `init` knows how to set up. See [mcp.md](mcp.md#what-is-and-is-not-verified) for what has been verified.

### What `init` writes

| File | Purpose |
|------|---------|
| `.e2e-qa-pilot/settings.md` | Your case tool, test command, PNG folder, and PR labels. Created once, never overwritten |
| `.e2e-qa-pilot/processes/create-e2e/` | A copy of the Create e2e folder: the three commands, the shared rules, and a short README, as plain Markdown |
| `.cursor/skills/<name>/SKILL.md` | Cursor skills (`review-case`, `add-from-steps`, `add-from-design`). Each is a short stub that points at the commands above |
| `.claude/skills/<name>/SKILL.md` | The same skills for Claude Code |
| `.cursor/mcp.json` and `.mcp.json` | One `e2e-qa-pilot` entry. Other servers in the file are kept. An entry that is already listed stays as it is |

Run `init` again at any time. It leaves existing files alone.

- `--force` refreshes a file only when that file still has the exact `<!-- e2e-qa-pilot:managed -->` line. **That replaces any edits you made to such a file.** Remove the line from a file to keep it as yours.
- `.e2e-qa-pilot/settings.md` and an MCP entry that is already listed are never changed, even with `--force`.
- An MCP file that is not valid JSON, or does not have the expected shape, is left alone, and `init` prints the entry to add by hand.

## How it works

The MCP server returns instructions as text. It does not run the workflow, run tests, call a case tool, Figma, or GitHub, or write to your project. Your assistant follows the instructions with the tools you have connected. Tool contracts, example prompts, and routing are in [mcp.md](mcp.md). The process diagram is in [Create e2e](processes/create-e2e/README.md).

The output of a run is a Playwright spec that asserts every expected result, one PNG per proved step, and a pull request. If an expected result is missing or vague, the assistant asks you first. It is told never to invent one.

## Settings

The first `review-case` run reads `.e2e-qa-pilot/settings.md`. If a key it needs is empty, the assistant asks once in chat and writes your answers into that file. A case id needs `case_tool`, `fetch_case`, and `update_case`. Pasted case text does not. Both inputs need the generation keys below.

The settings file is included in every tool result, so do not store tokens in it. Put how to fetch and update a case in the file, and keep tokens in your own MCP configuration. Do not paste a secret into the chat.

| Key | Meaning |
|-----|---------|
| `case_tool`, `fetch_case`, `update_case` | Where cases live and how to read and update one. Used only for a case id |
| `figma`, `read_figma` | `on` or `off`, and how to read a frame |
| `branch_pattern`, `test_command`, `png_dir` | How to name the branch, run the spec, and where PNGs go |
| `pr_label_ready`, `pr_label_mismatch` | Labels for a ready and a draft-mismatch pull request |

The command files currently list `read_figma` among the required keys even when `figma: off`, while the settings template leaves it blank in that case. Until that is settled, expect to be asked for it once. See [Known limitations](mcp.md#known-limitations).

## Scope

- Playwright only. The commands describe Playwright specs, runs, and screenshots. Selenium is not supported.
- Case tools: Qase is the worked example, and the `review-case` command describes how it updates a Qase case. Other tools may work if your assistant can read and update them through its own MCP server, but none are tested or officially supported here. This package does not implement a case-tool client. Pasted case text needs none.
- A person decides. The assistant is told to ask when a step is vague and to read every screenshot. On a Figma comparison, it stops on a `MINOR` or `BLOCKER` difference before it opens a pull request. Without Figma, a mismatch becomes a draft pull request with a red spec.

## Trust

This tool is MIT licensed and small on purpose. The MCP server is [src/mcp.mjs](src/mcp.mjs) with shared constants in [src/kit.mjs](src/kit.mjs). It has no dependencies, makes no network requests, and only reads the packaged command files and your `.e2e-qa-pilot/settings.md`. It writes only JSON-RPC to stdout. Case text in a tool call is the text the client sent. `init` is [src/init.mjs](src/init.mjs) and uses the same constants.

This project does not store credentials. What your assistant commits, reports, or posts to a pull request is outside this project's control, so review the diff and the pull request yourself. The `npx` entry that `init` writes downloads the package from npm when it starts, which is separate from the server's own behavior.

## Contributing

```bash
npm test
```

`npm test` runs behavioral tests of `init` and the MCP server, and documentation consistency checks in `test/docs.test.mjs`. They check instruction text and documentation against the code. They do not prove that an assistant follows the instructions, and they do not run Cursor or Claude Code.

Open an issue before a large change. The commands in [processes/create-e2e/commands/](processes/create-e2e/commands/) are the spec, so a behavior change starts there.

## License

[MIT](LICENSE)
