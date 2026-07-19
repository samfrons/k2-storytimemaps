# The Mountain That Swallowed Them — K2, 1939

An immersive single-page scrollytelling site about the 1939 American K2
expedition: a persistent MapLibre GL 3D-terrain background scroll-scrubbed
through ~45 camera keyframes, a 17-event expedition timeline over the real
terrain of the Abruzzi Spur, silhouette vignettes, a synthesized wind engine,
and an explore mode.

Every date, altitude, and quotation follows the documented 1939 record; camp
positions on the terrain are approximations placed along the Abruzzi route.
Sources are in the site's colophon.

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

Deploy on Vercel **via the git integration only**. The clips are gitignored,
so git-based deploys are automatically clip-free (film frames stay black on
the public site — intended; see the copyright note below). Never deploy by
uploading the working tree or `out/` (e.g. `vercel deploy --prebuilt`) —
locally those contain the clips.

Domain: add `k2.storytimemaps.com` to the Vercel project
(Project → Settings → Domains). With `storytimemaps.com` on Vercel DNS the
subdomain is wired automatically; otherwise add a CNAME for `k2` →
`cname.vercel-dns.com`.

## Video clips

The nine `.mp4` excerpts in `public/clips/` are **not** committed — they are
excerpts of other people's documentaries (never commit or publicly deploy
them). See `public/clips/README.md` for regeneration from the two source
videos with `scripts/make-clips.sh`. Without them the page still works; the
film frames stay black.

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
- [ ] Explore mode enters (map becomes interactive, story fades) and exits
      cleanly (scroll camera resumes where you are)
- [ ] Evidence documents flip front/back on tap
- [ ] The expedition record panel types itself on first view
- [ ] Memorial night: stars fade in, the Gilkey flame marker appears
- [ ] Lite toggles hillshade off (terrain visibly flattens in shading)
- [ ] With reduced motion enabled, animations/particles/typewriter are off
- [ ] Browser console shows no hydration errors or React warnings
