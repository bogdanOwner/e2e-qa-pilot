import path from 'node:path';
import fs from 'node:fs';
import {
  kitRoot,
  MARKER,
  MARKER_LINE,
  CATALOG,
  EDITORS,
  SERVER_NAME,
  listFiles,
} from './kit.mjs';

// Installs the Create e2e commands into a project.
//
// Overwrite rules:
// - missing file: write
// - present, without --force: leave
// - --force and an exact marker line: refresh
// - --force without that line: leave (the file belongs to the user)
// - .e2e-qa-pilot/settings.md: always leave once it exists
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
                 Settings and an existing MCP entry stay as they are.`;

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

function editorNames(integration) {
  return integration === 'all' ? Object.keys(EDITORS) : [integration];
}

export function runInit(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const { projectArg, integration: requested, force } = parseArgs(argv);
  const project = path.resolve(cwd, projectArg || '.');

  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) {
    throw new Error(`Not a directory: ${project}`);
  }

  const editors = editorNames(requested || detectIntegration(project));

  const sourceTree = path.join(kitRoot, 'processes', 'create-e2e');
  const destTree = path.join(project, '.e2e-qa-pilot', 'processes', 'create-e2e');
  if (!fs.existsSync(sourceTree)) {
    throw new Error(`Missing Create e2e commands: ${sourceTree}`);
  }

  log(`e2e-qa-pilot init in ${project} (${editors.join(' + ')})`);

  for (const source of listFiles(sourceTree)) {
    const rel = path.relative(sourceTree, source);
    installManaged(
      path.join(destTree, rel),
      withMarker(fs.readFileSync(source, 'utf8')),
      force,
      log,
      project,
    );
  }

  const settingsDest = path.join(project, '.e2e-qa-pilot', 'settings.md');
  const settingsShown = path.relative(project, settingsDest);
  if (fs.existsSync(settingsDest)) {
    log(`left ${settingsShown} (your settings are never overwritten)`);
  } else {
    writeFile(settingsDest, fs.readFileSync(path.join(kitRoot, 'templates', 'settings.md'), 'utf8'));
    log(`wrote ${settingsShown}`);
  }

  for (const editor of editors) {
    const { skillsDir, mcpFile } = EDITORS[editor];
    for (const { command, tool } of CATALOG) {
      installManaged(
        path.join(project, skillsDir, 'skills', command, 'SKILL.md'),
        stubText(command, tool),
        force,
        log,
        project,
      );
    }
    installMcpEntry(path.join(project, mcpFile), log, project);
  }

  const labels = editors.map((name) => EDITORS[name].label);
  log(`
Next:
  1. Restart ${labels.join(' or ')} so it picks up the skills and the MCP server.
  2. To review an existing case, connect your case tool (for example Qase) in your editor's MCP settings. To review pasted case text, no case tool is required.
  3. Ask in chat: "Review case <id>." or paste the full case and ask to review it.
     The first run asks once for the keys in .e2e-qa-pilot/settings.md that this input needs.`);
}
