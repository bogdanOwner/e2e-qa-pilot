# Scope and trust

## Scope

- Playwright only. The commands describe Playwright specs, runs, and screenshots. Selenium is not supported.
- Case tools: Qase is the worked example, and the `review_case` command describes how it updates a Qase case. Other tools may work if your assistant can read and update them through its own MCP server, but none are tested or officially supported here. This package does not implement a case-tool client. Pasted case text needs none.
- A person decides when a requirement is ambiguous. The assistant is told to ask and not to invent an expected result. `ask_before_pr` also stops for a functional mismatch, an unresolved difference, or a failed final-screenshot gate. A narrow minor text difference does not trigger that stop.

**Create e2e is implemented.** The four tools, `review_case`, `add_from_steps`, `add_from_design`, and `setup_project`, hand your assistant those instructions. Only `setup_project` writes `.e2e-qa-pilot/project.md`, and only after you approve the finished file. The server itself writes nothing. While writing the spec, the assistant may adjust locators or waits in that spec. **AutoFix nightly is not implemented.** There are no commands, tools, or install step for it. See [AutoFix nightly](../processes/autofix-nightly/README.md).

## Trust

This tool is MIT licensed and small on purpose. The MCP server is [src/mcp.mjs](../src/mcp.mjs) with shared constants in [src/kit.mjs](../src/kit.mjs). It has no dependencies, makes no network requests, and only reads the packaged command files and your `.e2e-qa-pilot/settings.md`. It writes only JSON-RPC to stdout. Case text in a tool call is the text the client sent. `init` is [src/init.mjs](../src/init.mjs) and uses the same constants.

This project does not store credentials. What your assistant commits, reports, or posts to a pull request is outside this project's control, so review the diff and the pull request yourself. The `npx` entry that `init` writes downloads the package from npm when it starts, which is separate from the server's own behavior.

## What the tests check

`npm test` runs behavioral tests of `init` and the MCP server, and documentation consistency checks in `test/docs.test.mjs`. They check that instruction text and documentation match the code. They do not prove that an assistant follows the instructions, they do not validate the assistant workflow end to end, and they do not run Cursor or Claude Code. What is and is not verified is also summarized in [mcp.md](../mcp.md#what-is-and-is-not-verified).
