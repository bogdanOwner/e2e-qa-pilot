# Contributing

Pull requests target `main`. Fork [bogdanOwner/e2e-qa-pilot](https://github.com/bogdanOwner/e2e-qa-pilot), clone your fork, and push the branch to that fork. Upstream accepts the change as a pull request. Write access on this repository is not granted for contributions.

1. Open an issue before a large change.
2. Create a branch on your fork. Use `feat/`, `fix/`, `docs/`, or `chore/`, then a short kebab-case slug. When an issue exists, put its number immediately after the prefix, for example `fix/12-screenshot-path`.
3. Make one focused change.
4. Run `npm test`.
5. Push the branch to your fork and open a pull request into `main`.
6. Wait for review. The maintainer approves the pull request, then merges it. Nothing is auto-merged.

GitHub runs `npm test` on Node.js 22 and on Node.js 24. Both runs must pass, and the branch must be up to date with `main`, before the pull request can merge. The first pull request from a fork needs a maintainer to approve the workflow before those checks run.

```bash
npm test
```

`npm test` runs behavioral tests of `init` and the MCP server, and documentation consistency checks in `test/docs.test.mjs`. They check that instruction text and documentation match the code. They do not prove that an assistant follows the instructions, they do not validate the assistant workflow end to end, and they do not run Cursor or Claude Code.

The commands under `processes/create-e2e/commands/` are the spec, so a behavior change starts there. The overview is [Create e2e](processes/create-e2e/README.md).

`templates/always-on.md` is written for the assistant, not for people. `init` copies it word for word into the Cursor rule and into the `CLAUDE.md` block, so it belongs to both editors and holds no comments. A person reads it only inside those two files.

Report vulnerabilities through [SECURITY.md](SECURITY.md). Community expectations are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
