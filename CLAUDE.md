# K2 1939 — "The Mountain That Swallowed Them"

Immersive single-page scrollytelling site about the 1939 American K2
expedition, deployed at **k2.storytimemaps.com**. A lean Next.js (App Router,
`output: 'export'`) shell around a deliberately plain static story. Package
manager: **pnpm**.

## Zero-regression rule

Current behavior **is** the spec. Any change must leave the page functionally
identical unless the change itself is the point. After any structural change,
run `pnpm build && pnpm preview` and go through the smoke checklist in
`README.md`.

## The story stays plain HTML/CSS/JS — do not React-ify it

`app/story.html` is the entire story markup **verbatim** (including its three
classic `<script>` tags at the end). `app/page.tsx` injects it untouched via
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
- `app/page.tsx` — reads and injects `app/story.html`. Nothing else.
- `app/story.html` — all story markup, incl. the vignette SVGs in `#stage`
  and the three script tags. Relative asset paths (`clips/…`, `js/…`) resolve
  against the `/` route — keep them relative.
- `public/css/main.css` — all styles. Design language: Kopke1638/L'Équipe-
  inspired; type system (settled 2026-07-20): **Fraunces** (display/headlines/
  numerals — variable, opsz 9–144, real italics; hero + covers at 600, solid
  ivory with the `#hand-text` letterpress-worn filter), **Big Shoulders Text**
  (condensed grotesque for kickers/HUD/labels/altimeter — the sports-journal/
  instrument voice), **Newsreader** (body — 1930s-newsprint-derived; body
  weight 380, not 300), **Special Elite** (the typewritten record — keep).
  Palette tokens in `:root` (`--ivory`, `--ink`, `--bronze`, `--wine`, …).
  Standing rules (Sam, 2026-07-20): **no tan/bronze-colored text** — bronze
  lives only in hairlines, borders, and the progress bar; markers and map
  labels are **vintage-print style** — solid deep-ink figures (no SVG
  strokes, no glows, offset-print paper shadow) and cream paper chips with
  ink text. The Wochita brush font was tried and rejected; files remain in
  `public/fonts/` unused.
- `public/js/engine.js` — MapLibre 3D terrain background (keyless: AWS
  terrarium DEM + Esri imagery + hillshade), scroll-scrubbed camera,
  camp/climber markers, the 17-event timeline, vignette + grade + snow
  control, clip autoplay and sound toggles, memorial flame, explore mode,
  lite mode.
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
- `KEYS` (≈line 215) — the ~45 camera keyframes:
  `[dom-id, camp, zoom, pitch, bearing, y-offset, grade]`. Keyframes anchor
  to DOM element ids, so renaming/removing an id in `app/story.html` silently
  breaks the camera path. The 7th field is the color-grade class
  (`g-day`, `g-storm`, `g-night`, `g-dusk`, `g-mourn`, `g-city`) styled in
  `public/css/main.css`; `snowSet()` maps grades to snow-particle modes.
- `VIG` (≈line 369) — event-index → vignette mapping; zone vignettes are
  bound just below it (`ch1-zone`→nyc, `ch6-zone`→tent, ch5 steps→pair).

In `public/js/extras.js`: the scrubber's own `DATES` (≈line 54) plus
`TRG`/`PH` (tragic/phase tick indices) — keep in sync with the 17 events in
`engine.js`.

The 17 timeline steps are the `.over-step[data-ev]` elements in
`app/story.html` (`#ev0`–`#ev16`); `data-alt` attributes drive the altimeter.

## Build / deploy notes

- `pnpm build` → static export in `out/`; no server runtime, no API routes.
- TypeScript is pinned to v5 (`typescript@^5`) — Next's TS integration does
  not support TS 7 yet.
- The original pre-Next single-file version lives in git history (root
  `index.html` in the first four commits) and behaves as the reference spec.
