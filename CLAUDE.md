# K2 — "One Mountain, Four Storms"

Immersive scrollytelling site about K2's four great disasters, deployed at
**k2.storytimemaps.com**. A lean Next.js (App Router, `output: 'export'`)
shell around deliberately plain static stories. Package manager: **pnpm**.

Routes (restructured 2026-07-30): **`/` is the hub** (One Mountain, Four
Storms); the original 1939 story lives at **`/1939`**; the era pages at
`/1986`, `/1995`, `/2008`. `/disasters` 301-redirects to `/` (vercel.json).
**All pages use absolute asset paths** (`/js/…`, `/img/…`, `/clips/…`) — the
old "1939 keeps relative paths" rule died with the move to `/1939`.

## Working practices for agents

- **Sam edits `app/1939/story.html` (the 1939 story), `app/hub.html` (the
  hub at `/`), `public/css/main.css`, and this file directly between
  sessions.** Never edit from memory of a previous session's file
  state — re-read the current file first. Editorial HTML comments in the
  story (e.g. the day-count reconciliation note at ev7) are binding guidance.
- Verify changes with `pnpm build` plus a local browser pass
  (`pnpm preview`, smoke checklist in README.md). After `git push`
  (auto-deploys production in ~15 s), confirm with `vercel ls` and at most
  **one** request to the live domain — repeated automated polling tripped
  Vercel's firewall Security Checkpoint on 2026-07-20.
- When adding new text containers to the story, extend the narration
  playlist selector (`SEL` in `public/js/extras.js`) so "Play story" reads
  them, and check the typewriter still targets the intended `.record`.

## Zero-regression rule

Current behavior **is** the spec. Any change must leave the page functionally
identical unless the change itself is the point. After any structural change,
run `pnpm build && pnpm preview` and go through the smoke checklist in
`README.md`.

## The story stays plain HTML/CSS/JS — do not React-ify it

`app/1939/story.html` is the entire 1939 story markup **verbatim** (including its three
classic `<script>` tags at the end). `app/1939/page.tsx` injects it untouched via
`dangerouslySetInnerHTML` inside a `display: contents` wrapper, so the
browser parses and executes it exactly like the original single-file page —
scripts run synchronously, in order, after the DOM above them, before React
hydrates (hydration never touches the injected subtree). **Do not convert the
story to JSX/components, do not route its assets through the bundler, do not
add client components around it.** The Next layer exists only for the head
(`app/layout.tsx` Metadata API + hoisted stylesheet links) and for deployment.

## Story structure rule (Sam, 2026-07-20)

The map is the spine; prose is the "why." Chapter IV's cards carry only
positions, movement, dates, altitudes, and supplies. Chapter V = the summit
decision; Chapter VI = the cascade of misread signals below (its typewritten
record is the dated signals log); Chapter VII = the fight over blame, with
the verdict withheld — the evidence-room documents deliver the reveal (the
note's contents, the diary's contents, the historiography, and Curran's
synthesis live ONLY there). The glacier-returns beat (1993/1995/2002,
the mitten) appears only in the memorial. No beat may appear in both a
chapter and the map log — when editing, relocate, don't retell.

## Content accuracy rule

All dates, quotes, and altitudes follow the documented 1939 record (Kauffman
& Putnam 1992, Jordan 2010, and the sources in the colophon). **Never invent
or "improve" historical facts.** The camp lat/lons in `public/js/engine.js`
(`CAMPS`) are flagged approximations placed along the Abruzzi route; that
caveat is stated in the site's own UI (`#m3dNote`, colophon) and must stay
true.

## Copyright rule

`public/clips/*.mp4` are excerpts of other people's documentaries (*Quest for
K2: Savage Mountain* © National Geographic, and another documentary — see
`public/clips/README.md`). Owner's decision (Sam, 2026-07-19): they are
committed and served publicly as short, credited excerpts inside a
transformative historical narrative (fair-use posture). Consequences that
must hold:

- **The repo stays private.**
- Every clip keeps its on-page credit ("footage © the filmmakers"); never
  strip captions or extend excerpt lengths casually.
- If a rights holder objects, remove the clips immediately (re-gitignore
  them; the page degrades to black film frames).

The expedition portraits in `public/img/` (Jack Durrance Collection /
American Alpine Club, plus Wolfe's 1919 passport photograph) follow the same
posture and must keep their credits in the cards and colophon.

## Module boundaries

- `app/layout.tsx` — head only: metadata, favicon, Google Fonts +
  `/css/main.css` links (React 19 `precedence` hoisting).
- `app/page.tsx` — the hub: metadata + hub fonts/`disasters.css` links,
  injects `app/hub.html`. `app/1939/page.tsx` — metadata only, injects
  `app/1939/story.html` (fonts + `main.css` come from the layout).
- `app/1939/story.html` — the 1939 story markup, incl. the vignette SVGs in
  `#stage` and the three script tags. Asset paths are absolute (`/clips/…`,
  `/js/…`) because the page serves from `/1939`.
- `app/hub.html` — the hub markup (century scrubber, cover cards, the
  altitude wall, the ledger); loads the era-* scripts like an era page.
- `public/css/main.css` — all styles. Design language: Kopke1638/L'Équipe-
  inspired; type system (settled 2026-07-20): **Fraunces** (display/headlines/
  numerals — variable, opsz 9–144, real italics; hero + covers at 600, solid
  ivory with the `#hand-text` letterpress-worn filter), **Jost** (geometric
  sans for the micro layer — kickers/HUD/labels/buttons/altimeter),
  **Newsreader** (body — 1930s-newsprint-derived; body weight 380, not 300),
  **Special Elite** (the typewritten record — keep).
  Palette tokens in `:root` (`--ivory`, `--ink`, `--bronze`, `--wine`, …).
  Standing rules (Sam, 2026-07-20): **no tan/bronze-colored text** — bronze
  lives only in hairlines, borders, and the progress bar; markers and map
  labels are **vintage-print style** — solid deep-ink figures (no SVG
  strokes, no glows, offset-print paper shadow) and cream paper chips with
  ink text. The Wochita brush font was tried and rejected; files remain in
  `public/fonts/` unused. **Big Shoulders Text was tried and rejected**
  (Sam, 2026-07-21) — too condensed to read at label sizes; Jost is the
  micro face. Micro type sits at .66–.78rem — do not shrink it back toward
  the old .44–.62rem, which was illegible.
  **Card treatment** (Sam, 2026-07-24; supersedes 2026-07-21): the floating
  card surfaces `.panel`, `.over-card`, `.mem-inner` are layered for
  legibility — the element itself has **no background and no blend**; a
  `::before` (z-index −2) carries `rgb(255 255 255 / 92%)` +
  `mix-blend-mode:color` (the neutral see-through), and a `::after`
  (z-index −1) adds a normal-blend `rgb(250 247 240 / 60%)` veil that lifts
  contrast evenly. Text therefore paints at full ink — putting the blend on
  the whole element made text luminance depend on the terrain behind it,
  which is what made it hard to read. Do **not** add `backdrop-filter`, and
  do **not** give these elements permanent transforms/opacity (that isolates
  the blend layer and kills the see-through). `.doc` and `.record` are paper
  documents: solid `--cream`, no blend.
- `public/js/engine.js` — MapLibre 3D terrain background (keyless: AWS
  terrarium DEM + Esri imagery + hillshade), scroll-scrubbed camera,
  camp/climber markers, the 17-event timeline, vignette + grade + snow
  control, clip autoplay and sound toggles, memorial flame, explore mode
  (incl. the location record cards: in explore, camps are clickable and
  open `#locCard` — a per-location dossier whose own scrubber steps the 17
  events by calling `applyEvent(i, true)`; blurbs in `LOCNOTES` restate
  facts already in the story/data, never new claims), lite mode.
- `public/js/chrome.js` — progress bar, `.reveal` transitions, chapter
  covers, rail nav highlighting, altimeter.
- `public/js/extras.js` — WebAudio wind engine, letterbox during video,
  timeline scrubber, typewriter, evidence-doc flip, starfield, memorial-night
  trigger, and the "Play story" narration (Web Speech API — keyless/free;
  reads curated narrative blocks in DOM order, auto-scrolling to each; text
  is snapshotted at load because the typewriter empties the record's
  paragraphs; stops on toggle or on entering explore mode).

The three JS files are classic-script IIFEs; they communicate only through
guarded `window.__*` globals (`__scrubSet`, `__vig`, `__grade`, `__alt`,
`__flame`, `__exploreOn`, `setGrade`). Load order (engine → chrome → extras)
matters — keep it.

## The era pages (added 2026-07-24): /1986 · /1995 · /2008 · /disasters

The 1939 story gained three sibling disaster pages and a hub, each following
the same injection pattern (verbatim story HTML via `dangerouslySetInnerHTML`;
never React-ify):

- `app/1986/`, `app/1995/`, `app/2008/`, `app/disasters/` — each holds a
  `page.tsx` (metadata + era font/CSS links via `precedence`, injects its
  sibling `story.html`) and a `story.html`. **Era pages use absolute asset
  paths** (`/js/…`, `/css/…`) because they serve from sub-routes; only the
  1939 page keeps relative paths.
- Era pages inherit the root layout (1939 fonts + `main.css`) and re-skin it
  with a per-era stylesheet loaded after it: `public/css/era1986.css`
  (Kodachrome/carbon-paper: Archivo Black, Courier Prime, Kodak red),
  `era1995.css` (newsprint/tabloid: Oswald, Tinos, VT323 teletext, halftone,
  the "trial" peel-back headlines — pastiche mastheads only, never real
  papers), `era2008.css` (dark tracking console: IBM Plex Mono/Sans, signal
  green, timestamps), `disasters.css` (hub keeps the 1939 identity; year
  accents `--y39/--y86/--y95/--y08` are a validated colorblind-safe set).
- Shared era JS (classic-script IIFEs, same `window.__*` globals contract as
  the 1939 files, load order era-map → era-chrome → era-extras):
  - `public/js/era-map.js` — generalized engine.js. **All story data comes
    from `window.__ERA`**, set by an inline script at the end of each era
    `story.html`: points/routes/people/events/features/moments/camera `keys`
    (anchored to DOM ids — renaming an id silently breaks the camera),
    locnotes/pointStates (explore cards), flame, explore view. The timeline
    zone is `#timeline-zone` with `.over-step[data-ev]` steps `#ev0…`.
  - `public/js/era-chrome.js` — chrome.js sibling; rail links discovered
    from the DOM; altimeter is **metric-first** (era `data-alt` values are
    metres; 1939 stays feet).
  - `public/js/era-extras.js` — extras.js sibling; scrubber dates read from
    `__ERA.events`; adds the 1995 `.tr-item` peel toggle; narration/wind/
    typewriter/evidence-docs/stars work as on the 1939 page.
- The 1939 page links onward via the `.epochs` block before the footer (its hub link points to `/`), and
  every era page carries the fixed `.eranav` switcher + footer cross-links.
- Content accuracy rule applies in full: the 1986/1995/2008 pages follow the
  documented record (Curran 1987, Diemberger 1991, Rose & Douglas 1999,
  Bowley 2010, Zuckerman & Padoan 2012, Viesturs & Roberts 2009, and the
  Wikipedia disaster articles). Imagery (owner's decision, Sam 2026-07-30):
  the era pages may carry **freely licensed photography** (public domain /
  CC via Wikimedia Commons, hotlinked with license + photographer credited
  in the caption and colophon — verify the license via the Commons API
  before adding) and **reserved film frames** (`/clips/k86-…`, `k95-…`,
  `k08-…`) that degrade to an era-styled "reel pending" state until Sam cuts
  short credited excerpts under the same fair-use posture as 1939 (see
  `public/clips/README.md`). **No unlicensed 1986–2008 photography, ever**;
  nothing from the disaster seasons themselves is freely licensed. The 1995
  front pages must stay invented pastiches and say so on-page — and no
  free-license photograph of Alison Hargreaves exists, a fact the 1995 page
  states deliberately.

## Hero variants — undecided (2026-07-30)

The 1939 opening has three alternative cover treatments parked behind a
query parameter, after the mid-century survival-manual and expedition-book
covers Sam collected. **None is the default**; with no parameter the original
prologue renders untouched.

- `/1939?hero=pamphlet` — Air Ministry Pamphlet 224: cream bands across the
  terrain, heavy caps knocked in, blue rule, AAC imprint band.
- `/1939?hero=savage` — Houston & Bates *K2: The Savage Mountain*: cut-paper
  caps on the photograph, teal dek block, wine strip under the subtitle.
- `/1939?hero=manual` — FM 21-76 / *The Survival Book*: bordered ivory sheet,
  index line, four-cell stat register.

Markup: the `.hero-v` blocks inside `.prologue` in `app/1939/story.html`; styles
in the v15 section of `main.css`; the switch is a parse-time inline script at
the top of `app/1939/story.html` (inline so there's no flash of the default —
inline scripts execute because the story is server-rendered into the HTML,
not injected client-side). **When one is chosen, fold it into the prologue
markup and delete the other two plus the switch.**

Two rules the variants encode, worth keeping if they're rewritten:

- Band lines are sized from their own character count (`(100vw - 340px) / Nch`),
  not a shared `clamp()`, so both fill the same optical width and the long
  line stops clear of the fixed altimeter. `max-width` cannot do this —
  nowrap text overflows its box instead of shrinking.
- The narration snapshot in `extras.js` skips `display:none` blocks, so only
  the active variant is read aloud.

**Fonts (licensing unresolved).** Display face is The Foregen Rough One /
The Foregen (Vultype Co), self-hosted in `public/fonts/`; GRAHM Sans Rough
is declared as an unused alternate. All three are marked "All rights
reserved" with no embedded licence — **confirm a web/`@font-face` licence
before a variant ships.** The Burn Out cuts Sam sent are watermarked
personal-use demos (every digit renders as the foundry's badge) and are
deliberately **not** in the repo: anything under `public/` is served
publicly, so committing them would republish a personal-use font from
k2.storytimemaps.com.

## Where the data lives

In `public/js/engine.js`:

- `CAMPS` / `ROUTE` (≈line 6) — camp coordinates (approximate) and altitudes
  (documented), Base Camp → Summit.
- `EST` / `CLEARED` / `DIMMED` (≈line 23) — event indices at which each camp
  is established / stripped (the July 20–21 flip, event 9) / abandoned.
- `PEOPLE`, `POS` (≈line 27) — climber colors and the per-event position of
  every marker across the 17 events; `lost:[…]` renders ghost silhouettes.
- `DATES` / `TITLES` / `TRAGIC` / `PHASES` / `REACH` (≈line 55) — HUD text,
  tragic tint, phase labels, progress-line extent per event.
- `FEATURES` / `MOMENTS` (≈line 64) — named-feature pins and moment pins.
- `KEYS` (≈line 219) — the ~45 camera keyframes:
  `[dom-id, camp, zoom, pitch, bearing, y-offset, grade]`. Keyframes anchor
  to DOM element ids, so renaming/removing an id in `app/1939/story.html` silently
  breaks the camera path. The 7th field is the color-grade class
  (`g-day`, `g-storm`, `g-night`, `g-dusk`, `g-mourn`, `g-city`) styled in
  `public/css/main.css`; `snowSet()` maps grades to snow-particle modes.
- `VIG` (≈line 373) — event-index → vignette mapping; zone vignettes are
  bound just below it (`ch1-zone`→nyc, `ch6-zone`→tent, ch5 steps→pair).

In `public/js/extras.js`: the scrubber's own `DATES` (≈line 54) plus
`TRG`/`PH` (tragic/phase tick indices) — keep in sync with the 17 events in
`engine.js`.

The 17 timeline steps are the `.over-step[data-ev]` elements in
`app/1939/story.html` (`#ev0`–`#ev16`); `data-alt` attributes drive the altimeter.

## Build / deploy notes

- `pnpm build` → static export in `out/`; no server runtime, no API routes.
- TypeScript is pinned to v5 (`typescript@^5`) — Next's TS integration does
  not support TS 7 yet.
- The original pre-Next single-file version lives in git history (root
  `index.html` in the first four commits) and behaves as the reference spec.
