import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const htmlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../html');

export function storedPage(name) {
  return pathToFileURL(path.join(htmlDir, name)).href;
}
