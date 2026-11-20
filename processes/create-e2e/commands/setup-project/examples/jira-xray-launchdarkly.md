# Project

## Ticket

Tracker: Jira.
Required: yes.
`{ticket_id}` is the full key, for example `PROJ-123`.
If no ticket key was given, ask once. Do not create a ticket.

## Branch & commit

Start from `main`.
Open the pull request against `main`.
Branch: `{ticket_id}[_{case_id}]_{title_slug}`
Commit subject: `test({ticket_id}): {explanation}`

## Case tool

Tool: Xray, through the `jira` MCP server.
Fetch: call the `jira` tool that gets a test by key.
Update: call the `jira` tool that updates a test. Always pass the key.
The case id is optional. A pasted case has none.

## Design

Figma: off

## Feature flags

Tool: LaunchDarkly, through the `launchdarkly` MCP server. Read only.
Environment: staging.
If a flag the case needs is off, report it and stop.

## Context repos

Repository: `my-org/web-app`, default branch `main`. Read only, through `gh`.
Read routes, test ids, labels, and flag keys.

## Test layout

Specs: `e2e/tests`
Fixture: `e2e/fixtures.ts`
Screenshots: `e2e/screenshots`
