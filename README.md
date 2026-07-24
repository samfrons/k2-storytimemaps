# The Mountain That Swallowed Them — K2, 1939

An immersive single-page scrollytelling site about the 1939 American K2
expedition: a persistent MapLibre GL 3D-terrain background scroll-scrubbed
through ~45 camera keyframes, a 17-event expedition timeline over the real
terrain of the Abruzzi Spur, silhouette vignettes, a synthesized wind engine,
and an explore mode.

Every date, altitude, and quotation follows the documented 1939 record; camp
positions on the terrain are approximations placed along the Abruzzi route.
Sources are in the site's colophon.

## The four disasters

The site now carries K2's four great catastrophes, each told in the design
language of its own era, plus a hub that visualizes them together:

- `/` — **1939**, the original page (sealed-archive paper, Fraunces/Jost)
- `/1986` — **The Black Summer** (Kodachrome slide mounts, typed dispatches)
- `/1995` — **One Day as a Tiger** (newsprint/tabloid, teletext weather, the
  headline "trial")
- `/2008` — **The Bottleneck** (live tracking dashboard, radio log, GPS)
- `/disasters` — **One Mountain, Four Storms**: century scrubber over the
  terrain, four era cover cards, a deaths-by-altitude chart, and the full
  ledger of names

Era pages share `public/js/era-{map,chrome,extras}.js` (a parameterized
sibling of the 1939 engine/chrome/extras; per-page data lives in a
`window.__ERA` config inside each `app/<year>/story.html`) and re-skin
`main.css` with `public/css/era*.css` / `disasters.css`.

## Architecture

A lean Next.js (App Router, static export) wrapper around a deliberately
plain static story:

- `app/story.html` — the entire story markup, **verbatim HTML** (including
  its three classic `<script>` tags), injected untouched by `app/page.tsx`.
  It is intentionally not React components — see `CLAUDE.md`.
- `app/layout.tsx` — head only: title/OG metadata, favicon, font + stylesheet
  links.
- `public/css/main.css`, `public/js/{engine,chrome,extras}.js` — the story's
  styles and behavior, plain files served as-is.
- `public/clips/` — local video excerpts, gitignored (see below).

`next build` emits a fully static site to `out/` (`output: 'export'` — no
server runtime).

## Running

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static export to out/
pnpm preview    # serve out/ (production-equivalent)
```

## Deployment — k2.storytimemaps.com

Deploy on Vercel via the git integration: push to `main` → automatic
production deploy. The domain is attached to the `k2-storytimemaps` project;
DNS lives at the domain's third-party DNS host.

## Video clips & portraits

The nine `.mp4` excerpts in `public/clips/` are excerpts of other people's
documentaries, committed and served publicly as short, credited excerpts in
a transformative historical narrative (owner's decision — see the copyright
rule in `CLAUDE.md`; **the repo must stay private**). Regenerate them from
the two source videos with `scripts/make-clips.sh` (see
`public/clips/README.md`). If they're ever removed, the page still works —
the film frames stay black.

Expedition portraits live in `public/img/` (Jack Durrance Collection /
American Alpine Club, and Wolfe's 1919 passport photograph); every image
keeps its credit in the cast cards and colophon.

## Browser expectations

- **WebGL required** for the 3D terrain. If the map fails, a static
  photograph fallback (`#bgFallback`) appears instead and the story remains
  readable.
- **Lite mode** (the "◐ Lite" button) turns off hillshading, lowers terrain
  exaggeration and pixel ratio, and hides snow — for weak GPUs.
- `prefers-reduced-motion` disables animations, particles, marker lerping,
  and the typewriter effect.

## Smoke checklist (after any structural change)

Verify against `pnpm build && pnpm preview`; the original single-file
version's behavior (git history: `index.html` at the initial commits) is the
spec.

- [ ] Terrain loads behind the loading veil ("Raising the mountain" fades out)
- [ ] Camera scrubs on scroll, smoothly, in **both** directions
- [ ] All 17 timeline steps (Ch IV) update markers, HUD, and scrubber
- [ ] Camp states flip at the **July 20–21** step (Camps I–IV, VI–VII turn
      red/struck; V, VIII, IX dim at July 22)
- [ ] Vignettes appear: NYC skyline in Ch I, the fall at July 22, the lone
      tent in Ch VI (also: haul at Jun 30, pair in Ch V, porters at Jul 20–21,
      rescue at Jul 28–29)
- [ ] All 9 videos autoplay muted when scrolled into view; each "Sound on"
      button unmutes its own clip; letterbox bars appear while a clip is visible
- [ ] Wind toggle ("♪ Wind") starts/stops the wind; level follows altitude
- [ ] "▷ Play story" narrates the text aloud and auto-scrolls block by
      block; pressing again (or entering explore) stops it
- [ ] Explore mode enters (map becomes interactive, story fades) and exits
      cleanly (scroll camera resumes where you are)
- [ ] Explore location cards: camps are clickable; the card opens with the
      camp's record, its scrubber steps the 17 events (climbers, camp
      states, and progress line follow), and closing it — or exiting
      explore — restores the story state
- [ ] Evidence documents flip front/back on tap
- [ ] The expedition record panel types itself on first view
- [ ] Memorial night: stars fade in, the Gilkey flame marker appears
- [ ] Lite toggles hillshade off (terrain visibly flattens in shading)
- [ ] With reduced motion enabled, animations/particles/typewriter are off
- [ ] Browser console shows no hydration errors or React warnings

Era pages (`/1986`, `/1995`, `/2008`, `/disasters`):

- [ ] Terrain loads on each page; loading veil fades
- [ ] Camera scrubs through each page's keyframes in both directions
- [ ] The timeline zone drives markers, HUD, and scrubber on each page
- [ ] Explore mode: sites clickable, location card scrubber steps that
      page's events, exit restores the story
- [ ] 1995: teletext panels render; the four "trial" headlines peel on tap
- [ ] 2008: radio log types itself; the three evidence files bring forward
- [ ] 1986: typed dispatches type; slide-mount diagrams render
- [ ] `/disasters`: century steps recolor the pins; altitude chart marks
      show name tooltips; cover cards link to all four stories
- [ ] `.epochs` block on the 1939 page links to the three era pages + hub
- [ ] Era switcher (`.eranav`) present on era pages and hidden in explore
