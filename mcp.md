# MCP

MCP is the connection between your project and the assistant you already use. Cursor and Claude Code call the same three tools. You ask in plain words. There is no new screen to learn.

The server is small on purpose: [src/mcp.mjs](src/mcp.mjs), one file, no dependencies. It fetches no case, calls no network, and reads no secret. Each tool returns the command file, the shared rules, and your `.e2e-qa-pilot/settings.md`. The assistant then does the work with the tools you already have: your case tool's MCP server when you passed a case id, Playwright, and GitHub.

These tools return instructions. They do not run the workflow. Tests check that the instruction text contains the rules. They do not prove that an assistant follows them.

## Connect once

In your own project:

```bash
npx e2e-qa-pilot init
```

`init` writes the skills and adds this entry. Other servers in the file are kept.

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

Claude Code, `.mcp.json` in the project root (same shape). To add it by hand instead:

```bash
claude mcp add e2e-qa-pilot -- npx -y e2e-qa-pilot mcp
```

Restart the editor. The server reads `.e2e-qa-pilot/settings.md` from the folder the editor starts it in, which is your project root.

Also connect your own case tool (for example Qase) when you review a case id. e2e-qa-pilot does not replace it, and pasted case text does not need it.

## Ask in plain words

Copy a phrase and change the case id, or paste the case.

| You want | Ask |
|----------|-----|
| Check that a case id can be asserted | Review case `<id>`. Use `.e2e-qa-pilot/settings.md`. |
| Check pasted case text | Paste the full case, including preconditions, steps, and expected results, and ask to review it. |
| Do everything for a case id | Implement case `<id>` with e2e-qa-pilot. |
| Automate a case that has no Figma link | Add the end-to-end test from the steps of case `<id>`, or from the pasted case. |
| Automate a case that has a Figma link | Case `<id>` has a Figma link. Compare the screen to the frame and stop if they differ. |

`review_case` picks the next tool. For a case id, a `figma.com` URL in the description or a custom field and `figma: on` go to `add_from_design`. For pasted text, a `figma.com` URL anywhere in that text and `figma: on` go to `add_from_design`. No Figma URL, or `figma: off`, goes to `add_from_steps`.

The assistant tells you what it is about to change. It updates that same case only after you answer. It does not invent an expected result.

## What stays in the assistant

These are not server work.

- Ask when an expected result is missing, vague, or uses two names for one control.
- Read the screenshot. One PNG must show that step's control. A repeat of an earlier screen does not count. A missing image is not a failed assertion. The last step always keeps a PNG.
- On a Figma `MINOR` or `BLOCKER`, stop and ask if the difference is expected. No pull request until you answer.

## Tools

Every tool takes the same input object. `required` is `[]`. Send exactly one of `case_id` or `case_text`.

- `case_id`: the id of an existing case in the configured case tool. The assistant fetches it. A provider error or a missing case stops the turn.
- `case_text`: the complete pasted case. No case tool is required. The server does not fetch or update a case.

Both fields, or neither field, returns a tool error (`isError: true`). The server does not guess which field a string belongs in. An unknown argument also returns `isError: true`. Callers in this repository send `case_id` alone or no arguments. None send an extra field. A call that sends only `case_id` still works.

### review_case

- Spec: [processes/create-e2e/commands/review-case/SKILL.md](processes/create-e2e/commands/review-case/SKILL.md)
- Result: the case is ready and routed, or one question per hole was asked and that same case was updated when it came from an id
- The assistant still asks, and does not invent an expected result

### add_from_steps

- Spec: [processes/create-e2e/commands/add-from-steps/SKILL.md](processes/create-e2e/commands/add-from-steps/SKILL.md)
- Result: a ready pull request, or a draft pull request whose spec stays red
- The assistant still reads the screen

### add_from_design

- Spec: [processes/create-e2e/commands/add-from-design/SKILL.md](processes/create-e2e/commands/add-from-design/SKILL.md)
- Result: each milestone is `MATCH`, or the assistant stopped for a human answer on a `MINOR` or `BLOCKER` against the Figma frame
- The assistant still reads the screen and asks. No pull request until that answer

## Without MCP

The skills work alone. `.cursor/skills/` and `.claude/skills/` each hold a stub that points at the same files under `.e2e-qa-pilot/processes/create-e2e/commands/`. Delete the MCP entry and the three skills still run. You can also copy those Markdown files by hand.

## Not in this phase

[AutoFix nightly](processes/autofix-nightly/README.md) is a second process. It has no tools here.
