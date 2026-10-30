# Cabana

A small site that shows how e2e-qa-pilot works. Start the page, then send one line in chat. The assistant reads the case file. Each line has a different result.

This is an example site with mock data, for trying e2e-qa-pilot. The page reads `data/customer.json` and English labels from the boutique-cabin template. Search reads those rooms on the page. Reserve Now opens `/booking`. Confirm Booking does not send a request. After the required fields are filled, it waits about 2 seconds, then shows `Your request was successfully sent.` and booking reference `CAB-1042`.

## 1. Start the site

From a clone of this repository, open `examples/boutique-cabin` in Cursor or Claude Code, then:

```bash
npm install
npx playwright install chromium
npm start
```

Open `http://127.0.0.1:4173`.

Note: the Astro build files in `_astro` are committed so this setup does not require a build. Normally those files would not be committed.

## 2. Review a case

Cursor:

```bash
npm run init:cursor
```

This writes `.cursor/skills/` and `.cursor/mcp.json`. Reload the Cursor window, then open a new chat. A message in the chat that is already open does not load the new server. If you skip the reload, the case line looks like it does nothing.

Claude Code:

```bash
npm run init:claude
```

This writes `.claude/skills/` and `.mcp.json` in this folder. Quit Claude Code and start it again here, then open a new chat. The session already open does not load the new server.

Both commands also write `.e2e-qa-pilot/`. The skill text is the same. Only the editor folder and the MCP file differ. Then send the short line. Open "Full description" under that line when you want to paste the case instead. A case id is not a file path. This example does not use one.

You only send the line. The assistant reviews the case and implements it when it is ready.

### Case 1 — the page matches the case

```text
Review cases/ready.md with e2e-qa-pilot and implement it if it is ready.
```

<details>
<summary>Full description</summary>

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Book Chalet 4 at Cabana
Preconditions: the guest is on the Cabana page.
1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.
   Expected: Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 is not available for the selected dates.
2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.
   Expected: the selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.
3. Enter First Name, Last Name, and Email Address, accept the terms, and click Confirm Booking.
   Expected: the confirmation says "Your request was successfully sent." and booking reference CAB-1042 is shown.
```

</details>

Goal: a pull request labeled `e2e:ready`, with the steps in the description and screenshot links. Chalet 4 is listed at 497 EUR, and the confirmation shows booking reference `CAB-1042`. The spec title in `tests/book-chalet.spec.mjs` is different from this case title, so the duplicate check does not treat them as the same test.

### Case 2 — only the confirmation wording differs

```text
Review cases/wording.md with e2e-qa-pilot and implement it if it is ready.
```

<details>
<summary>Full description</summary>

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Book Chalet 4 with the case confirmation sentence
Preconditions: the guest is on the Cabana page.
1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.
   Expected: Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 is not available for the selected dates.
2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.
   Expected: the selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.
3. Enter First Name, Last Name, and Email Address, accept the terms, and click Confirm Booking.
   Expected: the confirmation says "Your request was has been successfully sent." and a booking reference is shown.
```

</details>

Goal: a pull request labeled `e2e:minor-text-diff`. The case says "Your request was has been successfully sent." The page says "Your request was successfully sent." That sentence is not a passing assertion, and the run continues.

### Case 3 — the confirmation matches the page

```text
Review cases/mismatch.md with e2e-qa-pilot and implement it if it is ready.
```

<details>
<summary>Full description</summary>

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Book Chalet 4 and confirm the stay
Preconditions: the guest is on the Cabana page.
1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.
   Expected: Chalet 4 is listed at 497 EUR, with 15% off and free cancellation.
2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.
   Expected: the selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.
3. Enter First Name, Last Name, and Email Address, accept the terms, and click Confirm Booking.
   Expected: the confirmation says "Your request was successfully sent." and booking reference CAB-1042 is shown.
```

</details>

Goal: the same successful confirmation as case 1. Confirm Booking waits about 2 seconds and shows `Your request was successfully sent.` with booking reference `CAB-1042`. There is no timeout failure.

### Case 4 — the case has no expected result

```text
Review cases/ambiguous.md with e2e-qa-pilot and implement it if it is ready.
```

<details>
<summary>Full description</summary>

```text
Review this case with e2e-qa-pilot and implement it if it is ready:

Title: Book a chalet
Preconditions: the guest is on the Cabana page.
1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.
2. Press Increase quantity on a Chalet 4 rate, then click Reserve Now.
3. On the confirm page, enter the guest details, accept the terms, and click Confirm Booking.
```

</details>

Goal: the assistant asks, and does not start the spec. The steps have no expected result, so `review_case` does not invent one.

## Stored pages

`npm test` checks the pages already saved in `html/` and does not ask an assistant to review a case. `npm run build:html` rewrites those files from the live page. The four cases above do not need these commands.
