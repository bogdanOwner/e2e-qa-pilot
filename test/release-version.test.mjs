import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  classifyNpmPublish,
  classifyNpmView,
  decideRelease,
  prepareRelease,
  setPackageVersion,
  setWorkflowDefault,
} from '../scripts/release-version.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(repoRoot, 'scripts', 'release-version.mjs');
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'publish.yml');

function release(facts) {
  const decision = decideRelease(facts);
  assert.equal(decision.ok, true, decision.message);
  return decision;
}

function refusal(facts) {
  const decision = decideRelease(facts);
  assert.equal(decision.ok, false);
  return decision.message;
}

test('first publish is the typed version and the next popup value is its patch', () => {
  const decision = release({ current: '0.1.0', requested: '0.4.0' });
  assert.equal(decision.version, '0.4.0');
  assert.equal(decision.retry, false);
  assert.equal(decision.nextDefault, '0.4.1');
});

test('an empty request while the package is still 0.1.0 is refused', () => {
  const message = refusal({ current: '0.1.0', requested: '   ' });
  assert.match(message, /Enter 0\.4\.0/);
});

test('an empty request bumps the patch, including past 9', () => {
  const decision = release({ current: '0.4.9', requested: '' });
  assert.equal(decision.version, '0.4.10');
  assert.equal(decision.nextDefault, '0.4.11');
});

test('a version that is not greater than package.json is refused', () => {
  assert.match(refusal({ current: '0.4.0', requested: '0.4.0' }), /greater than/);
  assert.match(refusal({ current: '0.4.2', requested: '0.4.1' }), /greater than/);
  assert.match(refusal({ current: '0.1.0', requested: '0.4.0;touch /tmp/pwn' }), /x\.y\.z/);
});

test('an existing tag is a retry even when main has moved on', () => {
  const decision = release({
    current: '0.4.1',
    requested: '0.4.0',
    requestedTagExists: true,
    currentTagExists: false,
  });
  assert.equal(decision.retry, true);
  assert.equal(decision.version, '0.4.0');
  assert.equal(decision.nextDefault, undefined);
});

test('a new release waits until the tagged current version is on npm', () => {
  const message = refusal({
    current: '0.4.0',
    requested: '0.4.1',
    currentTagExists: true,
    currentPublished: 'missing',
  });
  assert.match(message, /Run again with version 0\.4\.0/);
});

test('a registry failure is reported with the npm output', () => {
  const message = refusal({
    current: '0.4.0',
    requested: '0.4.1',
    currentTagExists: true,
    currentPublished: 'error',
    packageName: 'e2e-qa-pilot',
    npmError: 'npm error code E401\nnpm error Unable to authenticate',
  });
  assert.match(message, /E401/);
  assert.doesNotMatch(message, /not on npm yet/);
});

test('a tagged current version that is already published can move forward', () => {
  const decision = release({
    current: '0.4.2',
    requested: '0.5.0',
    currentTagExists: true,
    currentPublished: 'published',
  });
  assert.equal(decision.version, '0.5.0');
  assert.equal(decision.nextDefault, '0.5.1');
});

test('skipping the npm check cannot unlock the next release', () => {
  assert.match(
    refusal({
      current: '0.4.0',
      requested: '',
      currentTagExists: true,
      currentPublished: 'unchecked',
    }),
    /was not checked/,
  );
});

test('npm view distinguishes a missing version from any other failure', () => {
  assert.equal(classifyNpmView(0, '0.4.0'), 'published');
  assert.equal(
    classifyNpmView(1, 'npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/e2e-qa-pilot'),
    'missing',
  );
  assert.equal(classifyNpmView(1, 'npm error code E404\nnpm error 404 No match found for version 0.4.0'), 'missing');
  assert.equal(classifyNpmView(1, 'npm error code E401\nnpm error Unable to authenticate'), 'error');
  assert.equal(classifyNpmView(1, ''), 'error');
});

test('npm publish treats an existing version as already published and any other failure as an error', () => {
  assert.equal(classifyNpmPublish(0, ''), 'published');
  assert.equal(
    classifyNpmPublish(1, 'npm error code EPUBLISHCONFLICT\nYou cannot publish over the previously published versions'),
    'exists',
  );
  assert.equal(classifyNpmPublish(1, 'npm error code ENEEDAUTH'), 'error');
});

test('the top-level package version changes and an earlier nested version stays', () => {
  const original = `{
  "name": "example",
  "extra": {
    "version": "9.9.9"
  },
  "version": "0.1.0"
}
`;
  const updated = setPackageVersion(original, '0.4.0');
  const parsed = JSON.parse(updated);
  assert.equal(parsed.version, '0.4.0');
  assert.equal(parsed.extra.version, '9.9.9');

  const root = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8');
  const current = JSON.parse(root).version;
  const target = current === '0.4.0' ? '0.4.1' : '0.4.0';
  const next = setPackageVersion(root, target);
  const rootLines = root.split('\n');
  const nextLines = next.split('\n');
  const changed = rootLines.filter((line, index) => line !== nextLines[index]);
  assert.deepEqual(changed, [`  "version": "${current}",`]);
  assert.equal(JSON.parse(next).version, target);
});

test('the workflow default rewrite touches only the prefilled version', () => {
  const original = fs.readFileSync(workflowPath, 'utf8');
  const updated = setWorkflowDefault(original, '9.9.9');
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  const changed = updatedLines.filter((line, index) => line !== originalLines[index]);
  assert.deepEqual(changed, ['        default: "9.9.9" # release-default']);
  assert.throws(
    () => setWorkflowDefault('  default: "1.0.0" # release-default\n  default: "1.0.0" # release-default\n', '1.0.1'),
    /found 2/,
  );
  assert.throws(() => setWorkflowDefault('no default here\n', '1.0.1'), /found 0/);
});

test('prepare leaves files alone when the requested tag already exists', () => {
  const packageJson = `${JSON.stringify({ name: 'example', extra: { version: '9.9.9' }, version: '0.4.1' }, null, 2)}\n`;
  const workflowText = '        default: "0.4.2" # release-default\n';
  const prepared = prepareRelease({
    current: '0.4.1',
    requested: '0.4.0',
    requestedTagExists: true,
    packageJson,
    workflowText,
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.retry, true);
  assert.equal(prepared.packageJson, packageJson);
  assert.equal(prepared.workflowText, workflowText);
});

test('the publish workflow packs the tag and does not keep the release token for tests', () => {
  const text = fs.readFileSync(workflowPath, 'utf8');
  assert.match(text, /persist-credentials: false/);
  assert.match(text, /git archive --format=tar "v\$\{VERSION\}"/);
  assert.match(text, /cd "\$stage" && npm publish/);
  assert.doesNotMatch(text, /^\s*npm publish\s*$/m);
  assert.match(text, /git -c "http\.extraheader=/);
  assert.doesNotMatch(text, /git config[^\n]*extraheader/);
  assert.doesNotMatch(text, /credential\.helper/);
  assert.match(text, /\[ "\$GITHUB_ACTOR" != "bogdanOwner" \]/);
  const actorAt = text.indexOf('name: Require bogdanOwner');
  const secretsAt = text.indexOf('name: Require secrets');
  const testAt = text.indexOf('name: Test');
  const commitAt = text.indexOf('name: Commit and tag');
  const publishAt = text.indexOf('name: Publish to npm');
  assert.ok(actorAt !== -1 && actorAt < secretsAt && testAt < commitAt && commitAt < publishAt);
});

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function runCli(cwd, args, { env, input } = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    input,
    env: { ...process.env, ...env },
  });
}

function writeCheckout(dir) {
  fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  packageJson.version = '0.1.0';
  fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  const workflow = fs.readFileSync(workflowPath, 'utf8').replace(
    /^(\s*default: ")\d+\.\d+\.\d+(" # release-default)\s*$/m,
    (_match, prefix, suffix) => `${prefix}0.4.0${suffix}`,
  );
  fs.writeFileSync(path.join(dir, '.github', 'workflows', 'publish.yml'), workflow);
}

test('prepare on a checkout writes the version files and the action output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-qa-pilot-release-'));
  writeCheckout(dir);
  const originalPackage = fs.readFileSync(path.join(dir, 'package.json'), 'utf8');
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.email', 't@example.com']);
  git(dir, ['config', 'user.name', 't']);
  git(dir, ['add', '.']);
  git(dir, ['commit', '-m', 'init']);
  git(dir, ['tag', '-a', 'v0.4.0', '-m', 'v0.4.0']);

  const output = path.join(dir, 'output.txt');
  const retry = runCli(dir, ['prepare'], { env: { REQUESTED: '0.4.0', GITHUB_OUTPUT: output } });
  assert.equal(retry.status, 0, retry.stderr);
  assert.match(fs.readFileSync(output, 'utf8'), /version=0\.4\.0\nretry=true\n/);
  assert.equal(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'), originalPackage);

  const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-qa-pilot-release-'));
  writeCheckout(fresh);
  git(fresh, ['init', '-b', 'main']);
  const firstOutput = path.join(fresh, 'output.txt');
  const first = runCli(fresh, ['prepare'], { env: { REQUESTED: '0.4.0', GITHUB_OUTPUT: firstOutput } });
  assert.equal(first.status, 0, first.stderr);
  assert.match(fs.readFileSync(firstOutput, 'utf8'), /version=0\.4\.0\nretry=false\n/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fresh, 'package.json'), 'utf8')).version, '0.4.0');
  assert.match(
    fs.readFileSync(path.join(fresh, '.github', 'workflows', 'publish.yml'), 'utf8'),
    /default: "0\.4\.1" # release-default/,
  );

  const empty = runCli(dir, ['prepare'], { env: { REQUESTED: '', GITHUB_OUTPUT: output } });
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /Enter 0\.4\.0/);

  const mismatch = runCli(fresh, ['verify-archive', path.join(fresh, 'package.json'), '0.4.1']);
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /package.json version 0\.4\.0/);

  const again = runCli(fresh, ['classify-publish', '1', 'true'], {
    input: 'npm error code EPUBLISHCONFLICT\nYou cannot publish over the previously published versions\n',
  });
  assert.equal(again.status, 0, again.stderr);
  const blocked = runCli(fresh, ['classify-publish', '1', 'false'], {
    input: 'npm error code ENEEDAUTH\n',
  });
  assert.equal(blocked.status, 1);
});
