import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const availabilityDelayMs = 2000;
const bookingDelayMs = 2000;
const bookingTimeoutMs = 12000;
const reference = 'CAB-1042';

const customer = JSON.parse(fs.readFileSync(path.join(root, 'data/customer.json'), 'utf8'));
const copy = JSON.parse(fs.readFileSync(path.join(root, 'data/locales/en.json'), 'utf8'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function wait(ms, res) {
  return new Promise((resolve) => {
    if (res.destroyed || res.writableEnded) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (open) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      res.off('close', onClose);
      resolve(open);
    };
    const onClose = () => finish(false);
    const timer = setTimeout(() => finish(true), ms);
    res.on('close', onClose);
  });
}

function send(res, status, body, type) {
  if (res.destroyed || res.writableEnded) return;
  try {
    res.writeHead(status, { 'content-type': type });
    res.end(body);
  } catch {
    // The browser closed the socket before the mock finished.
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function fileFor(pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
  return file;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

  if (req.method === 'POST' && (url.pathname === '/api/availability' || url.pathname === '/api/booking')) {
    try {
      const body = await readBody(req);
      if (url.pathname === '/api/availability') {
        if (await wait(availabilityDelayMs, res)) {
          send(res, 200, JSON.stringify({ rooms: customer.booking.rooms }), 'application/json; charset=utf-8');
        }
        return;
      }
      const timeout = body.demo === 'timeout';
      if (!(await wait(timeout ? bookingTimeoutMs : bookingDelayMs, res))) return;
      if (timeout) {
        send(res, 504, JSON.stringify({ error: copy.boutique_booking_error }), 'application/json; charset=utf-8');
        return;
      }
      send(
        res,
        200,
        JSON.stringify({
          reference,
          title: copy.boutique_confirm_success_title,
          body: copy.boutique_confirm_success_body,
          referenceLine: copy.boutique_confirm_success_ref_line.replace('{{ref}}', reference),
        }),
        'application/json; charset=utf-8',
      );
    } catch {
      send(res, 400, JSON.stringify({ error: copy.boutique_booking_error }), 'application/json; charset=utf-8');
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'method not allowed', 'text/plain; charset=utf-8');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    send(res, 400, 'bad request', 'text/plain; charset=utf-8');
    return;
  }
  const file = fileFor(pathname);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, 'not found', 'text/plain; charset=utf-8');
    return;
  }

  const body = fs.readFileSync(file);
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

server.listen(port, '127.0.0.1');
