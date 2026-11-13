import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Installs the packed tarball and talks to that copy over stdio.
// These stdio checks do not prove Cursor or Claude Code compatibility.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESPONSE_TIMEOUT_MS = 2000;
const EXIT_TIMEOUT_MS = 2000;

const RUNTIME_FILES = [
  'package.json',
  'bin/cli.mjs',
  'src/init.mjs',
  'src/mcp.mjs',
  'src/kit.mjs',
  'src/manifest.mjs',
  'templates/settings.md',
  'templates/project.md',
  'templates/always-on.md',
];

function walkFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walkFiles(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

function npm(args, cwd) {
  return execFileSync('npm', args, { cwd, encoding: 'utf8' });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
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

function withStderr(message, stderr) {
  const detail = stderr.trim();
  return detail ? `${message}\nstderr:\n${detail}` : message;
}

// Collect `expectedCount` JSON-RPC replies from the packed MCP server.
//
// Polling stdout alone hides a crash. A missing runtime file makes the child
// exit before those replies, and its stack trace is written to stderr. This
// waiter surfaces that crash instead of waiting out the timeout:
//
// - Child closes first: reject immediately with the exit code or signal, how
//   many replies arrived, and the full stderr. The 'close' event is used
//   rather than 'exit' because Node emits 'close' only after the stderr pipe
//   has ended, so the stack trace is already in `stderr`.
// - Stdout line is not JSON: remember the parse error in the 'data' handler
//   and reject from this waiter. Do not throw inside 'data'. A throw there
//   becomes an uncaught exception and never fails this promise.
// - Still short of replies when the timer fires: reject with the reply count
//   and whatever stderr was captured. The process may still be running.
//
// Returns `{ lines, stderr, exit }`. `exit` is set when 'close' has already
// fired. The caller must not listen for 'exit' or 'close' in that case: those
// events do not replay, and a second wait would sit until its own timeout.
function waitForMcpResponses(child, messages, expectedCount) {
  const lines = [];
  let buffer = '';
  let stderr = '';
  let parseError;
  let exitState;
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const parts = buffer.split('\n');
    buffer = parts.pop();
    for (const part of parts) {
      if (!part) continue;
      try {
        lines.push(JSON.parse(part));
      } catch (error) {
        parseError = error instanceof Error ? error : new Error(String(error));
      }
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  // A crash closes this pipe before the requests are written. Swallow that
  // EPIPE. The exit path below is the failure that should reach the test.
  child.stdin.on('error', () => {});
  for (const message of messages) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let poll;
    const stop = () => {
      settled = true;
      clearInterval(poll);
      clearTimeout(timer);
      child.off('close', onClose);
    };
    const fail = (message) => {
      if (settled) return;
      stop();
      reject(new Error(withStderr(message, stderr)));
    };
    const succeed = () => {
      if (settled) return;
      stop();
      resolve({ lines, stderr, exit: exitState });
    };
    const onClose = (code, signal) => {
      exitState = { code, signal };
      if (settled) return;
      if (parseError) {
        fail(`MCP stdout line was not JSON: ${parseError.message}`);
        return;
      }
      if (lines.length >= expectedCount) {
        succeed();
        return;
      }
      const how = signal ? `signal ${signal}` : `code ${code}`;
      fail(`MCP process exited before ${expectedCount} responses (${how}), got ${lines.length}`);
    };
    const timer = setTimeout(() => {
      if (parseError) {
        fail(`MCP stdout line was not JSON: ${parseError.message}`);
        return;
      }
      fail(`timed out waiting for ${expectedCount} MCP responses, got ${lines.length}`);
    }, RESPONSE_TIMEOUT_MS);
    child.on('close', onClose);
    poll = setInterval(() => {
      if (parseError) {
        fail(`MCP stdout line was not JSON: ${parseError.message}`);
        return;
      }
      if (lines.length >= expectedCount) succeed();
    }, 20);
  });
}

test('packed tarball installs offline and serves init and mcp', async (t) => {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-qa-pilot-pack-'));
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-qa-pilot-app-'));
  let child;
  t.after(async () => {
    await stopChild(child);
    removeDir(stage);
    removeDir(app);
  });

  const packedJson = npm(['pack', '--json', '--pack-destination', stage], repoRoot);
  const [packed] = JSON.parse(packedJson);
  const packedPaths = new Set(packed.files.map((file) => file.path));
  const createE2e = walkFiles(path.join(repoRoot, 'processes', 'create-e2e')).map((file) =>
    path.relative(repoRoot, file).split(path.sep).join('/'),
  );
  for (const file of [...RUNTIME_FILES, ...createE2e]) {
    assert.ok(packedPaths.has(file), `tarball is missing runtime file ${file}`);
  }
  for (const file of packedPaths) {
    assert.ok(!file.startsWith('test/'), `tarball contains ${file}`);
    assert.ok(!file.startsWith('examples/'), `tarball contains ${file}`);
  }

  const tarball = path.join(stage, packed.filename);
  npm(
    ['install', '--offline', '--no-audit', '--no-fund', '--ignore-scripts', tarball],
    app,
  );

  const rootPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const installedPkg = JSON.parse(
    fs.readFileSync(path.join(app, 'node_modules', 'e2e-qa-pilot', 'package.json'), 'utf8'),
  );
  assert.equal(installedPkg.version, rootPkg.version);
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    assert.equal(installedPkg[field], undefined, `installed package.json has ${field}`);
  }

  const version = execFileSync(
    process.execPath,
    ['node_modules/e2e-qa-pilot/bin/cli.mjs', '--version'],
    { cwd: app, encoding: 'utf8' },
  ).trim();
  assert.equal(version, rootPkg.version);

  const cli = ['node_modules/e2e-qa-pilot/bin/cli.mjs'];
  execFileSync(process.execPath, [...cli, 'init', '--integration', 'cursor'], {
    cwd: app,
    encoding: 'utf8',
  });
  const mcpFile = path.join(app, '.cursor', 'mcp.json');
  const created = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
  assert.deepEqual(created.mcpServers['e2e-qa-pilot'], {
    command: 'npx',
    args: ['-y', 'e2e-qa-pilot', 'mcp'],
  });

  const settingsFile = path.join(app, '.e2e-qa-pilot', 'settings.md');
  const keptSettings = 'case_tool: kept\n';
  const keptMcp = `${JSON.stringify({
    mcpServers: { 'e2e-qa-pilot': { command: 'old' }, qase: { command: 'x' } },
  })}\n`;
  fs.writeFileSync(settingsFile, keptSettings);
  fs.writeFileSync(mcpFile, keptMcp);
  execFileSync(process.execPath, [...cli, 'init', '--integration', 'cursor'], {
    cwd: app,
    encoding: 'utf8',
  });
  assert.equal(fs.readFileSync(settingsFile, 'utf8'), keptSettings);
  assert.equal(fs.readFileSync(mcpFile, 'utf8'), keptMcp);

  const skill = fs.readFileSync(
    path.join(
      app,
      'node_modules',
      'e2e-qa-pilot',
      'processes',
      'create-e2e',
      'commands',
      'review-case',
      'SKILL.md',
    ),
    'utf8',
  );
  const skillLine = 'This skill does not write a spec and does not create a second case.';
  assert.ok(skill.includes(skillLine));

  child = spawn(process.execPath, [...cli, 'mcp'], {
    cwd: app,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const messages = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'review_case',
        arguments: { case_text: 'Title: Sign in\n\n1. Open home. Expected: Home is visible.' },
      },
    },
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'review_case', arguments: { case_id: 'QA-1', case_text: 'Title: Sign in' } },
    },
  ];
  // See waitForMcpResponses: a crash fails here with stderr, not after a silent timeout.
  const { lines, stderr, exit } = await waitForMcpResponses(child, messages, messages.length);

  const byId = Object.fromEntries(lines.map((line) => [line.id, line]));
  assert.equal(byId[1].result.serverInfo.name, 'e2e-qa-pilot');
  assert.deepEqual(
    byId[2].result.tools.map((tool) => tool.name),
    ['review_case', 'add_from_steps', 'add_from_design', 'setup_project'],
  );
  for (const tool of byId[2].result.tools) {
    assert.deepEqual(tool.inputSchema.required, []);
  }
  assert.match(byId[3].result.content[0].text, /Input mode: case_text/);
  assert.match(byId[3].result.content[0].text, new RegExp(skillLine.replace(/[.]/g, '\\.')));
  assert.equal(byId[3].result.isError, undefined);
  assert.equal(byId[4].result.isError, true);

  // `exit` is already set when the child died during the replies above.
  // Listening for 'exit' again would wait forever: the event does not replay.
  const exitCode = exit
    ? exit.code
    : await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(withStderr('MCP process did not exit after stdin closed', stderr)));
        }, EXIT_TIMEOUT_MS);
        child.once('exit', (code) => {
          clearTimeout(timeout);
          resolve(code);
        });
        child.stdin.end();
      });
  assert.equal(exitCode, 0);
  if (exit) assert.equal(exit.signal, null);
});

test('a crashed MCP process fails immediately and includes stderr', async (t) => {
  const child = spawn(
    process.execPath,
    ['-e', 'console.error("missing runtime file"); process.exit(1)'],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );
  t.after(() => stopChild(child));
  const started = Date.now();
  await assert.rejects(
    waitForMcpResponses(child, [{ jsonrpc: '2.0', id: 1, method: 'initialize' }], 1),
    (error) => {
      assert.match(error.message, /exited before 1 responses \(code 1\), got 0/);
      assert.match(error.message, /stderr:\nmissing runtime file/);
      assert.ok(Date.now() - started < RESPONSE_TIMEOUT_MS);
      return true;
    },
  );
});

test('a non-JSON MCP stdout line fails the waiter instead of throwing', async (t) => {
  const child = spawn(process.execPath, ['-e', 'console.log("not-json")'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => stopChild(child));
  await assert.rejects(
    waitForMcpResponses(child, [], 1),
    /MCP stdout line was not JSON/,
  );
});
