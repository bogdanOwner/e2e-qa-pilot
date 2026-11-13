import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// .e2e-qa-pilot/manifest.json records what init installed, so upgrade can tell a file
// the package wrote from a file the person edited.
//
// {
//   "schema": 1,                      shape of this file; changes only with a migration
//   "package_version": "0.5.0",       the package that last wrote these files
//   "integrations": ["cursor"],       editors that were set up
//   "files": { "<path>": "<sha256 of the text the package wrote>" },
//   "templates": { "project_headings": [...], "settings_keys": [...] }
//                                     what the templates held at install, so upgrade
//                                     can name sections and keys added since
// }
//
// It lists only files the package manages. settings.md and project.md are the
// person's files and are never listed. It holds no secret.

export const MANIFEST_SCHEMA = 1;
export const MANIFEST_FILE = path.join('.e2e-qa-pilot', 'manifest.json');

// One entry per schema change: MIGRATIONS[n] turns a schema n manifest into schema n + 1.
export const MIGRATIONS = {};

export function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function manifestPath(project) {
  return path.join(project, MANIFEST_FILE);
}

// Returns the manifest, or null when it is missing or unusable.
export function readManifest(project) {
  const file = manifestPath(project);
  if (!fs.existsSync(file)) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!isRecord(manifest) || !isRecord(manifest.files)) return null;
    if (!Number.isInteger(manifest.schema)) return null;
    return {
      schema: manifest.schema,
      package_version: String(manifest.package_version ?? ''),
      integrations: Array.isArray(manifest.integrations) ? manifest.integrations : [],
      files: manifest.files,
      templates: isRecord(manifest.templates) ? manifest.templates : undefined,
    };
  } catch {
    return null;
  }
}

export function writeManifest(project, manifest) {
  const file = manifestPath(project);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

// One line for the top of a tool result when the project files came from another version.
export function versionNotice(project, packageVersion) {
  const manifest = readManifest(project);
  if (!manifest || manifest.package_version === packageVersion) return '';
  return `Project files were installed by e2e-qa-pilot ${manifest.package_version || 'an unknown version'}; this server is ${packageVersion}. Tell the person to run \`npx e2e-qa-pilot upgrade\`.`;
}
