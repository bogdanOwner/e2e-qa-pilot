import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Shared facts for init and the MCP server.
// CATALOG must match the command folders under processes/create-e2e/commands/.
// Those Markdown files are the spec. The descriptions here are only the short MCP blurbs.
// EDITORS is the map from an editor name to its skill folder, MCP file, and label.

export const kitRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MARKER = 'e2e-qa-pilot:managed';
export const MARKER_LINE = `<!-- ${MARKER} -->`;
export const SERVER_NAME = 'e2e-qa-pilot';

export const CATALOG = [
  {
    command: 'review-case',
    tool: 'review_case',
    description:
      'Check whether an existing case has steps specific enough to assert, ask one question per hole, update that same case, then route to add_from_steps or add_from_design. Returns the instructions to follow. Does not write a spec.',
  },
  {
    command: 'add-from-steps',
    tool: 'add_from_steps',
    description:
      'Write the Playwright spec and open a pull request for a case with no Figma link (or figma: off). Steps are the oracle. Returns the instructions to follow.',
  },
  {
    command: 'add-from-design',
    tool: 'add_from_design',
    description:
      'Write the Playwright spec for a case that has a figma.com URL and figma: on. Compares each milestone with its frame and stops for a human on MINOR or BLOCKER. Returns the instructions to follow.',
  },
];

export const COMMANDS = CATALOG.map((entry) => entry.command);

export const EDITORS = {
  cursor: {
    skillsDir: '.cursor',
    mcpFile: path.join('.cursor', 'mcp.json'),
    label: 'Cursor',
  },
  claude: {
    skillsDir: '.claude',
    mcpFile: '.mcp.json',
    label: 'Claude Code',
  },
};

export const commandsDir = path.join(kitRoot, 'processes', 'create-e2e', 'commands');

export function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(kitRoot, 'package.json'), 'utf8'));
  return pkg.version;
}

export function listFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...listFiles(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}
