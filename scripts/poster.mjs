#!/usr/bin/env node
// Regenerates public/img/poster-1939.jpg — a JPEG screenshot of #bgMap (plus
// #bgVeil/#grade) on /1939, shown by #bgFallback for the very first paint
// and cross-faded out once the live MapLibre map is idle (see
// public/css/main.css and the `map.once('idle', ...)` in public/js/engine.js).
//
// IMPORTANT: this is a screenshot of the *current* map style/terrain look.
// A parallel work stream may change the MapLibre style inside initMap() in
// public/js/engine.js, the KEYS camera table, weather.js and marker CSS —
// whenever that style changes materially, RE-RUN THIS SCRIPT so the poster
// still matches what the live map paints, or the crossfade will visibly
// jump.
//
// Usage:
//   1. `pnpm build` first, so out/ exists and is current.
//   2. This script needs the `playwright` package, which is deliberately
//      NOT a dependency of this repo (see CLAUDE.md build notes — keep the
//      story lean). Run it from a scratch directory that already has
//      playwright@1.54.0 installed (e.g. the harness's pw scratchpad), with
//      this repo's absolute path passed as the first argument:
//        node /path/to/this/repo/scripts/poster.mjs /path/to/this/repo
//      or `cd` into such a directory yourself before invoking node.
//
// Chromium here does not trust the outbound proxy's CA, so all https
// requests (map tiles, hillshade, fonts) are routed through `curl` on the
// host instead of Chromium's own TLS stack (same trick as the harness's
// pw/shot.mjs playwright helper).

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const outDir = path.join(repoRoot, 'out');
const posterPath = path.join(repoRoot, 'public/img/poster-1939.jpg');

if (!existsSync(outDir)) {
  console.error(`No ${outDir} — run "pnpm build" in the repo first.`);
  process.exit(1);
}

// ── tiny static server for out/, clean-URL style (matches `serve`/Vercel) ──
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
};
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/$/, '');
  const bare = clean.replace(/^\//, '');
  const candidates = bare === '' ? ['index.html'] : [bare + '.html', bare, `${bare}/index.html`];
  for (const c of candidates) {
    const fp = path.join(outDir, c);
    if (fp.startsWith(outDir) && existsSync(fp) && statSync(fp).isFile()) return fp;
  }
  return null;
}
const server = createServer(async (req, res) => {
  const fp = await resolveFile(req.url);
  if (!fp) { res.writeHead(404); res.end('not found'); return; }
  const ext = path.extname(fp);
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
  res.end(await readFile(fp));
});
const port = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

// ── https-over-curl route handler (Chromium doesn't trust the proxy CA) ──
const cacheDir = path.join(os.tmpdir(), 'k2-poster-curl-cache');
mkdirSync(cacheDir, { recursive: true });
function viaCurl(url) {
  const h = crypto.createHash('md5').update(url).digest('hex');
  const bf = path.join(cacheDir, `${h}.b`), hf = path.join(cacheDir, `${h}.h`);
  if (!existsSync(bf)) {
    try { execFileSync('curl', ['-sS', '-L', '--max-time', '40', '-D', hf, '-o', bf, url]); }
    catch { return null; }
  }
  const hd = readFileSync(hf, 'utf8');
  const ct = (hd.match(/content-type:\s*([^\r\n]+)/i) || [])[1] || 'application/octet-stream';
  return { body: readFileSync(bf), contentType: ct };
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.route('https://**', async (route) => {
  const r = viaCurl(route.request().url());
  if (!r) return route.abort();
  route.fulfill({ status: 200, contentType: r.contentType, body: r.body, headers: { 'access-control-allow-origin': '*' } });
});

const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${port}/1939/`, { waitUntil: 'domcontentloaded', timeout: 120000 });

// Wait for the map to actually settle: engine.js sets window.__mapIdle on
// the map's first 'idle' event (terrain + tiles drawn). #bgFallback also
// fades on a 3.5 s timer after 'load', so the class is not a settled signal.
await page.waitForFunction(
  () => window.__mapIdle === true,
  { timeout: 240000 },
).catch(() => {});
await page.waitForTimeout(1500); // let the last frame settle
await page.evaluate(() => {
  // app/1939/page.tsx injects the story into a `display:contents` wrapper
  // div, so #bgMap/#bgVeil/#grade are NOT direct children of <body> —
  // hiding "body > *" would hide that whole wrapper (and the map with it).
  // visibility:hidden (inheritable, overridable by a descendant) sidesteps
  // that regardless of nesting depth.
  const style = document.createElement('style');
  style.textContent = `
    body *{visibility:hidden!important}
    #bgMap,#bgMap *,#bgVeil,#grade{visibility:visible!important}
    #bgMap .maplibregl-ctrl,#bgMap .maplibregl-ctrl *{visibility:hidden!important}
  `;
  document.head.appendChild(style);
  document.body.style.background = '#000';
});
await page.waitForTimeout(500);

await page.screenshot({ path: posterPath, type: 'jpeg', quality: 15 });
await browser.close();
server.close();

const kb = (statSync(posterPath).size / 1024).toFixed(1);
console.log(`Wrote ${posterPath} (${kb} KB)`);
if (Number(kb) > 90) console.warn(`WARNING: poster is ${kb} KB, over the ~90 KB target — lower quality or re-check viewport width.`);
