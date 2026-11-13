# Project

> Everything on this page is optional. Fill in only what your project needs and delete the rest.
> The easiest way: ask your assistant "Set up e2e-qa-pilot for this project." It reads the repository and your MCP servers and fills this file.
> Block quotes and code blocks are explanation and examples. They are not read. Write your own lines as plain text under the heading.
> Never put a token or secret here. Credentials belong in your editor's MCP configuration.
> More examples: `examples/project-files/` in the e2e-qa-pilot repository. Reference: `docs/project.md`.

## Ticket

> Use this if your branch or commit names a ticket. Without it, the assistant never asks for an id.

```text
Tracker: Jira
Required: yes
{ticket_id} is the full key, for example PROJ-123.
```

## Branch & commit

> Use this if your branches or commits follow a format, or you do not start from `main`.

```text
Start from `develop`. Open the pull request against `develop`.
Branch: `{ticket_id}[_{case_id}]_{title_slug}`
Commit subject: `test({ticket_id}): {explanation}`
```

> `[ ... ]` is an optional group. It is dropped, with its separator, when the placeholder inside has no value.

## Case tool

> Use this if you pass a case id and the case lives in a tool such as Qase, TestRail, Xray, or Zephyr.

```text
Tool: TestRail, through the `testrail` MCP server.
Fetch: use the `testrail` tool that gets a case by id.
Update: use the `testrail` tool that updates a case. Always pass the id.
The case id is optional. A pasted case has none.
```

## Design

> Use this if cases link to Figma frames.

```text
Figma: on
Read a frame: use the `figma` tool that returns a frame for a node id.
```

> With `Figma: on`, the design command runs only for a case that contains a figma.com URL.

## Feature flags

> Use this if a feature can be switched off by a flag (GrowthBook, LaunchDarkly, Unleash, Statsig). The assistant only reads flags.

```text
Tool: LaunchDarkly, through the `launchdarkly` MCP server. Read only.
Environment: staging.
If a flag the case needs is off, say so and stop.
```

## Context repos

> Use this if another repository, such as your frontend, holds the routes and test ids. The assistant reads it through `gh` and never writes to it.

```text
Repository: `my-org/frontend`, default branch `main`. Read only.
Read routes, test ids, labels, and flag keys.
```

## Test layout

> Use this if the assistant cannot find your tests on its own.

```text
Specs: `tests/e2e`
Fixture: `tests/fixture.ts`
Screenshots: `tests/screenshots`
```

## Rules

> Use this for anything else, in plain sentences. These cannot weaken the ready checks, the word rule, the screenshot gate, the labels, or `pr_mode`.

```text
Locate elements by data-testid when it exists.
Name every spec file after the feature, in kebab-case.
```
