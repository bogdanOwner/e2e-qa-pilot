# Project

## Ticket

Tracker: Plane.
Required: yes.
`{ticket_id}` is the number only, for example `1234`.
If no ticket number was given, ask once. Do not create a ticket.

## Branch & commit

Start from `develop`.
Open the pull request against `develop`.
Branch: `DEV_{ticket_id}[_{case_id}]_{title_slug}`
Commit subject: `test({ticket_id}): {explanation}`

## Case tool

Tool: Qase, through the `qase` MCP server.
Fetch: call the `qase` tool that gets a case by id.
Update: call the `qase` tool that updates a case. Always pass the id.
The case id is optional. A pasted case has none.

## Design

Figma: on
Use add-from-design only for a case that contains a figma.com URL. Other cases use the steps.
Read a frame: call the `figma` tool that returns a frame for a node id.

## Feature flags

Tool: GrowthBook, through the `growthbook` MCP server. Read only.
Environment: staging.
If a flag the case needs is off, report it and stop.

## Context repos

Repository: `my-org/frontend`, default branch `main`. Read only, through `gh`.
Read routes, test ids, labels, and flag keys. A frontend pull request linked with the case is the change under test.

## Test layout

Specs: `tests/e2e`
Pages: `tests/pages`
Fixture: `tests/fixture.ts`
Screenshots: `tests/screenshots`
