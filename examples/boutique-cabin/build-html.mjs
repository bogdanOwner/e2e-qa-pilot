import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { CabinPage } from './tests/pages/cabin.page.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const htmlDir = path.join(root, 'html');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startServer(port) {
  return spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
  });
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 10_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`server exited with ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`server responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error('server did not start');
}

function stopServer(child) {
  if (child.exitCode != null) return Promise.resolve();
  return new Promise((resolve) => {
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
  });
}

function stylesheetText() {
  const styles = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.css')) styles.push(fs.readFileSync(file, 'utf8'));
    }
  };
  walk(path.join(root, '_astro'));
  return styles.join('\n');
}

async function snapshot(page) {
  const css = stylesheetText();
  const html = await page.evaluate((styles) => {
    for (const field of document.querySelectorAll('input, textarea, select')) {
      if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        if (field.checked) field.setAttribute('checked', '');
        else field.removeAttribute('checked');
        continue;
      }
      if (field instanceof HTMLSelectElement) {
        for (const option of field.options) {
          if (option.selected) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        }
        continue;
      }
      field.setAttribute('value', field.value);
    }
    for (const el of document.querySelectorAll('body *')) {
      if (getComputedStyle(el).display === 'none') el.setAttribute('data-stored-hidden', '1');
    }
    const copy = document.documentElement.cloneNode(true);
    document.querySelectorAll('[data-stored-hidden]').forEach((node) => node.removeAttribute('data-stored-hidden'));
    copy.querySelectorAll('[data-stored-hidden]').forEach((node) => node.remove());
    copy.querySelectorAll('script').forEach((node) => node.remove());
    copy.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
    const style = document.createElement('style');
    style.textContent = styles;
    copy.querySelector('head').append(style);
    return `<!DOCTYPE html>\n${copy.outerHTML}\n`;
  }, css);
  if (html.includes('<script')) throw new Error('stored page still contains a script');
  return html;
}

async function writePage(page, name) {
  const html = await snapshot(page);
  fs.writeFileSync(path.join(htmlDir, name), html);
}

const port = await freePort();
const baseURL = `http://127.0.0.1:${port}`;
const child = startServer(port);
let browser;

try {
  await waitForServer(baseURL, child);
  fs.mkdirSync(htmlDir, { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, locale: 'en-GB', viewport: { width: 1280, height: 900 } });
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font') return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const cabin = new CabinPage(page);

  await cabin.open();
  await cabin.searchStay();
  await expect(cabin.chalet4).toContainText('497 EUR');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.unavailable).toBeVisible();
  await writePage(page, 'availability.html');

  await cabin.chaletRate.click();
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('497 EUR');
  await writePage(page, 'selection.html');

  await cabin.reserve.click();
  await page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest();
  await cabin.confirm.click();
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.', { timeout: 20_000 });
  await expect(cabin.reference).toBeVisible();
  await writePage(page, 'sent.html');

  await cabin.open({ timeout: true });
  await cabin.searchStay();
  await cabin.chaletRate.click();
  await cabin.reserve.click();
  await page.waitForURL(/\/booking\?/);
  await expect(page).toHaveURL(/demo=timeout/);
  await cabin.fillGuest();
  await cabin.confirm.click();
  await expect(cabin.error).toHaveText('Something went wrong. Please try again.', { timeout: 20_000 });
  await expect(cabin.resultTitle).toBeHidden();
  await expect(cabin.reference).toHaveCount(0);
  await writePage(page, 'timeout.html');
} finally {
  await browser?.close();
  await stopServer(child);
}
