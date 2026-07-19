# K2 1939 — "The Mountain That Swallowed Them"

Immersive single-page scrollytelling site about the 1939 American K2
expedition. Plain static files, no build step, no dependencies beyond the
CDN-loaded MapLibre GL and Google Fonts already referenced in `index.html`.

## Zero-regression rule

Current behavior **is** the spec. Any change must leave the page functionally
identical unless the change itself is the point. Do not rename, reformat,
"modernize," or add dependencies/build tooling while touching these files.
After any structural change, run the smoke checklist in `README.md` against a
local server.

## Content accuracy rule

All dates, quotes, and altitudes follow the documented 1939 record (Kauffman
& Putnam 1992, Jordan 2010, and the sources in the colophon). **Never invent
or "improve" historical facts** — not even plausible-sounding ones. The camp
lat/lons in `js/engine.js` (`CAMPS`) are flagged approximations placed along
the Abruzzi route; altitudes and dates are as documented. That caveat is
stated in the site's own UI (`#m3dNote`, colophon) and must stay true.

## Copyright rule

The files in `clips/` are excerpts of other people's documentaries
(*Quest for K2: Savage Mountain* © National Geographic, and another
documentary — see `clips/README.md`). **Never commit them, never deploy them
publicly.** `clips/*.mp4` is gitignored; keep it that way. If clips are ever
added to the repo, the repo must remain private.

## Module boundaries

`index.html` (markup, incl. the vignette SVGs in `#stage`) loads, in order:

- `css/main.css` — all styles. Design language: Kopke1638/L'Équipe-inspired;
  Cormorant Garamond + Jost + Source Serif 4 + Special Elite; palette tokens
  in `:root` (`--ivory`, `--ink`, `--bronze`, `--wine`, …).
- `js/engine.js` — MapLibre 3D terrain background (keyless: AWS terrarium DEM
  + Esri imagery + hillshade), scroll-scrubbed camera, camp/climber markers,
  the 17-event timeline, vignette + grade + snow control, clip autoplay and
  sound toggles, memorial flame, explore mode, lite mode.
- `js/chrome.js` — progress bar, `.reveal` transitions, chapter covers, rail
  nav highlighting, altimeter.
- `js/extras.js` — WebAudio wind engine, letterbox during video, timeline
  scrubber, typewriter on the record panel, evidence-doc flip, starfield,
  memorial-night trigger.

All three are classic-script IIFEs at the end of `<body>`; they communicate
only through guarded `window.__*` globals (`__scrubSet`, `__vig`, `__grade`,
`__alt`, `__flame`, `__exploreOn`, `setGrade`). Load order matters — keep it.

## Where the data lives

In `js/engine.js`:

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
  to DOM element ids, so renaming/removing an id in `index.html` silently
  breaks the camera path. The 7th field is the color-grade class
  (`g-day`, `g-storm`, `g-night`, `g-dusk`, `g-mourn`, `g-city`) styled in
  `css/main.css`; `snowSet()` maps grades to snow-particle modes.
- `VIG` (≈line 369) — event-index → vignette mapping; zone vignettes are
  bound just below it (`ch1-zone`→nyc, `ch6-zone`→tent, ch5 steps→pair).

In `js/extras.js`: the scrubber's own `DATES` (≈line 54) plus `TRG`/`PH`
(tragic/phase tick indices) — these must stay in sync with the 17 events in
`js/engine.js`.

The 17 timeline steps themselves are the `.over-step[data-ev]` elements in
`index.html` (`#ev0`–`#ev16`); `data-alt` attributes drive the altimeter.
