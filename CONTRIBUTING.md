# Contributing

```bash
npm test
```

`npm test` runs behavioral tests of `init` and the MCP server, and documentation consistency checks in `test/docs.test.mjs`. They check that instruction text and documentation match the code. They do not prove that an assistant follows the instructions, they do not validate the assistant workflow end to end, and they do not run Cursor or Claude Code.

Open an issue before a large change. The commands under `processes/create-e2e/commands/` are the spec, so a behavior change starts there. The overview is [Create e2e](processes/create-e2e/README.md).

Report vulnerabilities through [SECURITY.md](SECURITY.md). Community expectations are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
