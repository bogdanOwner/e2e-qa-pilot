import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { commandsDir, CATALOG, CASE_INPUT_SCHEMA, SERVER_NAME, readPackageVersion } from './kit.mjs';

// A small stdio MCP server with no dependencies, so every line it runs can be read.
// Tool names, descriptions, and the input schema come from kit.mjs.
// It never contacts a case tool, never calls a network, and never reads a secret.
// Case text in a tool call is the text the client sent.
// It hands the assistant the command file, the shared rules, and the project settings.
// Stdout is JSON-RPC only. Faults go to stderr.

const TOOLS = Object.fromEntries(
  CATALOG.map((entry) => [
    entry.tool,
    { command: entry.command, description: entry.description },
  ]),
);

const INPUT_KEYS = ['case_id', 'case_text'];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function presentText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveCaseInput(args) {
  if (args === undefined || args === null) {
    return { error: 'Provide case_id or case_text. Ask the human for one of them.' };
  }
  if (!isRecord(args)) {
    return { error: 'Tool arguments must be an object.' };
  }
  const unknown = Object.keys(args).filter((key) => !INPUT_KEYS.includes(key));
  if (unknown.length > 0) {
    return { error: `Unknown input: ${unknown.join(', ')}.` };
  }
  for (const key of INPUT_KEYS) {
    if (args[key] !== undefined && typeof args[key] !== 'string') {
      return { error: `${key} must be a string.` };
    }
  }
  const caseId = presentText(args.case_id);
  const caseText = presentText(args.case_text);
  if (caseId && caseText) {
    return { error: 'Provide either case_id or case_text, not both.' };
  }
  if (!caseId && !caseText) {
    return { error: 'Provide case_id or case_text. Ask the human for one of them.' };
  }
  if (caseId) return { mode: 'case_id', caseId };
  return { mode: 'case_text', caseText };
}

function sourceBlock(source) {
  if (source.mode === 'case_id') {
    return [
      'Input mode: case_id',
      '',
      `Case id: ${source.caseId}`,
      '',
      'Fetch this id with fetch_case from settings.',
      'If the case tool errors or the case does not exist, stop and report that.',
      'Do not invent the case. Do not treat this id as test case text.',
    ].join('\n');
  }
  return [
    'Input mode: case_text',
    '',
    'Case text:',
    '',
    source.caseText,
    '',
    'This text is the case. Do not call fetch_case or update_case. A case tool is not required.',
  ].join('\n');
}

export function buildToolText(toolName, source, projectDir) {
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
    sourceBlock(source),
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
            inputSchema: CASE_INPUT_SCHEMA,
          })),
        },
      };
    case 'tools/call': {
      const name = params?.name;
      if (!TOOLS[name]) {
        return { error: { code: -32602, message: `Unknown tool: ${name}` } };
      }
      const source = resolveCaseInput(params?.arguments);
      if (source.error) {
        return {
          result: {
            isError: true,
            content: [{ type: 'text', text: source.error }],
          },
        };
      }
      return {
        result: {
          content: [{ type: 'text', text: buildToolText(name, source, projectDir) }],
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
