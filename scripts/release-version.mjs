import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/;
const defaultLine = /^(\s*default: ")\d+\.\d+\.\d+(" # release-default)\s*$/;

export function parseVersion(value, label) {
  if (!versionPattern.test(value)) {
    throw new Error(`${label} must be x.y.z, got ${JSON.stringify(value)}.`);
  }
  return value.split('.').map(Number);
}

export function compareVersions(left, right) {
  const a = parseVersion(left, 'version');
  const b = parseVersion(right, 'version');
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

export function bumpPatch(version) {
  const parts = parseVersion(version, 'version');
  parts[2] += 1;
  return parts.join('.');
}

export function classifyNpmView(status, output) {
  if (status === 0) return 'published';
  if (/E404|No match found for version|404 Not Found/i.test(output)) return 'missing';
  return 'error';
}

export function classifyNpmPublish(status, output) {
  if (status === 0) return 'published';
  if (/EPUBLISHCONFLICT|previously published|cannot publish over/i.test(output)) return 'exists';
  return 'error';
}

// requestedTagExists is the tag for the version this function resolves, not for
// whatever happens to be in package.json. currentPublished is required when
// that current tag exists: published, missing, or error.
export function decideRelease({
  current,
  requested = '',
  requestedTagExists = false,
  currentTagExists = false,
  currentPublished = 'unchecked',
  packageName = '',
  npmError = '',
}) {
  let version;
  try {
    parseVersion(current, 'package.json version');
  } catch (error) {
    return { ok: false, message: error.message };
  }

  const trimmed = String(requested ?? '').trim();
  if (!trimmed) {
    if (current === '0.1.0') {
      return {
        ok: false,
        message: 'package.json is still 0.1.0. Enter 0.4.0 for the first publish.',
      };
    }
    version = bumpPatch(current);
  } else {
    try {
      parseVersion(trimmed, 'version');
    } catch (error) {
      return { ok: false, message: error.message };
    }
    version = trimmed;
  }

  if (requestedTagExists) {
    return { ok: true, version, retry: true };
  }

  if (compareVersions(version, current) <= 0) {
    return {
      ok: false,
      message: `Version ${version} must be greater than package.json version ${current}.`,
    };
  }

  if (currentTagExists && currentPublished === 'unchecked') {
    return { ok: false, message: `The npm status of v${current} was not checked.` };
  }

  if (currentTagExists && currentPublished === 'missing') {
    return {
      ok: false,
      message: `v${current} is tagged and is not on npm yet. Run again with version ${current} to finish that publish.`,
    };
  }

  if (currentTagExists && currentPublished === 'error') {
    const detail = String(npmError ?? '').trim();
    const name = packageName ? `${packageName}@${current}` : current;
    return {
      ok: false,
      message: detail
        ? `Could not check whether ${name} is on npm.\n${detail}`
        : `Could not check whether ${name} is on npm.`,
    };
  }

  return { ok: true, version, retry: false, nextDefault: bumpPatch(version) };
}

export function setPackageVersion(text, version) {
  parseVersion(version, 'version');
  const parsed = JSON.parse(text);
  if (typeof parsed.version !== 'string') {
    throw new Error('package.json has no top-level version.');
  }
  parsed.version = version;
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  return text.endsWith('\n') ? serialized : serialized.slice(0, -1);
}

export function setWorkflowDefault(text, version) {
  parseVersion(version, 'version');
  let replaced = 0;
  const updated = text.split('\n').map((line) => {
    const match = line.match(defaultLine);
    if (!match) return line;
    replaced += 1;
    return `${match[1]}${version}${match[2]}`;
  });
  if (replaced !== 1) {
    throw new Error(`Expected one prefilled version in publish.yml, found ${replaced}.`);
  }
  return updated.join('\n');
}

export function prepareRelease({ packageJson, workflowText, ...facts }) {
  const decision = decideRelease(facts);
  if (!decision.ok) return decision;
  if (decision.retry) {
    return {
      ok: true,
      version: decision.version,
      retry: true,
      packageJson,
      workflowText,
    };
  }
  return {
    ok: true,
    version: decision.version,
    retry: false,
    nextDefault: decision.nextDefault,
    packageJson: setPackageVersion(packageJson, decision.version),
    workflowText: setWorkflowDefault(workflowText, decision.nextDefault),
  };
}

function tagExists(name) {
  const result = spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${name}`], {
    encoding: 'utf8',
  });
  if (result.status === 0) return true;
  if (result.status === 1 && !result.error) return false;
  const detail = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim();
  throw new Error(detail || result.error?.message || 'git rev-parse failed');
}

function lookupPublished(name, version) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version'], {
    encoding: 'utf8',
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error) {
    return { status: 'error', output: result.error.message };
  }
  return { status: classifyNpmView(result.status ?? 1, output), output };
}

function readPackage() {
  const text = fs.readFileSync('package.json', 'utf8');
  const parsed = JSON.parse(text);
  if (typeof parsed.version !== 'string' || typeof parsed.name !== 'string') {
    throw new Error('package.json needs a top-level name and version.');
  }
  return { text, name: parsed.name, version: parsed.version };
}

function candidateVersion(current, requested) {
  parseVersion(current, 'package.json version');
  const trimmed = String(requested ?? '').trim();
  if (!trimmed) {
    if (current === '0.1.0') {
      return {
        ok: false,
        message: 'package.json is still 0.1.0. Enter 0.4.0 for the first publish.',
      };
    }
    return { ok: true, version: bumpPatch(current) };
  }
  parseVersion(trimmed, 'version');
  return { ok: true, version: trimmed };
}

function prepareCommand() {
  const { text: packageJson, name, version: current } = readPackage();
  const workflowPath = '.github/workflows/publish.yml';
  const workflowText = fs.readFileSync(workflowPath, 'utf8');
  const candidate = candidateVersion(current, process.env.REQUESTED ?? '');
  if (!candidate.ok) {
    console.error(candidate.message);
    process.exit(1);
  }

  const requestedTagExists = tagExists(`v${candidate.version}`);
  const currentTagExists = tagExists(`v${current}`);
  let currentPublished = 'unchecked';
  let npmError = '';
  if (!requestedTagExists && currentTagExists) {
    const lookup = lookupPublished(name, current);
    currentPublished = lookup.status;
    npmError = lookup.output;
  }

  const prepared = prepareRelease({
    current,
    requested: process.env.REQUESTED ?? '',
    requestedTagExists,
    currentTagExists,
    currentPublished,
    packageName: name,
    npmError,
    packageJson,
    workflowText,
  });
  if (!prepared.ok) {
    console.error(prepared.message);
    process.exit(1);
  }
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error('GITHUB_OUTPUT is not set.');
  }

  if (!prepared.retry) {
    fs.writeFileSync('package.json', prepared.packageJson);
    fs.writeFileSync(workflowPath, prepared.workflowText);
    console.log(`Publishing ${prepared.version}. The next prefilled version will be ${prepared.nextDefault}.`);
  } else {
    console.log(`Tag v${prepared.version} already exists. Publishing that commit.`);
  }

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${prepared.version}\nretry=${prepared.retry}\n`,
  );
}

function verifyArchiveCommand(file, version) {
  parseVersion(version, 'version');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (parsed.version !== version) {
    console.error(`Tag v${version} has package.json version ${parsed.version}.`);
    process.exit(1);
  }
}

function classifyPublishCommand(statusText, retryText) {
  const status = Number(statusText);
  const output = fs.readFileSync(0, 'utf8');
  const kind = classifyNpmPublish(status, output);
  if (kind === 'published') return;
  if (retryText === 'true' && kind === 'exists') {
    console.log('This version is already on npm.');
    return;
  }
  process.exit(1);
}

function run(args) {
  const [command, ...rest] = args;
  if (!command || command === 'prepare') {
    prepareCommand();
    return;
  }
  if (command === 'verify-archive') {
    verifyArchiveCommand(rest[0], rest[1]);
    return;
  }
  if (command === 'classify-publish') {
    classifyPublishCommand(rest[0], rest[1]);
    return;
  }
  throw new Error(`Unknown command ${command}.`);
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
