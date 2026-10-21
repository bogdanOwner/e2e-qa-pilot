import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { commandsDir, CATALOG, SERVER_NAME, readPackageVersion } from './kit.mjs';

// A small stdio MCP server with no dependencies, so every line it runs can be read.
// Tool names and descriptions come from the catalog in kit.mjs.
// It never reads a case, never calls a network, and never reads a secret.
// It hands the assistant the command file, the shared rules, and the project settings.
// Stdout is JSON-RPC only. Faults go to stderr.

const TOOLS = Object.fromEntries(
  CATALOG.map((entry) => [
    entry.tool,
    { command: entry.command, description: entry.description },
  ]),
);

const inputSchema = {
  type: 'object',
  properties: {
    case_id: {
      type: 'string',
      description: 'The id of the existing case in your case tool (for example a Qase id).',
    },
  },
  required: ['case_id'],
  additionalProperties: false,
};

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function buildToolText(toolName, caseId, projectDir) {
  const tool = TOOLS[toolName];
  const skill = read(path.join(commandsDir, tool.command, 'SKILL.md'));
  const ready = read(path.join(commandsDir, 'shared', 'ready-rules.md'));
  const evidence = read(path.join(commandsDir, 'shared', 'pr-evidence.md'));

  const settingsPath = path.join(projectDir, '.e2e-qa-pilot', 'settings.md');
  const settings = fs.existsSync(settingsPath)
    ? read(settingsPath)
    : `(missing: ${settingsPath}. Run \`npx e2e-qa-pilot init\` in the project.)`;

  return [
    `# ${SERVER_NAME}: ${toolName}`,
    '',
    `Case id: ${caseId}`,
    '',
    'You do the work yourself with the tools you already have (your case tool, Playwright, GitHub).',
    'This server fetched nothing. Ask the human when a step is vague, read every screenshot yourself,',
    'and never paste a secret into the chat.',
    '',
    '## Settings (.e2e-qa-pilot/settings.md)',
    '',
    settings,
    '',
    '## Instructions',
    '',
    skill,
    '',
    '## Shared: ready-rules.md',
    '',
    ready,
    '',
    '## Shared: pr-evidence.md',
    '',
    evidence,
  ].join('\n');
}

function reply(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function fail(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}

export function handleMessage(message, projectDir) {
  if (!isRecord(message)) {
    return { error: { code: -32700, message: 'Parse error' } };
  }
  const { id, method, params } = message;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize':
      return {
        result: {
          protocolVersion: params?.protocolVersion ?? '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: readPackageVersion() },
        },
      };
    case 'ping':
      return { result: {} };
    case 'tools/list':
      return {
        result: {
          tools: Object.entries(TOOLS).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema,
          })),
        },
      };
    case 'tools/call': {
      const name = params?.name;
      const caseId = params?.arguments?.case_id;
      if (!TOOLS[name]) {
        return { error: { code: -32602, message: `Unknown tool: ${name}` } };
      }
      if (typeof caseId !== 'string' || caseId.trim() === '') {
        return {
          result: {
            isError: true,
            content: [{ type: 'text', text: 'case_id is required. Ask the human for the case id.' }],
          },
        };
      }
      return {
        result: {
          content: [{ type: 'text', text: buildToolText(name, caseId.trim(), projectDir) }],
        },
      };
    }
    default:
      if (isNotification) return null;
      return { error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

function respond(message, outcome) {
  if (!outcome) return;
  const id = isRecord(message) ? message.id : undefined;
  if (id === undefined || id === null) {
    if (outcome.error) {
      process.stderr.write(`${outcome.error.message}\n`);
      fail(null, outcome.error.code, outcome.error.message);
    }
    return;
  }
  if (outcome.error) fail(id, outcome.error.code, outcome.error.message);
  else reply(id, outcome.result);
}

export function runMcp({ projectDir = process.cwd() } = {}) {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      process.stderr.write('Parse error\n');
      fail(null, -32700, 'Parse error');
      return;
    }
    let outcome;
    try {
      outcome = handleMessage(message, projectDir);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      const id = isRecord(message) ? message.id : undefined;
      if (id !== undefined && id !== null) {
        fail(id, -32603, text);
      } else {
        process.stderr.write(`${text}\n`);
        fail(null, -32603, text);
      }
      return;
    }
    respond(message, outcome);
  });
}
