// README screenshot capture — see SKILL.md for full instructions.
//
// Run from a scratch directory with `playwright` installed
// (npm install --no-save playwright). Requires the static site served at
// BASE_URL (pnpm build && npx serve out -l 3000, or pnpm preview).
//
// Only needed in the Claude Code remote sandbox: Chromium's own TLS stack
// gets reset by the sandbox's intercepting proxy on every https:// request,
// so every external resource (fonts, MapLibre GL JS, terrain/imagery tiles)
// is instead fetched with Node's fetch (which the proxy handles fine) and
// handed back to the page via page.route(). Running this on a normal
// machine with normal internet works the same way but the interception is
// harmless overhead there, not required — leave it in either way.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:3000';
const EXECUTABLE_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'; // update to match `find /opt/pw-browsers -maxdepth 2 -iname chrome -type f`
const OUT = new URL('./shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: EXECUTABLE_PATH,
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

async function installFetchProxy(page) {
  await page.route('https://**/*', async (route) => {
    const req = route.request();
    try {
      const resp = await fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postDataBuffer() ?? undefined,
      });
      const body = Buffer.from(await resp.arrayBuffer());
      const headers = {};
      resp.headers.forEach((v, k) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) headers[k] = v;
      });
      await route.fulfill({ status: resp.status, headers, body });
    } catch (e) {
      console.log('[fetchproxy error]', req.url(), e.message);
      await route.abort();
    }
  });
}

async function shot(name, path, run = async () => {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await installFetchProxy(page);
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[console:${name}]`, m.text().slice(0, 200)); });
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(5000); // let terrain tiles + fonts settle
  await run(page);
  await page.screenshot({ path: `${OUT}${name}.png` });
  await page.close();
  console.log('captured', name);
}

// See SKILL.md's shot-list table for what each of these is and why.
await shot('hub-hero', '/');
await shot('hub-scroll', '/', (p) => p.evaluate(() => window.scrollTo(0, 1800)).then(() => p.waitForTimeout(2000)));
await shot('hub-ledger', '/', (p) => p.locator('.chart').scrollIntoViewIfNeeded().then(() => p.waitForTimeout(2000)));
await shot('1939-hero', '/1939');
await shot('1939-terrain', '/1939', (p) => p.evaluate(() => window.scrollTo(0, 3200)).then(() => p.waitForTimeout(2000)));
await shot('1939-evidence', '/1939', (p) => p.locator('.doc.front').first().scrollIntoViewIfNeeded().then(() => p.waitForTimeout(2000)));
await shot('1986-hero', '/1986');
await shot('1995-hero', '/1995');
await shot('2008-hero', '/2008');

await browser.close();
console.log('done — raw PNGs in', OUT);
