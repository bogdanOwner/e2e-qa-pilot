# Mini app

A local pasted-case demo of the steps workflow. It does not fetch a case, read Figma, or open a pull request. Local results are the page, the two Playwright scripts, screenshots under `artifacts/png`, and a git diff after an assistant edits this folder. A pull request, labels, a case-id fetch, and Figma stay outside this example. They need an assistant that already has those tools.

`npm test` runs the passing flow. `npm run test:mismatch` asserts a different exact toast and is expected to fail. That failure is a local Playwright result, not a pull request.

## Steps

1. Install Node 22 and clone this repository.
2. `cd examples/mini-app`
3. `npm install`
4. `npx playwright install chromium` once. The workflow commands will not do this.
5. `npm test` and confirm the passing flow.
6. `npm run test:mismatch` and confirm the exact-text failure.
7. `node ../../bin/cli.mjs init --integration cursor` (or `all`). Confirm `.e2e-qa-pilot/settings.md` is unchanged.
8. Restart the editor.
9. Paste `cases/ready.md` and ask the assistant to review and implement it. Inspect the git diff locally. The spec title in `tests/create-entry.spec.mjs` is different from that case title, so the duplicate check does not treat them as the same test.
10. Paste `cases/mismatch.md` the same way. The instructions say to keep the failing assertion. A draft pull request exists only after the assistant has GitHub access.

`cases/wording.md` is the narrow toast difference: the case says "Your diary entry has successfully created" and the page says "Your Diary entry successfully created!". `cases/ambiguous.md` has no expected result. It is input text only. This app has no code path that asks a question.
