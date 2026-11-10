import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInit } from '../src/init.mjs';
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
    for (const name of ['review-case', 'add-from-steps', 'add-from-design']) {
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

test('mcp lists three tools and returns instructions', async (t) => {
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
    ['review_case', 'add_from_steps', 'add_from_design'],
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
    ['review_case', 'add_from_steps', 'add_from_design'],
  );
  for (const tool of listed.result.tools) {
    assert.equal(tool.inputSchema.type, 'object');
    assert.deepEqual(tool.inputSchema.required, []);
    assert.equal(tool.inputSchema.additionalProperties, false);
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
  assert.match(refreshed, /Workflow resolution/);
  assert.doesNotMatch(refreshed, /custom marked skill/);
  const again = instructionText(callTool(dir, 'add_from_steps', { case_text: 'Title: Sign in\n' }));
  assert.match(again, /Do not merge a branch line with `branch_pattern`/);
  assert.doesNotMatch(again, /OLD LOCAL SKILL/);
  assert.equal(fs.readFileSync(settingsPath, 'utf8'), original);
});
