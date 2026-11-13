import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInit, runUpgrade } from '../src/init.mjs';
import { hashText, readManifest, writeManifest, MANIFEST_FILE } from '../src/manifest.mjs';
import { handleMessage } from '../src/mcp.mjs';
import { MARKER_LINE } from '../src/kit.mjs';

const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'cli.mjs');

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-qa-pilot-'));
}

const quiet = { log: () => {} };

test('init defaults to the current folder and installs both editors', () => {
  const dir = tempProject();
  runInit([], { cwd: dir, ...quiet });
  for (const editor of ['.cursor', '.claude']) {
    for (const name of ['review-case', 'add-from-steps', 'add-from-design', 'setup-project']) {
      assert.ok(fs.existsSync(path.join(dir, editor, 'skills', name, 'SKILL.md')));
    }
  }
  const settings = fs.readFileSync(path.join(dir, '.e2e-qa-pilot', 'settings.md'), 'utf8');
  const active = settings.replace(/<!--[\s\S]*?-->/g, '');
  assert.match(active, /^pr_mode: create_pr_for_review$/m);
  assert.match(active, /^pr_label_ready: e2e:ready$/m);
  assert.match(active, /^pr_label_minor_text_diff: e2e:minor-text-diff$/m);
  assert.match(active, /^pr_label_mismatch: e2e:mismatch$/m);
  assert.ok(fs.existsSync(path.join(dir, '.cursor', 'mcp.json')));
  assert.ok(fs.existsSync(path.join(dir, '.mcp.json')));
});

test('init --integration claude installs only Claude files', () => {
  const dir = tempProject();
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'review-case', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.cursor')));
});

test('init detects an editor folder that already exists', () => {
  const dir = tempProject();
  fs.mkdirSync(path.join(dir, '.cursor'));
  runInit([], { cwd: dir, ...quiet });
  assert.ok(fs.existsSync(path.join(dir, '.cursor', 'skills', 'review-case', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.claude')));
});

test('init never overwrites filled settings, even with --force', () => {
  const dir = tempProject();
  runInit([], { cwd: dir, ...quiet });
  const settings = path.join(dir, '.e2e-qa-pilot', 'settings.md');
  fs.writeFileSync(settings, 'case_tool: qase\n');
  runInit(['--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(settings, 'utf8'), 'case_tool: qase\n');
});

test('init keeps other MCP servers and does not duplicate itself', () => {
  const dir = tempProject();
  fs.mkdirSync(path.join(dir, '.cursor'));
  const file = path.join(dir, '.cursor', 'mcp.json');
  fs.writeFileSync(file, JSON.stringify({ mcpServers: { qase: { command: 'x' } } }));
  runInit([], { cwd: dir, ...quiet });
  runInit([], { cwd: dir, ...quiet });
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(config.mcpServers), ['qase', 'e2e-qa-pilot']);
});

test('init refuses an unknown integration', () => {
  assert.throws(() => runInit(['--integration', 'vim'], { cwd: tempProject(), ...quiet }));
});

test('init refuses an empty --integration value', () => {
  const dir = tempProject();
  assert.throws(
    () => runInit(['--integration'], { cwd: dir, ...quiet }),
    /--integration must be one of/,
  );
  assert.throws(
    () => runInit(['--integration='], { cwd: dir, ...quiet }),
    /--integration must be one of/,
  );
  assert.equal(fs.readdirSync(dir).length, 0);
});

test('init sets up both editors when both folders exist', () => {
  const dir = tempProject();
  fs.mkdirSync(path.join(dir, '.cursor'));
  fs.mkdirSync(path.join(dir, '.claude'));
  runInit([], { cwd: dir, ...quiet });
  assert.ok(fs.existsSync(path.join(dir, '.cursor', 'skills', 'review-case', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'review-case', 'SKILL.md')));
});

test('init --force refreshes a marked file and leaves an unmarked one', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const skill = path.join(dir, '.cursor', 'skills', 'review-case', 'SKILL.md');
  const original = fs.readFileSync(skill, 'utf8');
  fs.writeFileSync(skill, `${original}user note\n`);
  const custom = path.join(dir, '.cursor', 'skills', 'add-from-steps', 'SKILL.md');
  fs.writeFileSync(custom, 'mentions e2e-qa-pilot:managed in prose\n');
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(skill, 'utf8'), original);
  assert.equal(fs.readFileSync(custom, 'utf8'), 'mentions e2e-qa-pilot:managed in prose\n');
});

test('init leaves mcp.json alone when mcpServers is not an object', () => {
  const dir = tempProject();
  fs.mkdirSync(path.join(dir, '.cursor'));
  const file = path.join(dir, '.cursor', 'mcp.json');
  for (const mcpServers of [['qase'], 'qase']) {
    const original = JSON.stringify({ mcpServers });
    fs.writeFileSync(file, original);
    runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
    assert.equal(fs.readFileSync(file, 'utf8'), original);
  }
});

test('init --force leaves an existing MCP entry in place', () => {
  const dir = tempProject();
  fs.mkdirSync(path.join(dir, '.cursor'));
  const file = path.join(dir, '.cursor', 'mcp.json');
  fs.writeFileSync(file, JSON.stringify({ mcpServers: { 'e2e-qa-pilot': { command: 'old' } } }));
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(config.mcpServers['e2e-qa-pilot'], { command: 'old' });
});

function mcpSession(dir, messages, expectedLines, { stderrIncludes } = {}) {
  const child = spawn('node', [cli, 'mcp'], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = [];
  let buffer = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const parts = buffer.split('\n');
    buffer = parts.pop();
    lines.push(...parts.filter(Boolean).map((line) => JSON.parse(line)));
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  for (const message of messages) {
    const line = typeof message === 'string' ? message : JSON.stringify(message);
    child.stdin.write(`${line}\n`);
  }
  let poll;
  const result = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(poll);
      reject(new Error(`timed out waiting for ${expectedLines} MCP responses, got ${lines.length}`));
    }, 2000);
    poll = setInterval(() => {
      const stderrReady = stderrIncludes === undefined || stderr.includes(stderrIncludes);
      if (lines.length >= expectedLines && stderrReady) {
        clearInterval(poll);
        clearTimeout(timeout);
        resolve({ lines, stderr });
      }
    }, 20);
  });
  return { child, result };
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 1000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

const ALL_TOOLS = ['review_case', 'add_from_steps', 'add_from_design', 'setup_project'];

test('mcp lists four tools and returns instructions', async (t) => {
  const dir = tempProject();
  let child;
  t.after(async () => {
    await stopChild(child);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const session = mcpSession(
    dir,
    [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'review_case', arguments: { case_id: 'QA-1' } },
      },
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'review_case', arguments: {} } },
    ],
    4,
  );
  child = session.child;
  const { lines } = await session.result;

  const byId = Object.fromEntries(lines.map((line) => [line.id, line]));
  assert.equal(byId[1].result.serverInfo.name, 'e2e-qa-pilot');
  assert.deepEqual(
    byId[2].result.tools.map((tool) => tool.name),
    ALL_TOOLS,
  );
  assert.match(byId[3].result.content[0].text, /Case id: QA-1/);
  assert.match(byId[3].result.content[0].text, /Review case steps/);
  assert.equal(byId[4].result.isError, true);
});

test('handleMessage rejects values that are not objects', () => {
  for (const message of [null, 1, 'hi', []]) {
    assert.deepEqual(handleMessage(message, os.tmpdir()), {
      error: { code: -32700, message: 'Parse error' },
    });
  }
});

function callTool(dir, name, args) {
  return handleMessage(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    },
    dir,
  );
}

function instructionText(outcome) {
  assert.equal(outcome.result.isError, undefined);
  return outcome.result.content[0].text;
}

test('tools/list schema keeps case_id optional for protocol 2025-03-26', () => {
  // Checks the schema this server publishes. It does not load an MCP SDK.
  const omitted = handleMessage(
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    os.tmpdir(),
  );
  assert.equal(omitted.result.protocolVersion, '2025-03-26');
  const echoed = handleMessage(
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
    os.tmpdir(),
  );
  assert.equal(echoed.result.protocolVersion, '2025-03-26');

  const listed = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, os.tmpdir());
  assert.deepEqual(
    listed.result.tools.map((tool) => tool.name),
    ALL_TOOLS,
  );
  for (const tool of listed.result.tools) {
    assert.equal(tool.inputSchema.type, 'object');
    assert.deepEqual(tool.inputSchema.required, []);
    assert.equal(tool.inputSchema.additionalProperties, false);
    if (tool.name === 'setup_project') {
      assert.deepEqual(tool.inputSchema.properties, {});
      continue;
    }
    assert.equal(tool.inputSchema.properties.case_id.type, 'string');
    assert.equal(tool.inputSchema.properties.case_text.type, 'string');
  }
  assert.match(listed.result.tools[0].description, /case_text/);
  assert.match(listed.result.tools[0].description, /Does not write a spec/);
});

test('case_id-only call returns fetch instructions and does not run them', () => {
  const text = instructionText(callTool(tempProject(), 'review_case', { case_id: 'QA-1' }));
  assert.match(text, /Input mode: case_id/);
  assert.match(text, /Case id: QA-1/);
  assert.match(text, /Fetch this id with fetch_case from settings/);
  assert.match(text, /case does not exist/);
  assert.match(text, /Do not invent the case/);
  assert.match(text, /Do not treat this id as test case text/);
  assert.match(text, /Do not switch this request to `case_text`/);
  assert.match(text, /Preconditions say who is signed in/);
  assert.match(text, /add-from-design/);
  assert.match(text, /add-from-steps/);
  assert.match(text, /figma: on/);
});

test('case_text call returns pasted-case instructions without a provider', () => {
  // Checks instruction text. It does not prove an assistant follows the workflow.
  const dir = tempProject();
  const settings = path.join(dir, '.e2e-qa-pilot', 'settings.md');
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  const original = 'figma: off\n';
  fs.writeFileSync(settings, original);
  const pasted = [
    'Title: Sign in',
    '',
    '# Other title',
    '',
    'Preconditions: a user is signed in on the home page.',
    '1. Open home. Expected: the home page is visible.',
  ].join('\n');

  const review = instructionText(callTool(dir, 'review_case', { case_text: pasted }));
  assert.match(review, /Input mode: case_text/);
  assert.match(review, /Title: Sign in/);
  assert.match(review, /Do not call fetch_case or update_case/);
  assert.match(review, /A case tool is not required/);
  assert.match(review, /Prefer a `Title:` line/);
  assert.match(review, /first Markdown H1/);
  assert.match(review, /ask for a short title before generating the spec/);
  assert.match(review, /trimmed title/);
  assert.match(review, /Display text preserves the original casing/);
  assert.match(review, /Preconditions say who is signed in/);
  assert.match(review, /add-from-design/);
  assert.match(review, /add-from-steps/);
  assert.equal(fs.readFileSync(settings, 'utf8'), original);

  const steps = instructionText(callTool(dir, 'add_from_steps', { case_text: pasted }));
  assert.match(steps, /Normalize by trimming, lowercasing, collapsing whitespace, and stripping punctuation/);
  assert.match(steps, /only a likely match/);
  assert.match(steps, /Ask one question only when the read leaves it ambiguous/);
  assert.match(steps, /similar words/);
  assert.match(steps, /duplicate check could not be completed/);
  assert.match(steps, /Do not claim that no duplicate exists/);
  assert.match(steps, /git check-ref-format --branch/);
  assert.match(steps, /Never invent an id/);
  assert.match(steps, /`\{title_slug\}`/);
  assert.match(steps, /`\{case_id\}`/);
  assert.match(steps, /e2e\/\{title_slug\}/);
  assert.match(steps, /e2e\/\{case_id\}-\{title_slug\}/);
  assert.match(steps, /Do not ask/);
  assert.match(steps, /literal branch name/);
  assert.match(steps, /`✅ As expected`/);
  assert.match(steps, /## Test data/);
  assert.match(steps, /`step-03a` \(filled\) and `step-03b` \(result\)/);
  assert.match(steps, /An empty form does not prove the entry/);
  assert.match(steps, /asserts each entered value and each toggled control/);
  assert.match(steps, /starts with `<case-id>`/);
  assert.match(steps, /assertion_edits/);
  assert.match(steps, /figma: on/);
  assert.match(steps, /not, by itself, a confirmed product regression/);
  // The assertions below read instruction text returned by the server.
  // They do not prove that Cursor or Claude Code follows it, and they do not
  // validate the e2e assistant workflow.
  assert.doesNotMatch(steps, /sameVisibleMessage/);
  assert.match(steps, /A missing or empty `pr_mode` means `create_pr_for_review`/);
  assert.match(steps, /Never auto-merge/);
  assert.match(
    steps,
    /`ask_before_pr` stops before creating a pull request when a functional mismatch, an unresolved difference, or a failed final-screenshot gate remains/,
  );
  assert.match(steps, /A narrow minor text difference does not trigger this stop/);
  assert.match(steps, /explicitly authorizes it/);
  assert.match(steps, /preserve the failing assertion/);
  assert.match(steps, /Do not put the quoted case sentence in an assertion/);
  assert.match(steps, /remaining words match in the same order/);
  assert.match(steps, /When the remaining words do not match in the same order/);
  assert.match(steps, /Your diary entry has successfully created/);
  assert.match(steps, /Your Diary entry successfully created!/);
  assert.match(steps, /e2e:minor-text-diff/);
  assert.match(steps, /Functional checks in the same step stay `pass` when they pass/);
  assert.match(steps, /was not a passing assertion/);
  assert.match(steps, /The spec stays red/);
  assert.match(steps, /does not, by itself, prove that a functional assertion failed/);
  assert.match(
    steps,
    /selects `e2e:mismatch`, unless the only issue in the run is the narrow text difference/,
  );
  assert.match(
    steps,
    /Functional assertions passed, the expected behavior matches, and required screenshot evidence meets the acceptance criteria/,
  );
});

test('add_from_design instructions follow pr_mode for MINOR and BLOCKER', () => {
  const text = instructionText(
    callTool(tempProject(), 'add_from_design', {
      case_text: 'Title: Home\n\n1. Open home. Expected: Home is visible.',
    }),
  );
  assert.match(text, /MINOR/);
  assert.match(text, /BLOCKER/);
  assert.match(text, /Stop and ask in chat/);
  assert.match(text, /create_pr_for_review/);
  assert.match(text, /ask_before_pr/);
  assert.match(text, /explicitly authorizes it/);
  assert.match(text, /A narrow minor text difference does not trigger this stop/);
  assert.doesNotMatch(text, /No pull request until/);
});

test('missing, conflicting, and unknown inputs return errors and no skill body', () => {
  const dir = tempProject();
  const cases = [
    [{}, /Provide case_id or case_text/],
    [{ case_id: '  ', case_text: '\n' }, /Provide case_id or case_text/],
    [{ case_id: 'QA-1', case_text: 'Title: Hi' }, /not both/],
    [{ case_id: 1 }, /case_id must be a string/],
    [{ case_text: 'Title: Hi', note: 'extra' }, /Unknown input: note/],
  ];
  for (const [args, pattern] of cases) {
    const outcome = callTool(dir, 'review_case', args);
    assert.equal(outcome.result.isError, true);
    assert.match(outcome.result.content[0].text, pattern);
    assert.doesNotMatch(outcome.result.content[0].text, /Review case steps/);
  }
  const blankId = instructionText(callTool(dir, 'review_case', { case_id: '  ', case_text: 'Title: Hi' }));
  assert.match(blankId, /Input mode: case_text/);
  const notObject = handleMessage(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'review_case', arguments: [] },
    },
    dir,
  );
  assert.equal(notObject.result.isError, true);
  assert.match(notObject.result.content[0].text, /Tool arguments must be an object/);
});

test('init template says pasted case text does not need a case tool', () => {
  const dir = tempProject();
  runInit([], { cwd: dir, ...quiet });
  const text = fs.readFileSync(path.join(dir, '.e2e-qa-pilot', 'settings.md'), 'utf8');
  assert.match(text, /Pasted case text does not use them/);
  const copied = fs.readFileSync(
    path.join(dir, '.e2e-qa-pilot', 'processes', 'create-e2e', 'commands', 'review-case', 'SKILL.md'),
    'utf8',
  );
  assert.match(copied, /case_text/);
  const stub = fs.readFileSync(path.join(dir, '.cursor', 'skills', 'review-case', 'SKILL.md'), 'utf8');
  assert.match(stub, /commands\/review-case\/SKILL.md/);
});

test('init and --force leave an old settings file unchanged while case_text still returns instructions', () => {
  const dir = tempProject();
  const settings = path.join(dir, '.e2e-qa-pilot', 'settings.md');
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  const original = '# Settings\n\nfigma: off\n';
  fs.writeFileSync(settings, original);
  runInit([], { cwd: dir, ...quiet });
  runInit(['--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(settings, 'utf8'), original);
  const text = instructionText(callTool(dir, 'review_case', { case_text: 'Title: Sign in\n' }));
  assert.match(text, /Input mode: case_text/);
  assert.match(text, /Do not call fetch_case/);
  assert.equal(fs.readFileSync(settings, 'utf8'), original);
});

test('mcp rejects a non-object message and keeps serving', async (t) => {
  const dir = tempProject();
  let child;
  t.after(async () => {
    await stopChild(child);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const session = mcpSession(
    dir,
    [
      null,
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
    ],
    2,
    { stderrIncludes: 'Parse error' },
  );
  child = session.child;
  const { lines, stderr } = await session.result;
  assert.equal(lines[0].id, null);
  assert.equal(lines[0].error.code, -32700);
  assert.match(stderr, /Parse error/);
  assert.equal(lines[1].result.serverInfo.name, 'e2e-qa-pilot');
});

test('init keeps project rules and package instructions apart from a local command edit', () => {
  // Installer contract. It does not prove that an assistant follows Project rules.
  const dir = tempProject();
  const settingsPath = path.join(dir, '.e2e-qa-pilot', 'settings.md');
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  const original = [
    '# Settings',
    '',
    'branch_pattern: e2e/from-key',
    '',
    '## Project rules',
    '',
    'Branch: `qa/{title_slug}`',
    '',
  ].join('\n');
  fs.writeFileSync(settingsPath, original);
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(settingsPath, 'utf8'), original);

  const text = instructionText(callTool(dir, 'add_from_steps', { case_text: 'Title: Sign in\n' }));
  assert.match(text, /## Project rules/);
  assert.match(text, /Branch: `qa\/\{title_slug\}`/);
  assert.match(text, /Do not merge a branch line with `branch_pattern`/);

  const localSkill = path.join(
    dir,
    '.e2e-qa-pilot',
    'processes',
    'create-e2e',
    'commands',
    'add-from-steps',
    'SKILL.md',
  );
  const markedSkill = path.join(
    dir,
    '.e2e-qa-pilot',
    'processes',
    'create-e2e',
    'commands',
    'add-from-design',
    'SKILL.md',
  );
  fs.writeFileSync(localSkill, 'OLD LOCAL SKILL\n');
  fs.writeFileSync(markedSkill, `custom marked skill\n${MARKER_LINE}\n`);
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(localSkill, 'utf8'), 'OLD LOCAL SKILL\n');
  const refreshed = fs.readFileSync(markedSkill, 'utf8');
  assert.match(refreshed, /workflow\.md/);
  assert.doesNotMatch(refreshed, /custom marked skill/);
  const again = instructionText(callTool(dir, 'add_from_steps', { case_text: 'Title: Sign in\n' }));
  assert.match(again, /Do not merge a branch line with `branch_pattern`/);
  assert.doesNotMatch(again, /OLD LOCAL SKILL/);
  assert.equal(fs.readFileSync(settingsPath, 'utf8'), original);
});

test('init writes project.md once and never overwrites it, even with --force', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const file = path.join(dir, '.e2e-qa-pilot', 'project.md');
  const template = fs.readFileSync(file, 'utf8');
  for (const heading of [
    '## Ticket',
    '## Branch & commit',
    '## Case tool',
    '## Design',
    '## Feature flags',
    '## Context repos',
    '## Test layout',
    '## Rules',
  ]) {
    assert.ok(template.includes(heading), `project.md template lacks ${heading}`);
  }
  fs.writeFileSync(file, '## Ticket\n\nTracker: Plane.\n');
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(file, 'utf8'), '## Ticket\n\nTracker: Plane.\n');
});

test('both editors get the same always-on instruction', () => {
  const dir = tempProject();
  runInit([], { cwd: dir, ...quiet });
  const rule = fs.readFileSync(path.join(dir, '.cursor', 'rules', 'e2e-qa-pilot.mdc'), 'utf8');
  const claude = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(rule, /^---\n[\s\S]*alwaysApply: true[\s\S]*---/);
  assert.match(rule, /\.e2e-qa-pilot\/project\.md/);
  assert.match(claude, /<!-- e2e-qa-pilot:begin -->/);
  assert.match(claude, /<!-- e2e-qa-pilot:end -->/);
  const body = fs
    .readFileSync(new URL('../templates/always-on.md', import.meta.url), 'utf8')
    .trim();
  assert.ok(rule.includes(body));
  assert.ok(claude.includes(body));
});

test('init adds the CLAUDE.md block without touching other text, and --force replaces only the block', () => {
  const dir = tempProject();
  const file = path.join(dir, 'CLAUDE.md');
  const mine = '# My project\n\nAlways use pnpm.\n';
  fs.writeFileSync(file, mine);
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const added = fs.readFileSync(file, 'utf8');
  assert.ok(added.startsWith(mine));
  assert.equal(added.split('<!-- e2e-qa-pilot:begin -->').length, 2);

  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(file, 'utf8'), added);

  const edited = added.replace(
    /<!-- e2e-qa-pilot:begin -->[\s\S]*<!-- e2e-qa-pilot:end -->/,
    '<!-- e2e-qa-pilot:begin -->\nOLD BLOCK\n<!-- e2e-qa-pilot:end -->',
  );
  fs.writeFileSync(file, `${edited}\nTail kept.\n`);
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  assert.match(fs.readFileSync(file, 'utf8'), /OLD BLOCK/);
  runInit(['--integration', 'claude', '--force'], { cwd: dir, ...quiet });
  const forced = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(forced, /OLD BLOCK/);
  assert.ok(forced.startsWith(mine));
  assert.match(forced, /Tail kept\./);
  assert.equal(forced.split('<!-- e2e-qa-pilot:begin -->').length, 2);
});

test('--force refreshes the Cursor rule only while it has the marker', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const rule = path.join(dir, '.cursor', 'rules', 'e2e-qa-pilot.mdc');
  fs.writeFileSync(rule, 'my own rule\n');
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(rule, 'utf8'), 'my own rule\n');
  fs.writeFileSync(rule, `old\n${MARKER_LINE}\n`);
  runInit(['--integration', 'cursor', '--force'], { cwd: dir, ...quiet });
  assert.match(fs.readFileSync(rule, 'utf8'), /alwaysApply: true/);
});

test('case tools return the project file, and say when it is missing', () => {
  const dir = tempProject();
  const missing = instructionText(callTool(dir, 'review_case', { case_text: 'Title: Sign in\n' }));
  assert.match(missing, /## Project file \(\.e2e-qa-pilot\/project\.md\)/);
  assert.match(missing, /missing: \.e2e-qa-pilot\/project\.md/);
  assert.match(missing, /## Shared: project-config\.md/);

  const file = path.join(dir, '.e2e-qa-pilot', 'project.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '## Branch & commit\n\nBranch: `DEV_{ticket_id}[_{case_id}]_{title_slug}`\n');
  for (const tool of ['review_case', 'add_from_steps', 'add_from_design']) {
    const text = instructionText(callTool(dir, tool, { case_text: 'Title: Sign in\n' }));
    assert.match(text, /Branch: `DEV_\{ticket_id\}\[_\{case_id\}\]_\{title_slug\}`/, tool);
  }
});

test('setup_project takes no input and returns the setup instructions', () => {
  const dir = tempProject();
  const text = instructionText(callTool(dir, 'setup_project', {}));
  assert.match(text, /# e2e-qa-pilot: setup_project/);
  assert.match(text, /Set up the project file/);
  assert.match(text, /## Shared: project-config\.md/);
  assert.doesNotMatch(text, /Input mode:/);
  assert.match(text, /Never paste a secret/);

  const omitted = instructionText(
    handleMessage(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'setup_project' } },
      dir,
    ),
  );
  assert.match(omitted, /Set up the project file/);

  const rejected = callTool(dir, 'setup_project', { case_id: 'QA-1' });
  assert.equal(rejected.result.isError, true);
  assert.match(rejected.result.content[0].text, /takes no input/);
});

test('the instructions cover the optional case id, read-only flags, and read-only context repos', () => {
  // Reads Markdown. It does not prove an assistant follows the instructions.
  const dir = tempProject();
  const steps = instructionText(callTool(dir, 'add_from_steps', { case_text: 'Title: Sign in\n' }));
  assert.match(steps, /Optional group/);
  assert.match(steps, /\{ticket_id\}\[_\{case_id\}\]_\{title_slug\}/);
  const review = instructionText(callTool(dir, 'review_case', { case_text: 'Title: Sign in\n' }));
  assert.match(review, /Feature flag: <key> = on\|off/);
  assert.match(review, /Never create, change, or toggle a flag/);
  assert.match(review, /Never clone, check out, commit to, push to, comment on, or open a pull request/);
});

test('CLAUDE.md block: a begin marker with no end marker is left alone, a stray end marker is ignored', () => {
  const dir = tempProject();
  const file = path.join(dir, 'CLAUDE.md');

  const broken = 'Mine\n<!-- e2e-qa-pilot:begin -->\nhalf a block, then my own notes\n';
  fs.writeFileSync(file, broken);
  runInit(['--integration', 'claude', '--force'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(file, 'utf8'), broken);

  const stray = 'Quote: <!-- e2e-qa-pilot:end --> in my notes\n';
  fs.writeFileSync(file, stray);
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const once = fs.readFileSync(file, 'utf8');
  assert.ok(once.startsWith(stray));
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(file, 'utf8'), once);
});

test('setup_project rejects any argument that is not an empty object', () => {
  const dir = tempProject();
  for (const args of ['QA-1', ['QA-1'], 5, { case_id: 'QA-1' }]) {
    const outcome = callTool(dir, 'setup_project', args);
    assert.equal(outcome.result.isError, true, JSON.stringify(args));
  }
  assert.equal(callTool(dir, 'setup_project', {}).result.isError, undefined);
});

test('setup_project includes the project.md template when the file is missing', () => {
  const dir = tempProject();
  const text = instructionText(callTool(dir, 'setup_project', {}));
  assert.match(text, /Write it from this template/);
  assert.match(text, /^## Feature flags$/m);
  assert.doesNotMatch(text, /ask the person to run setup_project/);
  const caseText = instructionText(callTool(dir, 'review_case', { case_text: 'Title: Sign in\n' }));
  assert.doesNotMatch(caseText, /Write it from this template/);
  assert.match(caseText, /ask the person to run setup_project/);
});

const REVIEW_SKILL = '.e2e-qa-pilot/processes/create-e2e/commands/review-case/SKILL.md';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('init writes a manifest that lists managed files and never the person\'s files', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const manifest = readManifest(dir);
  assert.equal(manifest.schema, 1);
  assert.deepEqual(manifest.integrations, ['cursor']);
  assert.equal(manifest.package_version, readJson(path.join(cli, '..', '..', 'package.json')).version);
  assert.equal(
    manifest.files[REVIEW_SKILL],
    hashText(fs.readFileSync(path.join(dir, REVIEW_SKILL), 'utf8')),
  );
  assert.ok(manifest.files['.cursor/rules/e2e-qa-pilot.mdc']);
  assert.equal(manifest.files['.e2e-qa-pilot/settings.md'], undefined);
  assert.equal(manifest.files['.e2e-qa-pilot/project.md'], undefined);
  assert.ok(manifest.templates.project_headings.includes('Ticket'));

  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const both = readManifest(dir);
  assert.deepEqual(both.integrations, ['cursor', 'claude']);
  assert.ok(both.files['CLAUDE.md']);
  assert.ok(both.files['.claude/skills/review-case/SKILL.md']);
});

test('upgrade replaces untouched files, keeps edited ones, and never touches settings or project.md', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const settings = path.join(dir, '.e2e-qa-pilot', 'settings.md');
  const project = path.join(dir, '.e2e-qa-pilot', 'project.md');
  fs.appendFileSync(settings, '\ntest_command: npx playwright test\n');
  fs.appendFileSync(project, '\nmy own note\n');
  const settingsBefore = fs.readFileSync(settings, 'utf8');
  const projectBefore = fs.readFileSync(project, 'utf8');

  // An older package wrote this skill: the disk matches the manifest, so upgrade may replace it.
  const old = path.join(dir, REVIEW_SKILL);
  fs.writeFileSync(old, 'OLD PACKAGE SKILL\n');
  // The person edited this one: the disk does not match the manifest.
  const edited = path.join(dir, '.cursor', 'skills', 'add-from-steps', 'SKILL.md');
  const editedText = `${fs.readFileSync(edited, 'utf8')}\nmy edit\n`;
  fs.writeFileSync(edited, editedText);
  const manifest = readManifest(dir);
  manifest.files[REVIEW_SKILL] = hashText('OLD PACKAGE SKILL\n');
  manifest.package_version = '0.0.1';
  writeManifest(dir, manifest);

  const lines = [];
  runUpgrade([], { cwd: dir, log: (line) => lines.push(line) });
  assert.match(fs.readFileSync(old, 'utf8'), /Review case steps/);
  assert.equal(fs.readFileSync(edited, 'utf8'), editedText);
  assert.ok(fs.existsSync(`${edited}.new`));
  assert.match(lines.join('\n'), /kept \.cursor\/skills\/add-from-steps\/SKILL\.md/);
  assert.equal(fs.readFileSync(settings, 'utf8'), settingsBefore);
  assert.equal(fs.readFileSync(project, 'utf8'), projectBefore);
  assert.equal(readManifest(dir).package_version, readJson(path.join(cli, '..', '..', 'package.json')).version);

  runUpgrade(['--force'], { cwd: dir, ...quiet });
  assert.notEqual(fs.readFileSync(edited, 'utf8'), editedText);
  assert.equal(fs.readFileSync(settings, 'utf8'), settingsBefore);
});

test('upgrade keeps an edited CLAUDE.md block until --force, and never touches the text around it', () => {
  const dir = tempProject();
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'My notes\n');
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const file = path.join(dir, 'CLAUDE.md');
  const edited = fs.readFileSync(file, 'utf8').replace('Do not ask what', 'Please ask what');
  fs.writeFileSync(file, edited);

  runUpgrade([], { cwd: dir, ...quiet });
  assert.equal(fs.readFileSync(file, 'utf8'), edited);
  runUpgrade(['--force'], { cwd: dir, ...quiet });
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(after.startsWith('My notes\n'));
  assert.match(after, /Do not ask what/);
});

test('upgrade removes a file the package no longer ships, unless the person edited it', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const gone = '.e2e-qa-pilot/processes/create-e2e/commands/old/SKILL.md';
  const kept = '.e2e-qa-pilot/processes/create-e2e/commands/older/SKILL.md';
  for (const rel of [gone, kept]) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), `${rel}\n`);
  }
  const manifest = readManifest(dir);
  manifest.files[gone] = hashText(`${gone}\n`);
  manifest.files[kept] = hashText('what the package wrote\n');
  writeManifest(dir, manifest);
  runUpgrade([], { cwd: dir, ...quiet });
  assert.equal(fs.existsSync(path.join(dir, gone)), false);
  assert.equal(fs.existsSync(path.join(dir, kept)), true);
});

test('upgrade names the project sections and settings keys added since the install', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const manifest = readManifest(dir);
  manifest.templates.project_headings = manifest.templates.project_headings.filter((name) => name !== 'Rules');
  writeManifest(dir, manifest);
  const project = path.join(dir, '.e2e-qa-pilot', 'project.md');
  fs.writeFileSync(project, fs.readFileSync(project, 'utf8').replace(/## Rules[\s\S]*$/, ''));

  const lines = [];
  runUpgrade([], { cwd: dir, log: (line) => lines.push(line) });
  assert.match(lines.join('\n'), /todo: .*project\.md: new optional section "## Rules"/);

  const second = [];
  runUpgrade([], { cwd: dir, log: (line) => second.push(line) });
  assert.doesNotMatch(second.join('\n'), /todo:/);
});

test('upgrade needs a usable manifest from this or an older schema', () => {
  const dir = tempProject();
  assert.throws(() => runUpgrade([], { cwd: dir, ...quiet }), /Run "npx e2e-qa-pilot init" first/);
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const manifest = readManifest(dir);
  manifest.schema = 99;
  writeManifest(dir, manifest);
  assert.throws(() => runUpgrade([], { cwd: dir, ...quiet }), /newer than this e2e-qa-pilot understands/);
  fs.writeFileSync(path.join(dir, MANIFEST_FILE), 'not json');
  assert.throws(() => runUpgrade([], { cwd: dir, ...quiet }), /No usable/);
  assert.throws(() => runUpgrade(['--integration', 'cursor'], { cwd: dir, ...quiet }), /Unknown argument/);
});

test('a tool result says to run upgrade when the project files come from another version', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const fresh = instructionText(callTool(dir, 'review_case', { case_text: 'Title: Sign in\n' }));
  assert.doesNotMatch(fresh, /npx e2e-qa-pilot upgrade/);
  const manifest = readManifest(dir);
  manifest.package_version = '0.0.1';
  writeManifest(dir, manifest);
  for (const [tool, args] of [
    ['review_case', { case_text: 'Title: Sign in\n' }],
    ['setup_project', {}],
  ]) {
    const text = instructionText(callTool(dir, tool, args));
    assert.match(text, /installed by e2e-qa-pilot 0\.0\.1/, tool);
    assert.match(text, /npx e2e-qa-pilot upgrade/, tool);
  }
});

test('init does not hide old files: it keeps the old version in the manifest until they are current', () => {
  const dir = tempProject();
  runInit(['--integration', 'cursor'], { cwd: dir, ...quiet });
  const skill = path.join(dir, REVIEW_SKILL);
  fs.writeFileSync(skill, 'OLD PACKAGE SKILL\n');
  const manifest = readManifest(dir);
  manifest.package_version = '0.0.1';
  manifest.files[REVIEW_SKILL] = hashText('OLD PACKAGE SKILL\n');
  writeManifest(dir, manifest);
  const lines = [];
  runInit(['--integration', 'cursor'], { cwd: dir, log: (line) => lines.push(line) });
  assert.equal(readManifest(dir).package_version, '0.0.1');
  assert.match(lines.join('\n'), /Run "npx e2e-qa-pilot upgrade"/);
  assert.equal(fs.readFileSync(skill, 'utf8'), 'OLD PACKAGE SKILL\n');
});
