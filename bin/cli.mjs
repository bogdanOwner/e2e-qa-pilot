#!/usr/bin/env node
import { runInit, INIT_USAGE } from '../src/init.mjs';
import { runMcp } from '../src/mcp.mjs';
import { readPackageVersion } from '../src/kit.mjs';

const [command, ...rest] = process.argv.slice(2);

const USAGE = `e2e-qa-pilot ${readPackageVersion()}

Commands:
  init [path]   Install the skills and settings into your project
  mcp           Start the MCP server (stdio). Your editor runs this for you.

${INIT_USAGE}`;

try {
  if (command === 'init') {
    runInit(rest);
  } else if (command === 'mcp') {
    runMcp();
  } else if (command === '--version' || command === '-v') {
    console.log(readPackageVersion());
  } else if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(USAGE);
  } else {
    console.error(`Unknown command: ${command}\n\n${USAGE}`);
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
