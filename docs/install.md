# Install

Add e2e-qa-pilot to **your own Playwright project**.

> ℹ️ **Note:** Just want to see it work first? The [Cabana example](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/examples/boutique-cabin/README.md#quick-start) runs on a demo site in this repository, with no project of your own. This page is for your project.

## Before you start

- **A GitHub account, signed in through the [`gh` CLI](https://cli.github.com/)** (`gh auth login`). Each run ends in a pull request, and the assistant uses `gh` to open it and add the label. Without it, you still get the spec and screenshots locally, but no pull request.
- Node.js 22 or later
- A git repository with Playwright already set up. Install Playwright's browsers yourself: e2e-qa-pilot never installs them.
- Cursor or Claude Code

**Optional**, only if you use them. See [Optional integrations](#optional-integrations).

- **Ticket in the branch name** (Jira, Plane, Linear): when every change needs a ticket. You create the ticket, and the assistant asks for its id and puts it in the branch and commit. No MCP needed
- **Case-tool MCP** (Qase, TestRail, Xray): to send a case id
- **Figma access**: to compare with designs
- **Feature-flag MCP** (GrowthBook, LaunchDarkly): to check flags in the environment you name, for example `staging`
- **Frontend repository** (read only, through `gh`): to find routes, test ids, labels, and flag keys, and to read the frontend pull request linked to a case
- **Several environments** (dev, stg): the run tests the environment your `test_command` and Playwright config point at. Set it there

## Quick start

Two ways, same result:

- **Option 1: Let your agent set it up.** One prompt, one chat. The easiest way.
- **Option 2: Set it up step by step.** You run each step yourself and see what happens at every step.

### Option 1: Let your agent set it up

Open your project in Cursor or Claude Code and paste this prompt:

```text
Set up e2e-qa-pilot in this project:
1. Run npx e2e-qa-pilot@latest init and show me its check.
   If a requirement is missing, stop and tell me why and how to fix it.
2. Then follow the setup-project skill that init installed.
```

The agent runs both steps in the same chat, so you do not restart the editor in between. Here is everything it runs. All of it is plain code and Markdown you can read before you paste the prompt.

| Step | What runs | What it does | Read it |
|------|-----------|--------------|---------|
| 1 | `npx e2e-qa-pilot@latest init` | Checks Node, git, Playwright, and `gh`. Writes only the files in [What `init` writes](#what-init-writes). Never overwrites a file you have and makes no network call. In your MCP config it adds one `e2e-qa-pilot` entry and keeps every other entry as it is | [src/init.mjs](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/src/init.mjs) |
| 2 | The **setup-project** skill, which `init` copies into your project | Reads your repository and the names of your MCP servers, asks only what it cannot find, and shows you `project.md` before it writes it. Never writes a secret and never commits | [setup-project/SKILL.md](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/processes/create-e2e/commands/setup-project/SKILL.md) |

The skill ends with a short result: what is set up, what to commit and where, and a first case to try. It works the same in Cursor and Claude Code, and `npx e2e-qa-pilot upgrade` keeps it current. See [Scope and trust](scope-and-trust.md) for what the package does and does not do.

### Option 2: Set it up step by step

1. **Install.** In your project root, run:

   ```bash
   npx e2e-qa-pilot@latest init
   ```

   It checks Node, git, Playwright, and `gh`, then sets up Cursor, Claude Code, or both. It writes only the files in [What `init` writes](#what-init-writes), never overwrites a file you have, and makes no network call. See [`init` options](#init-options).

2. **Restart the editor and open a new chat.** A chat that was already open does not have the e2e-qa-pilot tools.

3. **Fill in the project file.** In the new chat, send:

   ```text
   /setup-project
   ```

   This runs the [setup-project skill](https://github.com/bogdanOwner/e2e-qa-pilot/blob/main/processes/create-e2e/commands/setup-project/SKILL.md), which `init` copied into your project. It works the same in Cursor and Claude Code:

   1. **Looks.** It reads your git remotes and branch names, your Playwright config, your `package.json` scripts, and only the *names* of your MCP servers, never their tokens.
   2. **Asks.** It asks at most 3 questions about what it could not find, each with a recommended answer.
   3. **Writes.** It shows you `.e2e-qa-pilot/project.md` and waits for your yes. It writes nothing outside `.e2e-qa-pilot/`, never writes a secret, and never commits.
   4. **Checks.** It confirms that each MCP server it names is configured, that `gh` can read each context repository, and that the branch pattern gives a valid branch name.
   5. **Ends.** It tells you what to commit and gives you a first case to paste.

   See [Project file](project.md) for what each section means.

4. **Commit the setup files.** Each run creates a branch for its test and does not start while the setup files are uncommitted. Commit them on their own branch, not on a feature branch. Do not commit `.cursor/mcp.json` or `.mcp.json` if they hold a credential or are gitignored. See [What `init` writes](#what-init-writes).

5. **Run your first test case.** Paste the case from step 3, or your own, as in [Send a case](#send-a-case). A pasted case needs no case tool.

## Send a case

**A pasted case** needs no case tool. Include a `Title:` line and an expected result for each step:

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Book Chalet 4 at Cabana
Preconditions: the guest is on the Cabana page.
1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.
   Expected: Chalet 4 is listed at 497 EUR.
2. Press Increase quantity on the 497 EUR rate, then click Reserve Now.
   Expected: the guest form opens on the confirm page.
3. Enter First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accept the terms, and click Confirm Booking.
   Expected: the confirmation says "Your request was successfully sent." and a booking reference is shown.
```

**A case id** needs a connected case tool (for example Qase) and a `## Case tool` section in `project.md`. The setup step can fill that section in:

```text
Review case QA-123, then implement it with e2e-qa-pilot.
```

The first run asks once for any setting it still needs, such as `test_command` and `png_dir`. See [Settings](settings.md). If the case is ready, the assistant implements it in the same turn and opens a pull request. Details are in [mcp.md](../mcp.md#review_case).

## Reference

You do not need this to get started.

### What `init` writes

`init` adds these files to your repository. You review and commit them in step 4. `settings.md` and `project.md` are plain Markdown, and the assistant reads them on every run.

| File | Purpose |
|------|---------|
| `.e2e-qa-pilot/settings.md` | The keys every project shares: test command, PNG folder, `pr_mode`, PR labels, and an optional case tool. Created once, never overwritten |
| `.e2e-qa-pilot/project.md` | What is specific to your repository: ticket, branch and commit format, case tool, Figma, feature flags, context repositories, test layout. Created once, never overwritten. See [Project file](project.md) |
| `.e2e-qa-pilot/processes/create-e2e/` | The four commands, the shared rules, and a short README, as plain Markdown |
| `.cursor/skills/<name>/SKILL.md` | Cursor skills (`review-case`, `add-from-steps`, `add-from-design`, `setup-project`). Each is a short stub that points at the commands above |
| `.claude/skills/<name>/SKILL.md` | The same skills for Claude Code |
| `.cursor/rules/e2e-qa-pilot.mdc` | Cursor only. An always-applied rule that tells the assistant to read both project files first |
| `CLAUDE.md` | Claude Code only. A block between `<!-- e2e-qa-pilot:begin -->` and `<!-- e2e-qa-pilot:end -->` with the same instruction. The rest of the file is never touched |
| `.e2e-qa-pilot/manifest.json` | The package version, the editors set up, and a hash of each file the package wrote. `upgrade` reads it. It holds no secret |
| `.cursor/mcp.json` and `.mcp.json` | One `e2e-qa-pilot` entry. Other servers in the file are kept. Do not commit the file if it holds a credential or is gitignored |

Review the diff and commit it before a workflow that creates or switches a branch. While these files are untracked, the branch step stops and names them. It never stashes, resets, or deletes them. Reviewing a case does not need a clean tree.

Branch names come from the case title: `e2e/{title_slug}`, or `e2e/{case_id}-{title_slug}` for a case id. `{title_slug}` is the title in kebab-case. The pull-request base falls back to `main`. `## Branch & commit` in [`project.md`](project.md) can change all of these. Git access to `origin` is needed for a run that creates a branch.

### `init` options

- `npx e2e-qa-pilot init [path]` sets up the folder you are in, or the path you pass. You can also run `npm install -g e2e-qa-pilot` and then `e2e-qa-pilot init`.
- It looks for `.cursor/` and `.claude/`, sets up the one it finds, and sets up both when both are present or when neither is. To choose, pass `--integration cursor`, `--integration claude`, or `--integration all`.
- It is safe to run again. It adds what is missing and leaves existing files alone.

### Set up for your editor

The project files are shared. The editors differ only in where you add the MCP servers your project uses (a case tool, Figma, a flag tool). Credentials stay there, never in `settings.md` or `project.md`.

- **Cursor:** `.cursor/mcp.json`, or Cursor Settings, MCP. Reload the window and open a new chat.
- **Claude Code:** `.mcp.json` in the project root, or `claude mcp add`. Quit, start Claude Code again in this folder, and open a new chat. `/mcp` lists the connected servers.

### Optional integrations

`init` does not configure these. Add only what you use. [Project file](project.md) says where each one is named.

- **Ticket tracker** (Jira, Plane, Linear), only if your branch or commit names a ticket. Set it in `## Ticket` and `## Branch & commit`, for example `Branch: {ticket_id}[_{case_id}]_{title_slug}`. The assistant asks once for the id when it is required. It never invents one and never creates a ticket.
- **Case-tool MCP** (Qase, TestRail, Xray), only to send a case id. The update checklist was written against Qase and has not been verified against other case tools.
- **Figma access**, only for design comparison. That path can depend on a milestone screenshot helper in your project. This package does not provide one.
- **Feature-flag MCP** (GrowthBook, LaunchDarkly), only if the project checks flags while it reviews a case. It is read only. Without a flag MCP, leave `## Feature flags` empty. Flags are then not checked, so a case that fails because a flag is off still ends as `e2e:mismatch`.
- **Frontend repository**, read through `gh` and named in `## Context repos`. The assistant reads routes, test ids, labels, and flag keys there, and the frontend pull request linked to a case. It never writes to it. It finds flag keys there, but reading a flag's state still needs a flag MCP.

### Upgrade

```bash
npx e2e-qa-pilot@latest upgrade
```

`upgrade` brings the skills in your project to the version you run. A file you edited is kept, and the new version is written next to it as `<file>.new`. `settings.md`, `project.md`, and your MCP entries are never changed. Commit the result.

<details>
<summary><strong>Upgrade details: what changes, pinning, and repair</strong></summary>

The skills in your project are copies. `upgrade` uses `.e2e-qa-pilot/manifest.json` to compare them:

- A file you did not edit is replaced.
- A file you edited is kept. The new version is written next to it as `<file>.new`, so you can compare. `upgrade --force` replaces it.
- A file the package no longer ships is removed, unless you edited it. A new file is added.
- `settings.md`, `project.md`, and your MCP entries are never changed. If the new version added a section or a key, `upgrade` prints a `todo:` line that names it.

Every tool result says "run `npx e2e-qa-pilot upgrade`" when your project files come from another version than the running server.

**Pinning.** To pin the package, change `e2e-qa-pilot` in your MCP entry to `e2e-qa-pilot@<version>`, and run `upgrade` with that same version when you move it. Without a pin, `npx -y` uses whatever npm resolves or has cached.

**Repair.** `init --force` replaces a file only when it still has the exact `<!-- e2e-qa-pilot:managed -->` line, which **discards your edits to it**. It is the repair for a project installed before the manifest existed. In `CLAUDE.md` it replaces only the marked block. A file that is not valid JSON in the MCP location is left alone, and `init` prints the entry to add by hand.

The skills also work without the MCP entry. See [Without MCP](../mcp.md#without-mcp).

</details>

## How a run ends

`init` copies Markdown commands and editor stubs into a project. `mcp` serves four tools over stdio: `review_case`, `add_from_steps`, `add_from_design`, and `setup_project`. Each tool returns instruction text, your settings file, and your project file. The flowchart is the workflow those instructions ask the assistant to follow. The server does not read or enforce `pr_mode`, and it does not choose a label. The same diagram is in [Create e2e](../processes/create-e2e/README.md). Tool contracts are in [mcp.md](../mcp.md).

```mermaid
flowchart TD
  reviewNode[review_case]
  implNode[implementation command]
  readyNode[Behavior matches and evidence is adequate]
  minorNode[Minor text difference only]
  assertNode[Functional or unresolved assertion]
  shotNode[Required screenshot evidence fails]
  modeNode{pr_mode}
  readyPr["PR labeled e2e:ready"]
  minorPr["PR labeled e2e:minor-text-diff"]
  draftPr["Draft PR labeled e2e:mismatch"]
  askNode[Ask then continue only if authorized]
  reviewNode -->|case not ready| askClarify[Ask and do not invent]
  reviewNode -->|case ready same turn| implNode
  implNode --> readyNode
  implNode --> minorNode
  implNode --> assertNode
  implNode --> shotNode
  readyNode --> readyPr
  minorNode --> minorPr
  assertNode --> modeNode
  shotNode --> modeNode
  modeNode -->|create_pr_for_review| draftPr
  modeNode -->|ask_before_pr| askNode
```
