# clips/

Nine `.mp4` excerpts played by the film sections of the story
(`app/story.html`):

- `k2-clip-1.mp4` … `k2-clip-4.mp4` — from video A
- `k2b-clip-1.mp4` … `k2b-clip-5.mp4` — from video B

They are excerpts of other people's documentaries (*Quest for K2: Savage
Mountain*, National Geographic 2000, and another documentary). As of
2026-07-19 they are committed and served on the public site by the owner's
decision — short, credited excerpts inside a transformative historical
narrative (fair-use posture). Because of this, **the repo must stay
private**, every excerpt must keep its on-page credit, and clips must come
down promptly if a rights holder objects.

## Regenerating

1. Download the two source documentaries locally:
   - Video A — `youtube.com/watch?v=sshB4SaGhwY`
   - Video B — `youtube.com/watch?v=lxL_bzt7Pyo`
     (*Quest for K2: Savage Mountain*, National Geographic, 2000)
2. With `ffmpeg` installed, run from the repo root:

   ```sh
   scripts/make-clips.sh /path/to/videoA.mp4 /path/to/videoB.mp4
   ```

All timestamps and encoding settings live in `scripts/make-clips.sh`.

## Era reels (added 2026-07-30 — files not yet cut)

The era pages carry reserved film frames that degrade to an era-styled
"reel pending" state until these files exist. Naming convention:

- `k86-clip-1.mp4`, `k86-clip-2.mp4` — /1986, The Black Summer
- `k95-clip-1.mp4` — /1995, One Day as a Tiger
- `k08-clip-1.mp4` — /2008, The Bottleneck

Candidate sources (Sam sources the files; same fair-use posture as the 1939
excerpts — short, credited, transformative, removed on objection):

- **2008** — *The Summit* (dir. Nick Ryan, 2012), the documentary account of
  the disaster.
- **1986** — Kurt Diemberger's K2 film material, which appears in his own
  documentaries and in later K2 films; any documentary treatment of the
  Black Summer.
- **1995** — broadcast news coverage of August 1995, or the BBC's Hargreaves
  documentary material.

When a source is chosen, add `excerpt` lines for it in
`scripts/make-clips.sh` (same encoding settings), update the on-page
`film-cap` credit to name the work, and keep excerpts short.
