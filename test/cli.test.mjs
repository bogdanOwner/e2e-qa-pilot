import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInit } from '../src/init.mjs';
import { handleMessage } from '../src/mcp.mjs';

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
  assert.ok(fs.existsSync(path.join(dir, '.e2e-qa-pilot', 'settings.md')));
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
  return new Promise((resolve, reject) => {
    let poll;
    const timeout = setTimeout(() => {
      clearInterval(poll);
      child.kill();
      reject(new Error(`timed out waiting for ${expectedLines} MCP responses, got ${lines.length}`));
    }, 2000);
    poll = setInterval(() => {
      const stderrReady = stderrIncludes === undefined || stderr.includes(stderrIncludes);
      if (lines.length >= expectedLines && stderrReady) {
        clearInterval(poll);
        clearTimeout(timeout);
        child.kill();
        resolve({ lines, stderr });
      }
    }, 20);
  });
}

test('mcp lists three tools and returns instructions', async () => {
  const dir = tempProject();
  runInit(['--integration', 'claude'], { cwd: dir, ...quiet });
  const { lines } = await mcpSession(
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

test('mcp rejects a non-object message and keeps serving', async () => {
  const dir = tempProject();
  const { lines, stderr } = await mcpSession(
    dir,
    [
      null,
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
    ],
    2,
    { stderrIncludes: 'Parse error' },
  );
  assert.equal(lines[0].id, null);
  assert.equal(lines[0].error.code, -32700);
  assert.match(stderr, /Parse error/);
  assert.equal(lines[1].result.serverInfo.name, 'e2e-qa-pilot');
});
