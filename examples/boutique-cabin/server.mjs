import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const mediaHosts = new Set(['lh3.googleusercontent.com', 'cf.bstatic.com']);
const mediaCache = new Map();
const mediaCacheLimit = 48;

const boot = `<script id="demo-boot">
(function () {
  var RealDate = Date;
  var floor = new RealDate(2026, 6, 1, 12).getTime();
  function DemoDate(a, b, c, d, e, f, g) {
    var now = Math.min(RealDate.now(), floor);
    if (!(this instanceof DemoDate)) return new RealDate(now).toString();
    switch (arguments.length) {
      case 0: return new RealDate(now);
      case 1: return new RealDate(a);
      case 2: return new RealDate(a, b);
      case 3: return new RealDate(a, b, c);
      case 4: return new RealDate(a, b, c, d);
      case 5: return new RealDate(a, b, c, d, e);
      case 6: return new RealDate(a, b, c, d, e, f);
      default: return new RealDate(a, b, c, d, e, f, g);
    }
  }
  DemoDate.prototype = RealDate.prototype;
  DemoDate.now = function () { return Math.min(RealDate.now(), floor); };
  DemoDate.parse = RealDate.parse;
  DemoDate.UTC = RealDate.UTC;
  window.Date = DemoDate;

  var hosts = { 'cf.bstatic.com': 1, 'lh3.googleusercontent.com': 1 };
  function proxied(url) {
    try {
      var parsed = new URL(url, location.href);
      if (parsed.origin === location.origin || parsed.protocol !== 'https:' || !hosts[parsed.hostname]) return url;
      return '/media?src=' + encodeURIComponent(parsed.toString());
    } catch (error) {
      return url;
    }
  }
  function rewrite(img) {
    if (!(img instanceof HTMLImageElement)) return;
    var src = img.getAttribute('src');
    if (!src || src.indexOf('/media?src=') === 0) return;
    var next = proxied(src);
    if (next !== src) img.setAttribute('src', next);
  }
  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node instanceof HTMLImageElement) rewrite(node);
    var images = node.querySelectorAll ? node.querySelectorAll('img') : [];
    for (var i = 0; i < images.length; i++) rewrite(images[i]);
  }
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      if (record.type === 'attributes') rewrite(record.target);
      for (var j = 0; j < record.addedNodes.length; j++) scan(record.addedNodes[j]);
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (/booking\\.firmizo\\.com|workers\\.dev\\/booking|\\/api\\/booking/i.test(String(url))) {
        return Promise.reject(new Error('This example does not send booking requests.'));
      }
      return originalFetch.apply(this, arguments);
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var booking = document.getElementById('booking');
    if (!booking || document.getElementById('example-note')) return;
    var note = document.createElement('p');
    note.id = 'example-note';
    note.style.cssText = 'margin:0 0 20px;max-width:42rem;font:400 15px/1.5 Plus Jakarta Sans,sans-serif;color:#414844;';
    var text = document.createElement('span');
    text.textContent = 'This is an example site with mock data, for trying e2e-qa-pilot. Confirm Booking does not send a request.';
    text.style.display = 'block';
    var link = document.createElement('a');
    link.id = 'demo-timeout-link';
    link.href = '/?demo=timeout';
    link.textContent = 'Booking timeout demo';
    link.style.color = '#924c00';
    link.style.fontWeight = '600';
    note.appendChild(text);
    note.appendChild(link);
    booking.insertBefore(note, booking.firstChild);
  });
})();
</script>`;

function rememberMedia(key, value) {
  if (mediaCache.has(key)) mediaCache.delete(key);
  mediaCache.set(key, value);
  while (mediaCache.size > mediaCacheLimit) {
    const oldest = mediaCache.keys().next().value;
    mediaCache.delete(oldest);
  }
}

async function fetchMedia(url) {
  const upstream = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      accept: 'image/avif,image/webp,image/*,*/*',
      'user-agent': 'Mozilla/5.0',
    },
  });
  if (!upstream.ok) throw new Error(String(upstream.status));
  const type = (upstream.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  if (!type.startsWith('image/')) throw new Error('not an image');
  const body = Buffer.from(await upstream.arrayBuffer());
  if (body.length > 12_000_000) throw new Error('too large');
  return { type, body };
}

async function proxyMedia(res, src) {
  let target;
  try {
    target = new URL(src ?? '');
  } catch {
    send(res, 400, 'bad request', 'text/plain; charset=utf-8');
    return;
  }
  if (target.protocol !== 'https:' || !mediaHosts.has(target.hostname)) {
    send(res, 403, 'forbidden', 'text/plain; charset=utf-8');
    return;
  }
  const key = target.toString();
  try {
    if (!mediaCache.has(key)) {
      const pending = fetchMedia(key);
      rememberMedia(key, pending);
      pending.catch(() => {
        if (mediaCache.get(key) === pending) mediaCache.delete(key);
      });
    }
    const image = await mediaCache.get(key);
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(200, {
      'content-type': image.type,
      'cache-control': 'public, max-age=86400',
    });
    res.end(image.body);
  } catch {
    if (!res.headersSent) send(res, 502, 'image unavailable', 'text/plain; charset=utf-8');
  }
}

function send(res, status, body, type) {
  if (res.destroyed || res.writableEnded) return;
  try {
    res.writeHead(status, { 'content-type': type });
    res.end(body);
  } catch {
    // The browser closed the socket before the response finished.
  }
}

function fileFor(pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let file = path.resolve(root, relative);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return file;
}

const exampleBanner =
  '<div id="example-banner" style="background:linear-gradient(to right,#fbbf24,#fb923c);color:#fff;box-shadow:0 10px 15px -3px rgb(0 0 0 / .1),0 4px 6px -4px rgb(0 0 0 / .1)">' +
  '<div style="max-width:80rem;margin:0 auto;padding:.75rem 1.5rem">' +
  '<p style="margin:0;font-family:Plus Jakarta Sans,sans-serif;font-weight:600;font-size:1.125rem;line-height:1.35">Example site for e2e-qa-pilot. Mock data only.</p>' +
  '</div></div>';

function prepareHtml(html) {
  let page = html.replace(
    /<script\b[^>]*\bsrc=["']https:\/\/challenges\.cloudflare\.com\/turnstile[^"']*["'][^>]*>\s*<\/script>/gi,
    '',
  );
  page = page.replace(/<div\b[^>]*\bcf-turnstile\b[^>]*>\s*<\/div>/gi, '');
  page = page.replaceAll('navigator.sendBeacon', 'Function.prototype');
  page = page.replace(
    /(\ssrc=["'])(https:\/\/(?:cf\.bstatic\.com|lh3\.googleusercontent\.com)[^"']*)(["'])/gi,
    (_, prefix, url, suffix) => `${prefix}/media?src=${encodeURIComponent(url)}${suffix}`,
  );
  if (!page.includes('id="demo-boot"')) {
    page = page.replace(/<head([^>]*)>/i, `<head$1>${boot}`);
  }
  if (!page.includes('id="example-banner"')) {
    const skipLink = /(<a\b[^>]*href=["']#main-content["'][^>]*>[\s\S]*?<\/a>)/i;
    if (skipLink.test(page)) page = page.replace(skipLink, `$1${exampleBanner}`);
    else page = page.replace(/<body\b[^>]*>/i, (open) => `${open}${exampleBanner}`);
  }
  return page;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

  if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/media') {
    if (req.method === 'HEAD') {
      send(res, 200, '', 'image/jpeg');
      return;
    }
    await proxyMedia(res, url.searchParams.get('src'));
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

  const type = types[path.extname(file)] || 'application/octet-stream';
  if (path.extname(file) === '.html') {
    const html = prepareHtml(fs.readFileSync(file, 'utf8'));
    send(res, 200, req.method === 'HEAD' ? '' : html, type);
    return;
  }

  const body = fs.readFileSync(file);
  res.writeHead(200, { 'content-type': type });
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

server.listen(port, '127.0.0.1');
