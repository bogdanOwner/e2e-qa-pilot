import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { kitRoot, CATALOG, listFiles } from '../src/kit.mjs';
import { serverEntry } from '../src/init.mjs';
import { handleMessage } from '../src/mcp.mjs';

// Documentation consistency checks.
//
// These compare the Markdown documents with the code, the package metadata, and
// each other. They are NOT behavioral or integration tests. They do not run
// Cursor or Claude Code, and they do not show that an assistant follows the
// instructions. Behavioral tests of init and the MCP server are in cli.test.mjs.
//
// They check facts (names, keys, links, entries, examples), not exact prose.

const rootFile = (name) => path.join(kitRoot, name);
const readRoot = (name) => fs.readFileSync(rootFile(name), 'utf8');

const pkg = JSON.parse(readRoot('package.json'));
const readme = readRoot('README.md');
const mcpDoc = readRoot('mcp.md');

const markdownFiles = [
  ...['README.md', 'mcp.md'].map(rootFile),
  ...listFiles(path.join(kitRoot, 'processes')).filter((file) => file.endsWith('.md')),
];

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, '');
}

function fencedBlocks(text, lang) {
  const found = [];
  const pattern = new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'g');
  for (const match of text.matchAll(pattern)) found.push(match[1]);
  return found;
}

function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]/gu, '')
    .replace(/ /g, '-');
}

function anchorsOf(text) {
  return new Set(
    [...stripFences(text).matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => slug(match[1])),
  );
}

function callTool(args, name = 'review_case') {
  return handleMessage(
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } },
    kitRoot,
  );
}

test('docs: every relative link and anchor resolves', () => {
  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of stripFences(text).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      // Skip external URLs and template placeholders such as <case-url>.
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('<')) continue;
      const [rel, anchor] = target.split('#');
      const resolved = rel ? path.resolve(path.dirname(file), rel) : file;
      const shown = `${path.relative(kitRoot, file)} -> ${target}`;
      assert.ok(fs.existsSync(resolved), `broken link: ${shown}`);
      if (anchor && resolved.endsWith('.md')) {
        const anchors = anchorsOf(fs.readFileSync(resolved, 'utf8'));
        assert.ok(anchors.has(anchor), `missing anchor: ${shown}`);
      }
    }
  }
});

test('docs: links in the packaged README and mcp.md point at files that npm ships', () => {
  const shipped = new Set(['LICENSE', 'package.json', ...pkg.files]);
  for (const name of ['README.md', 'mcp.md']) {
    const file = rootFile(name);
    for (const match of stripFences(fs.readFileSync(file, 'utf8')).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const [rel] = match[1].split('#');
      if (!rel || /^[a-z][a-z0-9+.-]*:/i.test(rel)) continue;
      const fromRoot = path.relative(kitRoot, path.resolve(path.dirname(file), rel));
      const covered = [...shipped].some((entry) => fromRoot === entry || fromRoot.startsWith(`${entry}/`));
      assert.ok(covered, `${name} links to ${fromRoot}, which package.json "files" does not include`);
    }
  }
});

test('docs: the tool names in the docs match the catalog the server publishes', () => {
  const tools = new Set(CATALOG.map((entry) => entry.tool));
  const listed = handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, kitRoot);
  assert.deepEqual(new Set(listed.result.tools.map((tool) => tool.name)), tools);

  for (const [name, text] of [['README.md', readme], ['mcp.md', mcpDoc]]) {
    for (const tool of tools) assert.ok(text.includes(`\`${tool}\``), `${name} does not mention ${tool}`);
    const mentioned = new Set(stripFences(text).match(/\b(?:review|add_from)_[a-z_]+\b/g) ?? []);
    for (const word of mentioned) assert.ok(tools.has(word), `${name} mentions unknown tool ${word}`);
  }
});

test('docs: the input contract is stated, and the example calls follow it', () => {
  // The contract lives in mcp.md. The README is a landing page and links to it.
  assert.match(mcpDoc, /exactly one of `case_id` or `case_text`/);
  assert.match(readme, /\]\(mcp\.md/);

  const calls = fencedBlocks(mcpDoc, 'json')
    .map((block) => JSON.parse(block))
    .filter((block) => block.name && block.arguments);
  const outcomes = calls.map((call) => {
    const filled = ['case_id', 'case_text'].filter((key) => String(call.arguments[key] ?? '').trim());
    const outcome = callTool(call.arguments, call.name);
    // The rule under test: exactly one filled field returns instructions, anything else is a tool error.
    assert.equal(Boolean(outcome.result.isError), filled.length !== 1, JSON.stringify(call));
    return Boolean(outcome.result.isError);
  });
  assert.ok(outcomes.includes(true) && outcomes.includes(false), 'mcp.md needs a valid and an invalid example call');
});

test('docs: the pasted-case example in the README is well formed and accepted', () => {
  const example = fencedBlocks(readme, 'text').find((block) => /^Title:/m.test(block));
  assert.ok(example, 'README has no pasted-case example with a Title: line');
  assert.match(example, /^Preconditions:/m);
  const steps = example.match(/^\d+\./gm) ?? [];
  const expected = example.match(/Expected:/g) ?? [];
  assert.ok(steps.length > 0);
  assert.equal(expected.length, steps.length, 'every step in the example needs an Expected: result');

  const outcome = callTool({ case_text: example });
  assert.equal(outcome.result.isError, undefined);
  assert.match(outcome.result.content[0].text, /Input mode: case_text/);
});

test('docs: the MCP entry shown in mcp.md is the entry init writes', () => {
  const configs = fencedBlocks(mcpDoc, 'json')
    .map((block) => JSON.parse(block))
    .filter((block) => block.mcpServers);
  assert.ok(configs.length > 0, 'mcp.md shows no MCP entry');
  for (const config of configs) assert.deepEqual(config.mcpServers[pkg.name], serverEntry);
});

test('docs: install commands use the package name from package.json', () => {
  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const pattern = /(?:npx(?: -y)?|npm install -g|claude mcp add) ([a-z][\w.@/-]*)/g;
    for (const match of text.matchAll(pattern)) {
      assert.equal(match[1], pkg.name, `${path.relative(kitRoot, file)}: "${match[0]}"`);
    }
  }
});

test('docs: settings keys in the template are listed in the README and the review-case command', () => {
  const template = readRoot(path.join('templates', 'settings.md'));
  const keys = new Set([...template.matchAll(/^([a-z][a-z_]*):/gm)].map((match) => match[1]));
  assert.ok(keys.size > 0);
  const review = fs.readFileSync(
    path.join(kitRoot, 'processes', 'create-e2e', 'commands', 'review-case', 'SKILL.md'),
    'utf8',
  );
  for (const key of keys) {
    assert.ok(readme.includes(`\`${key}\``), `README does not list ${key}`);
    assert.ok(review.includes(`\`${key}\``), `review-case does not list ${key}`);
  }
});

test('docs: the docs do not claim features the repository does not have', () => {
  const banned = [/self-?heal/i, /slashes/i, /autonomous/i, /story kit/i];
  const texts = {
    'README.md': readme,
    'mcp.md': mcpDoc,
    'package.json description': pkg.description,
  };
  for (const [name, text] of Object.entries(texts)) {
    for (const pattern of banned) assert.doesNotMatch(text, pattern, `${name} matches ${pattern}`);
  }
});

test('docs: AutoFix nightly is labelled not implemented and has no commitments', () => {
  const autofix = fs.readFileSync(
    path.join(kitRoot, 'processes', 'autofix-nightly', 'README.md'),
    'utf8',
  );
  assert.match(autofix, /not implemented/i);
  for (const [name, text] of [['README.md', readme], ['mcp.md', mcpDoc]]) {
    const lines = text.split('\n').filter((line) => /autofix/i.test(line));
    assert.ok(lines.length > 0, `${name} does not mention AutoFix`);
    for (const line of lines) assert.match(line, /not implemented/i, `${name}: ${line}`);
  }
  assert.ok(!fs.existsSync(path.join(kitRoot, 'processes', 'autofix-nightly', 'commands')));
});

test('docs: dependency, license, and engine claims match package.json', () => {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    assert.equal(pkg[field], undefined, `package.json has ${field}`);
  }
  const sources = [...listFiles(path.join(kitRoot, 'src')), ...listFiles(path.join(kitRoot, 'bin'))];
  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/(?:from\s+|import\()\s*['"]([^'"]+)['"]/g)) {
      assert.match(match[1], /^(node:|\.)/, `${path.relative(kitRoot, file)} imports ${match[1]}`);
    }
  }

  assert.equal(pkg.license, 'MIT');
  assert.match(readRoot('LICENSE'), /^MIT License/);
  assert.match(readme, /\[MIT\]\(LICENSE\)/);

  const engine = pkg.engines.node.match(/^>=\s*(\d+)/);
  assert.ok(engine, 'package.json engines.node should be a ">=" range');
  assert.match(readme, new RegExp(`Node ${engine[1]} or later`));
});

test('docs: repository, homepage, and bugs metadata name the same GitHub repository', () => {
  const repo = String(pkg.repository?.url ?? '').match(/github\.com\/([^/]+\/[^/.]+)(?:\.git)?$/);
  assert.ok(repo, 'package.json repository.url should be a GitHub URL');
  assert.equal(pkg.repository.type, 'git');
  assert.ok(String(pkg.homepage).startsWith(`https://github.com/${repo[1]}`));
  assert.equal(pkg.bugs?.url, `https://github.com/${repo[1]}/issues`);
});
