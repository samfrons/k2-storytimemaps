#!/usr/bin/env bash
# Regenerate the 9 local video excerpts used by index.html.
#
# Usage: scripts/make-clips.sh <video-A> <video-B>
#   video-A: local download of youtube.com/watch?v=sshB4SaGhwY (K2 documentary)
#   video-B: local download of youtube.com/watch?v=lxL_bzt7Pyo
#            (Quest for K2: Savage Mountain, National Geographic, 2000)
#
# The clips are excerpts of other people's documentaries. Keep them local:
# never commit them, never deploy them publicly (public/clips/*.mp4 is
# gitignored; deploy only via git so they can never reach the public site).

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <video-A (sshB4SaGhwY)> <video-B (lxL_bzt7Pyo)>" >&2
  exit 1
fi

A=$1
B=$2
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/clips"
mkdir -p "$OUT"

# excerpt SRC START END NAME [extra video args...]
# -ss before -i is frame-accurate here because every clip is re-encoded.
excerpt() {
  local src=$1 start=$2 end=$3 name=$4; shift 4
  ffmpeg -y -ss "$start" -t "$((end - start))" -i "$src" \
    "$@" -c:v libx264 -preset veryfast \
    -c:a aac -b:a 96k -movflags +faststart \
    "$OUT/$name.mp4"
}

# Video A — scaled to 1280 wide, crf 25
excerpt "$A"   0   30 k2-clip-1  -vf scale=1280:-2 -crf 25
excerpt "$A"  88  125 k2-clip-2  -vf scale=1280:-2 -crf 25
excerpt "$A" 388  425 k2-clip-3  -vf scale=1280:-2 -crf 25
excerpt "$A" 598  625 k2-clip-4  -vf scale=1280:-2 -crf 25

# Video B — native resolution, crf 24
excerpt "$B"  713  768 k2b-clip-1 -crf 24
excerpt "$B"  793  848 k2b-clip-2 -crf 24
excerpt "$B"  848  897 k2b-clip-3 -crf 24
excerpt "$B"  907  937 k2b-clip-4 -crf 24
excerpt "$B" 1128 1151 k2b-clip-5 -crf 24

echo "Done: 9 clips written to $OUT"
