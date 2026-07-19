# clips/

Nine local `.mp4` excerpts played by the film sections of the story
(`app/story.html`):

- `k2-clip-1.mp4` … `k2-clip-4.mp4` — from video A
- `k2b-clip-1.mp4` … `k2b-clip-5.mp4` — from video B

The `.mp4` files are **gitignored on purpose**. They are excerpts of other
people's documentaries: never commit them, and never deploy them publicly.
If clips are ever added to the repo, the repo must stay private. Deploy the
site only via git (Vercel git integration), never by uploading the local
working tree or the built `out/` directory — those contain the clips.

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
The site degrades gracefully if the clips are missing — the video frames
simply stay black.
