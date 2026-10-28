import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { CabinPage } from './tests/pages/cabin.page.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const htmlDir = path.join(root, 'html');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

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
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
  });
  return child;
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

async function snapshot(page) {
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
    const copy = document.documentElement.cloneNode(true);
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

async function search(cabin) {
  await cabin.checkIn.fill('2026-08-04');
  await cabin.checkOut.fill('2026-08-05');
  await cabin.search.click();
  await expect(cabin.chalet4).toContainText('497 RON');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.unavailable).toBeVisible();
}

async function selectChalet(cabin) {
  await cabin.chaletRate.click();
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('4 Aug 2026 – 5 Aug 2026');
  await expect(cabin.selection).toContainText('497 RON');
}

async function sendBooking(cabin) {
  await cabin.firstName.fill('Ana');
  await cabin.lastName.fill('Pop');
  await cabin.email.fill('ana.pop@example.com');
  await cabin.phone.fill('+40723441446');
  await cabin.terms.check();
  await cabin.confirm.click();
}

const port = await freePort();
const baseURL = `http://127.0.0.1:${port}`;
const child = startServer(port);
let browser;

try {
  await waitForServer(baseURL, child);
  fs.mkdirSync(htmlDir, { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, locale: 'en-GB' });
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font') return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const cabin = new CabinPage(page);

  await cabin.open();
  await search(cabin);
  await writePage(page, 'availability.html');
  await selectChalet(cabin);
  await writePage(page, 'selection.html');
  await sendBooking(cabin);
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.', { timeout: 20_000 });
  await expect(cabin.reference).toBeVisible();
  await writePage(page, 'sent.html');

  await cabin.open({ timeout: true });
  await search(cabin);
  await selectChalet(cabin);
  await sendBooking(cabin);
  await expect(cabin.resultTitle).toHaveText('Something went wrong. Please try again.', { timeout: 20_000 });
  await writePage(page, 'timeout.html');
} finally {
  await browser?.close();
  await stopServer(child);
}
