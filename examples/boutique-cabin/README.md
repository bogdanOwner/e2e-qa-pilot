# Cabana 365

A small site that shows how e2e-qa-pilot works. Start the page, then send one line in chat. The assistant reads the case file. Each line has a different result.

The page reads `data/customer.json` and English labels from `data/locales/en.json`. Search and booking are local mocks. Search waits about 2 seconds, then lists the rooms in the customer file. Booking waits about 2 seconds, then shows `Your request was successfully sent.` The Booking timeout demo link opens `/?demo=timeout`. Booking then exceeds the 8 second limit and shows `Something went wrong. Please try again.`

## 1. Start the site

From a clone of this repository:

```bash
cd examples/boutique-cabin
npm install
npm start
```

Open `http://127.0.0.1:4173`.

Install Chromium once before you ask the assistant to automate a case. The workflow commands will not do this.

```bash
npx playwright install chromium
```

## 2. Review a case

Install the commands into this folder, then restart the editor. `init` leaves `.e2e-qa-pilot/settings.md` unchanged. That file already has `test_command: npm run test:live`, `pr_mode: ask_before_pr`, and `figma: off`.

```bash
node ../../bin/cli.mjs init --integration cursor
```

Use `all` instead of `cursor` when you also want the Claude Code skills.

Send one of these lines in chat. `figma` is off, so a ready case continues into the steps command in the same turn. A pull request is opened only when the assistant has GitHub access. If that access is missing, the assistant reports it and leaves the local spec and screenshots.

### Case 1 — the page matches the case

```text
Review cases/ready.md with e2e-qa-pilot and implement it if it is ready.
```

Goal: a pull request labeled `e2e:ready`, with the steps in the description and screenshot links. Chalet 4 is listed at 497 RON, and the confirmation shows booking reference `CAB-1042`. The spec title in `tests/book-chalet.spec.mjs` is different from this case title, so the duplicate check does not treat them as the same test.

### Case 2 — only the confirmation wording differs

```text
Review cases/wording.md with e2e-qa-pilot and implement it if it is ready.
```

Goal: a pull request labeled `e2e:minor-text-diff`. The case says "Your request was has been successfully sent." The page says "Your request was successfully sent." That sentence is not a passing assertion, and the run continues.

### Case 3 — a step does not match the page

```text
Review cases/mismatch.md with e2e-qa-pilot and implement it if it is ready.
```

Goal: stop before a pull request and show the problem in chat. The timeout page shows `Something went wrong. Please try again.` The failing assertion stays. `ask_before_pr` asks, and a pull request is opened only after you explicitly authorize it.

### Case 4 — the case has no expected result

```text
Review cases/ambiguous.md with e2e-qa-pilot and implement it if it is ready.
```

Goal: the assistant asks, and does not start the spec. The steps have no expected result, so `review_case` does not invent one.

## Call review_case from MCP

The lines above are the way to run the cases. The assistant reads the file and calls `review_case` with that text as `case_text`, and omits `case_id`. The server returns instructions. It does not write the spec or open the pull request. The tool contract is in [mcp.md](../../mcp.md).

## Stored pages

`npm test` checks the pages already saved in `html/` and does not ask an assistant to review a case. `npm run test:mismatch` opens `html/timeout.html`, expects the success sentence, and fails. `npm run build:html` rewrites those files from the live page. The four cases above do not need these commands.
