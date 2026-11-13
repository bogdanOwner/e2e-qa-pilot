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

// One input object for every Create e2e tool. required is empty because the
// caller sends exactly one of the two fields. The handler rejects both and neither.
export const CASE_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    case_id: {
      type: 'string',
      description:
        'Id of an existing case in the configured case tool, such as a Qase id. Do not put test case text here. Mutually exclusive with case_text.',
    },
    case_text: {
      type: 'string',
      description:
        'Complete test case text, including preconditions, steps, and expected results. Use a Title line when the title is known. Mutually exclusive with case_id. No case tool is required.',
    },
  },
  required: [],
  additionalProperties: false,
};

// setup_project takes no case. It only helps the human fill .e2e-qa-pilot/project.md.
export const NO_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
};

export const CATALOG = [
  {
    command: 'review-case',
    tool: 'review_case',
    description:
      'Resolve one case, either by case_id from the configured case tool or by case_text pasted in full. Check that the steps are specific enough to assert, ask one question per hole, update that same case only when it came from a case id, then route to add_from_steps or add_from_design. Returns the instructions to follow. Does not write a spec.',
  },
  {
    command: 'add-from-steps',
    tool: 'add_from_steps',
    description:
      'Write the Playwright spec and open a pull request from a reviewed case supplied as case_id or case_text. Use this when the case has no Figma link, or figma is off. Steps and expected results are the oracle. Returns the instructions to follow.',
  },
  {
    command: 'add-from-design',
    tool: 'add_from_design',
    description:
      'Write the Playwright spec for a reviewed case supplied as case_id or case_text that has a figma.com URL and figma: on. Compares each milestone with its frame. A narrow minor text difference is documented as e2e:minor-text-diff. Other differences follow pr_mode and can be a draft e2e:mismatch. Returns the instructions to follow.',
  },
  {
    command: 'setup-project',
    tool: 'setup_project',
    input: 'none',
    description:
      'Fill in .e2e-qa-pilot/project.md for this repository: ticket id, branch and commit format, case tool, Figma, feature flags, read-only context repositories, and test layout. Inspects the repo first and asks one batch of questions only for what it cannot detect. Takes no case. Returns the instructions to follow.',
  },
];

export const COMMANDS = CATALOG.map((entry) => entry.command);

// Each editor gets the same skills and the same always-on text.
// alwaysOn is where that text goes: a Cursor rule file, or a managed block in CLAUDE.md.
export const EDITORS = {
  cursor: {
    skillsDir: '.cursor',
    mcpFile: path.join('.cursor', 'mcp.json'),
    label: 'Cursor',
    alwaysOn: { kind: 'file', file: path.join('.cursor', 'rules', 'e2e-qa-pilot.mdc') },
  },
  claude: {
    skillsDir: '.claude',
    mcpFile: '.mcp.json',
    label: 'Claude Code',
    alwaysOn: { kind: 'block', file: 'CLAUDE.md' },
  },
};

export const BLOCK_START = '<!-- e2e-qa-pilot:begin -->';
export const BLOCK_END = '<!-- e2e-qa-pilot:end -->';

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
