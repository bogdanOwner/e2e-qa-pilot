import path from 'node:path';
import fs from 'node:fs';
import {
  kitRoot,
  MARKER,
  MARKER_LINE,
  CATALOG,
  EDITORS,
  SERVER_NAME,
  BLOCK_START,
  BLOCK_END,
  listFiles,
  readPackageVersion,
} from './kit.mjs';
import {
  MANIFEST_FILE,
  MANIFEST_SCHEMA,
  MIGRATIONS,
  hashText,
  readManifest,
  writeManifest,
} from './manifest.mjs';

// Installs the Create e2e commands into a project.
//
// Overwrite rules:
// - missing file: write
// - present, without --force: leave
// - --force and an exact marker line: refresh
// - --force without that line: leave (the file belongs to the user)
// - .e2e-qa-pilot/settings.md and project.md: always leave once they exist
// - CLAUDE.md: only the block between the begin and end markers is ours.
//   It is added when missing, and replaced only with --force. The rest is never touched.
// - an MCP entry that is already listed: always leave

const INTEGRATIONS = [...Object.keys(EDITORS), 'all'];

const FLAGS = {
  '--force': {
    value: false,
    apply(parsed) {
      parsed.force = true;
    },
  },
  '--integration': {
    value: true,
    apply(parsed, value) {
      parsed.integration = value ?? '';
    },
  },
};

export const INIT_USAGE = `Usage: e2e-qa-pilot init [path] [--integration cursor|claude|all] [--force]

  path           Project folder. Default: the current folder.
  --integration  Which editor to set up. Default: the editor whose folder
                 already exists (.cursor/ or .claude/). Both, when both
                 folders exist or neither does.
  --force        Refresh files that still have the exact ${MARKER_LINE} line.
                 Settings, the project file, and an existing MCP entry stay as
                 they are. In CLAUDE.md, only the e2e-qa-pilot block is replaced.`;

function parseArgs(argv) {
  const parsed = { projectArg: '', force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const equalsAt = arg.indexOf('=');
    const name = equalsAt === -1 ? arg : arg.slice(0, equalsAt);
    const flag = FLAGS[name];
    if (flag) {
      if (!flag.value) {
        if (equalsAt !== -1) throw new Error(`Unknown argument: ${arg}`);
        flag.apply(parsed);
        continue;
      }
      const value = equalsAt === -1 ? argv[i + 1] : arg.slice(equalsAt + 1);
      if (equalsAt === -1) i += 1;
      flag.apply(parsed, value);
      continue;
    }
    if (arg.startsWith('-')) throw new Error(`Unknown argument: ${arg}`);
    if (parsed.projectArg) throw new Error(`Unexpected argument: ${arg}`);
    parsed.projectArg = arg;
  }
  if (parsed.integration !== undefined && !INTEGRATIONS.includes(parsed.integration)) {
    throw new Error(`--integration must be one of: ${INTEGRATIONS.join(', ')}`);
  }
  return {
    projectArg: parsed.projectArg,
    integration: parsed.integration ?? '',
    force: parsed.force,
  };
}

function hasMarker(text) {
  return text.split(/\r?\n/).some((line) => line.trim() === MARKER_LINE);
}

function withMarker(text) {
  const body = text.endsWith('\n') ? text : `${text}\n`;
  if (hasMarker(body)) return body;
  return `${body}${MARKER_LINE}\n`;
}

function stubText(command, tool) {
  return `---
name: ${command}
description: >-
  Follow the installed ${command} command for e2e-qa-pilot Create e2e.
---

# ${command}

Read and follow \`.e2e-qa-pilot/processes/create-e2e/commands/${command}/SKILL.md\` in this project.

If the \`${SERVER_NAME}\` MCP server is connected, its \`${tool}\` tool returns the instructions bundled with the installed package. They match this project's copy only when both come from the same package version.

${MARKER_LINE}
`;
}

function writeFile(dest, text) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text);
}

function managedAction(exists, marked, force) {
  if (!exists) return 'write';
  if (force && marked) return 'refresh';
  if (force) return 'skip-unmarked';
  return 'skip-present';
}

const MANAGED_LOG = {
  write: (shown) => `wrote ${shown}`,
  refresh: (shown) => `refreshed ${shown}`,
  'skip-unmarked': (shown) => `left ${shown} (no ${MARKER} marker)`,
  'skip-present': (shown) => `left ${shown} (already present)`,
};

function installManaged(dest, text, force, log, root) {
  const shown = path.relative(root, dest);
  const exists = fs.existsSync(dest);
  const marked = exists && hasMarker(fs.readFileSync(dest, 'utf8'));
  const action = managedAction(exists, marked, force);
  if (action === 'write' || action === 'refresh') writeFile(dest, text);
  log(MANAGED_LOG[action](shown));
}

function detectIntegration(project) {
  const present = Object.keys(EDITORS).filter((name) =>
    fs.existsSync(path.join(project, EDITORS[name].skillsDir)),
  );
  if (present.length === 1) return present[0];
  return 'all';
}

export const serverEntry = { command: 'npx', args: ['-y', 'e2e-qa-pilot', 'mcp'] };

function mcpSnippet() {
  return JSON.stringify({ mcpServers: { [SERVER_NAME]: serverEntry } }, null, 2);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mcpAction(exists, config, parseError) {
  if (!exists) return { action: 'write' };
  if (parseError) return { action: 'skip', reason: 'not valid JSON' };
  if (!isRecord(config)) return { action: 'skip', reason: 'unexpected shape' };
  if (config.mcpServers !== undefined && !isRecord(config.mcpServers)) {
    return { action: 'skip', reason: 'unexpected shape' };
  }
  if (isRecord(config.mcpServers) && config.mcpServers[SERVER_NAME]) {
    return { action: 'skip', reason: `${SERVER_NAME} already listed` };
  }
  return { action: 'add' };
}

function installMcpEntry(dest, log, root) {
  const shown = path.relative(root, dest);
  const exists = fs.existsSync(dest);
  let config;
  let parseError = false;
  if (exists) {
    try {
      config = JSON.parse(fs.readFileSync(dest, 'utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) parseError = true;
      else throw error;
    }
  }
  const outcome = mcpAction(exists, config, parseError);
  if (outcome.action === 'write') {
    writeFile(dest, `${mcpSnippet()}\n`);
    log(`wrote ${shown}`);
    return;
  }
  if (outcome.action === 'add') {
    config.mcpServers = { ...(config.mcpServers ?? {}), [SERVER_NAME]: serverEntry };
    writeFile(dest, `${JSON.stringify(config, null, 2)}\n`);
    log(`added ${SERVER_NAME} to ${shown}`);
    return;
  }
  const hand =
    outcome.reason === 'not valid JSON' || outcome.reason === 'unexpected shape'
      ? `. Add this by hand:\n${mcpSnippet()}`
      : '';
  log(`left ${shown} (${outcome.reason})${hand}`);
}

// templates/always-on.md is the one source of the always-on instruction. It is written for the
// assistant, and it is copied word for word into both editors: the Cursor rule file
// (cursorRuleText) and the managed block in CLAUDE.md (blockText). Keep it free of comments,
// because the whole file is sent to the assistant on every chat.
function alwaysOnBody() {
  return fs.readFileSync(path.join(kitRoot, 'templates', 'always-on.md'), 'utf8').trim();
}

// Cursor: a rule file that is always applied.
function cursorRuleText() {
  return `---
description: e2e-qa-pilot. Read the project files before any e2e case work.
alwaysApply: true
---

${alwaysOnBody()}

${MARKER_LINE}
`;
}

function blockText() {
  return `${BLOCK_START}\n${alwaysOnBody()}\n${BLOCK_END}`;
}


// Where the e2e-qa-pilot block sits in a text. A stray end marker in the person's
// own text before the begin marker does not count.
function findBlock(current) {
  const start = current.indexOf(BLOCK_START);
  if (start === -1) return { found: false, broken: false };
  const endAt = current.indexOf(BLOCK_END, start + BLOCK_START.length);
  if (endAt === -1) return { found: false, broken: true };
  return { found: true, broken: false, start, end: endAt + BLOCK_END.length };
}

function replaceBlock(dest, current, found) {
  writeFile(dest, `${current.slice(0, found.start)}${blockText()}${current.slice(found.end)}`);
}

// Claude Code: a marked block inside CLAUDE.md. Text outside the markers is never touched.
function installBlock(dest, force, log, root) {
  const shown = path.relative(root, dest);
  if (!fs.existsSync(dest)) {
    writeFile(dest, `${blockText()}\n`);
    log(`wrote ${shown}`);
    return;
  }
  const current = fs.readFileSync(dest, 'utf8');
  const found = findBlock(current);
  if (found.broken) {
    log(
      `left ${shown} (it has ${BLOCK_START} but no ${BLOCK_END} after it). Fix or remove the begin line and run init again.`,
    );
    return;
  }
  if (!found.found) {
    const gap = current.endsWith('\n') ? '\n' : '\n\n';
    writeFile(dest, `${current}${gap}${blockText()}\n`);
    log(`added the e2e-qa-pilot block to ${shown}`);
    return;
  }
  if (!force) {
    log(`left ${shown} (block already present)`);
    return;
  }
  replaceBlock(dest, current, found);
  log(`refreshed the e2e-qa-pilot block in ${shown}`);
}

function installAlwaysOn(project, editor, force, log) {
  const { alwaysOn } = EDITORS[editor];
  const dest = path.join(project, alwaysOn.file);
  if (alwaysOn.kind === 'file') installManaged(dest, cursorRuleText(), force, log, project);
  else installBlock(dest, force, log, project);
}

function editorNames(integration) {
  return integration === 'all' ? Object.keys(EDITORS) : [integration];
}

// Every file the package manages for these editors: the text it would write now.
// A block item is the e2e-qa-pilot block inside a file that also holds the person's text.
function managedItems(project, editors) {
  const items = [];
  const sourceTree = path.join(kitRoot, 'processes', 'create-e2e');
  const destTree = path.join(project, '.e2e-qa-pilot', 'processes', 'create-e2e');
  for (const source of listFiles(sourceTree)) {
    items.push({
      dest: path.join(destTree, path.relative(sourceTree, source)),
      text: withMarker(fs.readFileSync(source, 'utf8')),
    });
  }
  for (const editor of editors) {
    const { skillsDir, alwaysOn } = EDITORS[editor];
    for (const { command, tool } of CATALOG) {
      items.push({
        dest: path.join(project, skillsDir, 'skills', command, 'SKILL.md'),
        text: stubText(command, tool),
      });
    }
    const dest = path.join(project, alwaysOn.file);
    if (alwaysOn.kind === 'file') items.push({ dest, text: cursorRuleText() });
    else items.push({ dest, text: blockText(), block: true });
  }
  return items.map((item) => ({
    ...item,
    key: path.relative(project, item.dest).split(path.sep).join('/'),
  }));
}

// The text now on disk for an item, or null when it is not there.
function readManaged(item) {
  if (!fs.existsSync(item.dest)) return null;
  const current = fs.readFileSync(item.dest, 'utf8');
  if (!item.block) return current;
  const found = findBlock(current);
  return found.found ? current.slice(found.start, found.end) : null;
}

function installItem(item, force, log, project) {
  if (item.block) installBlock(item.dest, force, log, project);
  else installManaged(item.dest, item.text, force, log, project);
}

function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

// The project.md headings and settings.md keys the templates ship with.
function templateNames() {
  const read = (name) => stripComments(fs.readFileSync(path.join(kitRoot, 'templates', name), 'utf8'));
  return {
    project_headings: [...read('project.md').matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()),
    settings_keys: [...read('settings.md').matchAll(/^(\w+):/gm)].map((m) => m[1]),
  };
}

function writeIfMissing(project, rel, template, log, note) {
  const dest = path.join(project, rel);
  if (fs.existsSync(dest)) {
    log(`left ${rel} (${note})`);
    return;
  }
  writeFile(dest, fs.readFileSync(path.join(kitRoot, 'templates', template), 'utf8'));
  log(`wrote ${rel}`);
}

function saveManifest(project, editors, files, prior, packageVersion, templates) {
  const integrations = Object.keys(EDITORS).filter(
    (name) => editors.includes(name) || prior?.integrations.includes(name),
  );
  writeManifest(project, {
    schema: MANIFEST_SCHEMA,
    package_version: packageVersion,
    integrations,
    files,
    templates,
  });
}

export function runInit(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const { projectArg, integration: requested, force } = parseArgs(argv);
  const project = path.resolve(cwd, projectArg || '.');

  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) {
    throw new Error(`Not a directory: ${project}`);
  }

  const editors = editorNames(requested || detectIntegration(project));
  if (!fs.existsSync(path.join(kitRoot, 'processes', 'create-e2e'))) {
    throw new Error(`Missing Create e2e commands under ${kitRoot}`);
  }

  log(`e2e-qa-pilot init in ${project} (${editors.join(' + ')})`);

  const prior = readManifest(project);
  const items = managedItems(project, editors);
  const processItems = items.filter((item) => item.key.startsWith('.e2e-qa-pilot/'));
  const editorItems = items.filter((item) => !item.key.startsWith('.e2e-qa-pilot/'));

  for (const item of processItems) installItem(item, force, log, project);

  writeIfMissing(project, '.e2e-qa-pilot/settings.md', 'settings.md', log, 'your settings are never overwritten');
  writeIfMissing(project, '.e2e-qa-pilot/project.md', 'project.md', log, 'your project file is never overwritten');

  for (const editor of editors) {
    const { skillsDir, mcpFile } = EDITORS[editor];
    for (const item of editorItems.filter((entry) => entry.key.startsWith(`${skillsDir}/skills/`))) {
      installItem(item, force, log, project);
    }
    installMcpEntry(path.join(project, mcpFile), log, project);
    installAlwaysOn(project, editor, force, log);
  }

  // Record the text the package wrote. A file left as it was keeps its earlier entry.
  const files = { ...(prior?.files ?? {}) };
  let allCurrent = true;
  for (const item of items) {
    if (readManaged(item) === item.text) files[item.key] = hashText(item.text);
    else allCurrent = false;
  }
  const version = readPackageVersion();
  const recordedVersion = allCurrent ? version : (prior?.package_version ?? '');
  saveManifest(project, editors, files, prior, recordedVersion, prior?.templates ?? templateNames());
  if (!allCurrent && prior && prior.package_version !== version) {
    log(`Some files are from e2e-qa-pilot ${prior.package_version || 'an unknown version'}. Run "npx e2e-qa-pilot upgrade" to update them.`);
  }

  const restart = {
    cursor:
      'Reload the Cursor window, then open a new chat. The chat already open will not see the new MCP server.',
    claude:
      'Quit Claude Code and start it again in this folder, then open a new chat. The session already open will not see the new MCP server.',
  };
  log(`
Next:
  1. ${editors.map((name) => restart[name]).join('\n     ')}
  2. Connect the MCP servers this project uses (case tool, Figma, feature flags) in your editor's MCP settings, and run "gh auth login" if a frontend repository is read with gh. None is required for pasted case text.
  3. Ask in chat: "Set up e2e-qa-pilot for this project." That runs setup-project, which fills .e2e-qa-pilot/project.md. Or edit that file by hand. See docs/project.md.
  4. Review and commit the files init wrote before a run that creates or switches a branch. A case review can run before that commit. See docs/install.md.
  5. Ask in chat: "Review case <id>." or paste the full case and ask to review it.
     The first run asks once for the keys in .e2e-qa-pilot/settings.md that this input needs.`);
}

export const UPGRADE_USAGE = `Usage: e2e-qa-pilot upgrade [path] [--force]

  path     Project folder. Default: the current folder.
  --force  Also replace files you edited. Without it, an edited file is kept and
           the new version is written next to it as <file>.new.

Replaces the files init installed, when you have not edited them. Settings and
the project file are never changed.`;

function parseUpgradeArgs(argv) {
  const parsed = { projectArg: '', force: false };
  for (const arg of argv) {
    if (arg === '--force') parsed.force = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown argument: ${arg}`);
    else if (parsed.projectArg) throw new Error(`Unexpected argument: ${arg}`);
    else parsed.projectArg = arg;
  }
  return parsed;
}

// Settings keys and project headings that the templates gained since this project was installed.
function newTemplateTodos(project, recorded, current) {
  const todo = [];
  const newHeadings = current.project_headings.filter((name) => !recorded.project_headings.includes(name));
  const projectFile = path.join(project, '.e2e-qa-pilot', 'project.md');
  if (newHeadings.length > 0 && fs.existsSync(projectFile)) {
    const have = stripComments(fs.readFileSync(projectFile, 'utf8'));
    for (const name of newHeadings) {
      if (!new RegExp(`^## ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(have)) {
        todo.push(`.e2e-qa-pilot/project.md: new optional section "## ${name}". See templates/project.md in the package.`);
      }
    }
  }
  const newKeys = current.settings_keys.filter((key) => !recorded.settings_keys.includes(key));
  const settingsFile = path.join(project, '.e2e-qa-pilot', 'settings.md');
  if (newKeys.length > 0 && fs.existsSync(settingsFile)) {
    const have = stripComments(fs.readFileSync(settingsFile, 'utf8'));
    for (const key of newKeys) {
      if (!new RegExp(`^${key}:`, 'm').test(have)) {
        todo.push(`.e2e-qa-pilot/settings.md: new key "${key}". See templates/settings.md in the package.`);
      }
    }
  }
  return todo;
}

export function runUpgrade(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const { projectArg, force } = parseUpgradeArgs(argv);
  const project = path.resolve(cwd, projectArg || '.');
  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) {
    throw new Error(`Not a directory: ${project}`);
  }

  let manifest = readManifest(project);
  if (!manifest) {
    throw new Error(
      `No usable ${MANIFEST_FILE} in ${project}. Run "npx e2e-qa-pilot init" first. Files from an install without a manifest can be refreshed with "init --force".`,
    );
  }
  if (manifest.schema > MANIFEST_SCHEMA) {
    throw new Error(
      `${MANIFEST_FILE} is schema ${manifest.schema}, newer than this e2e-qa-pilot understands (${MANIFEST_SCHEMA}). Run the upgrade with a newer package.`,
    );
  }
  while (manifest.schema < MANIFEST_SCHEMA) {
    const migrate = MIGRATIONS[manifest.schema];
    if (!migrate) throw new Error(`No migration from manifest schema ${manifest.schema}.`);
    manifest = migrate(manifest);
  }

  const editors = manifest.integrations.filter((name) => EDITORS[name]);
  if (editors.length === 0) throw new Error(`${MANIFEST_FILE} lists no editor. Run "npx e2e-qa-pilot init" again.`);

  const version = readPackageVersion();
  log(`e2e-qa-pilot upgrade in ${project} (${manifest.package_version || 'unknown'} -> ${version})`);

  const items = managedItems(project, editors);
  const files = {};
  const edited = [];
  for (const item of items) {
    const disk = readManaged(item);
    const prior = manifest.files[item.key];
    if (disk === null) {
      installItem(item, false, log, project);
    } else if (disk === item.text) {
      // already current
    } else if (prior && hashText(disk) === prior) {
      if (item.block) {
        const text = fs.readFileSync(item.dest, 'utf8');
        replaceBlock(item.dest, text, findBlock(text));
      } else {
        writeFile(item.dest, item.text);
      }
      log(`updated ${item.key}`);
    } else if (force && (item.block || hasMarker(disk))) {
      installItem(item, true, log, project);
    } else if (item.block) {
      log(`kept ${item.key} (you edited the e2e-qa-pilot block). Run upgrade --force to replace it.`);
      edited.push(item.key);
    } else {
      writeFile(`${item.dest}.new`, item.text);
      log(`kept ${item.key} (you edited it). New version: ${item.key}.new`);
      edited.push(item.key);
    }
    if (readManaged(item) === item.text) files[item.key] = hashText(item.text);
    else if (prior) files[item.key] = prior;
  }

  const wanted = new Set(items.map((item) => item.key));
  for (const [key, hash] of Object.entries(manifest.files)) {
    if (wanted.has(key)) continue;
    const dest = path.join(project, ...key.split('/'));
    if (!fs.existsSync(dest)) continue;
    if (hashText(fs.readFileSync(dest, 'utf8')) === hash) {
      fs.rmSync(dest);
      log(`removed ${key} (no longer part of the package)`);
    } else {
      log(`left ${key} (no longer part of the package, but you edited it)`);
    }
  }

  const current = templateNames();
  const todos = newTemplateTodos(project, manifest.templates ?? current, current);
  saveManifest(project, editors, files, manifest, version, current);

  if (edited.length > 0) log(`\n${edited.length} edited file(s) kept. Compare with the .new files, or run upgrade --force.`);
  for (const line of todos) log(`todo: ${line}`);
  log('\nCommit the changed files. Settings and the project file were not touched.');
}
