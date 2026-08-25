---
name: readme-screenshots
description: Regenerate the screenshot gallery in README.md — build the static site, drive a headless browser through the hub and all four story pages, capture the map/UI at meaningful scroll positions, and optimize the images into docs/screenshots/. Use whenever the visual design of the hub or a story page changes (new era, restyled cards, a new hero treatment) and the README's screenshots go stale.
---

# README screenshots

Produces the gallery images referenced in `README.md`'s Screenshots table.
Run this after any change that alters what the site *looks* like — a new
hero variant shipped, a card treatment changed, a new era page added — not
after routine content or copy edits.

## Where screenshots live

`docs/screenshots/*.jpg` — **not** `public/`. Anything under `public/` is
copied verbatim into the static export and served from
k2.storytimemaps.com; screenshots for the README have no business in the
production bundle. Keep them at repo-root `docs/` instead.

## The one non-obvious part: Chromium can't reach the internet directly here

This is a Claude Code **remote execution sandbox** detail, not a project
detail — skip this whole section if you're running the skill from a normal
machine with a normal internet connection (e.g. Sam's laptop); a plain
Playwright launch works fine there.

In the remote sandbox, outbound HTTPS is intercepted by a local
TLS-terminating proxy (`$HTTPS_PROXY`, `/root/.ccr/README.md`). `curl` and
Node's own `fetch`/`https` go through it fine. **Chromium's own network
stack does not** — every `https://` request Chromium makes itself comes
back `net::ERR_CONNECTION_RESET`, regardless of `--proxy-server`,
`--ignore-certificate-errors`, or disabling QUIC/ECH/post-quantum
key-share feature flags (all tried; none fixed it — the reset happens
during Chromium's own TLS handshake with the proxy, not a policy block).

The fix: never let Chromium make the HTTPS request. Intercept every
external request with Playwright's `page.route()` and fulfill it using
Node's `fetch` instead (which the proxy handles fine):

```js
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
    await route.abort();
  }
});
```

This site depends on several external hosts at runtime — Google Fonts,
the MapLibre GL JS CDN build, the AWS terrarium DEM tiles, Esri/Maxar
imagery — so without this the terrain and type never render and every
screenshot comes back blank/unstyled. `capture.mjs` in this folder already
has it wired in; only worry about it if you're writing a new script from
scratch.

## Steps

1. **Build and serve the static export** (from the repo root):

   ```sh
   pnpm install
   pnpm build
   npx serve out -l 3000 &   # or: pnpm preview, then adjust the port below
   ```

2. **Install Playwright + sharp somewhere that isn't this repo's
   `package.json`.** This project is deliberately dependency-light (see
   `CLAUDE.md`) — don't add screenshot tooling to `dependencies`. Use a
   scratch directory instead:

   ```sh
   mkdir -p /tmp/readme-shots && cd /tmp/readme-shots
   npm init -y >/dev/null
   npm install --no-save playwright sharp
   ```

3. **Find the Chromium binary** the harness pre-installed (don't run
   `playwright install` — it's already there):

   ```sh
   find /opt/pw-browsers -maxdepth 2 -iname chrome -type f
   ```

4. **Copy `capture.mjs` and `optimize.mjs`** from this skill folder into
   the scratch directory, edit `EXECUTABLE_PATH` to match step 3 and the
   `SHOTS` list to match what changed, then run:

   ```sh
   node capture.mjs     # writes raw PNGs to ./shots/
   node optimize.mjs    # resizes to 1280px wide, JPEG q84, writes ./optimized/
   ```

5. **Review every image before committing.** Read each file back (the
   Read tool renders images) — check text isn't mid-typewriter-animation,
   markers/labels aren't overlapping mid-transition, and the terrain
   actually loaded (a grey/blank rectangle means the fetch-proxy route
   didn't cover something — check the page's console errors).

6. **Copy the finished JPEGs into `docs/screenshots/`** in this repo,
   replacing the ones that changed. Keep filenames stable when an image is
   simply being refreshed (same route/moment, new visual) so the README's
   `<img>` references don't need editing — only touch `README.md`'s table
   when adding or removing a shot.

7. **Clean up**: kill the `serve`/preview process; the scratch directory
   and its `node_modules` never need to enter this repo.

## Shot list (current gallery — extend, don't just replace)

Each entry is `[name, route, what happens before the shot]`. Wait ~5–6s
after `goto` for terrain tiles + fonts to settle before capturing.

| name | route | action |
|---|---|---|
| `hub-hero` | `/` | none — top of page |
| `hub-scroll` | `/` | `scrollTo(0, 1800)` — the century scrubber + terrain with camps |
| `hub-ledger` | `/` | `scrollIntoViewIfNeeded()` on `.chart` — the deaths-by-altitude chart |
| `1939-hero` | `/1939` | none — top of page |
| `1939-terrain` | `/1939` | `scrollTo(0, 3200)` — narrative prose over live terrain |
| `1939-evidence` | `/1939` | `scrollIntoViewIfNeeded()` on `.doc.front` — the evidence flip-cards |
| `1986-hero` | `/1986` | none — top of page |
| `1995-hero` | `/1995` | none — top of page |
| `2008-hero` | `/2008` | none — top of page |

Good candidates to add later: explore mode (`click('#btnExplore')` then
wait ~3.5s — the location-card labels can overlap mid-camera-move, so
retry the scroll position if the first attempt looks cluttered), the
memorial/night beat, an era page's mid-story moment once one settles
enough to be worth screenshotting.

## Updating README.md

The Screenshots section is an HTML `<table>` (plain Markdown can't do an
image grid) — three per row, an `<img>` row followed by a caption row.
Keep captions to one line, write them like the rest of the README (plain,
specific, no marketing adjectives) and keep `alt` text descriptive since
screenshots aren't otherwise indexed.
