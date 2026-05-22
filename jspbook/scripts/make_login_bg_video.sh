#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "사용법: $0 <원본영상경로> [출력경로]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

SRC="$1"
OUT="${2:-$PROJECT_ROOT/src/main/webapp/media/operator-login-bg-loop.mp4}"
POSTER="$(dirname "$OUT")/operator-login-bg-poster.jpg"
TMPDIR="$(mktemp -d)"
SLOW="$TMPDIR/slow.mp4"
REV="$TMPDIR/rev.mp4"
LIST="$TMPDIR/list.txt"
mkdir -p "$(dirname "$OUT")"

ffmpeg -y -i "$SRC" \
  -an \
  -vf "setpts=1.8181818182*PTS,scale=1920:1080:flags=lanczos,fps=24,format=yuv420p" \
  -movflags +faststart \
  -c:v libx264 -preset slow -crf 20 \
  "$SLOW"

ffmpeg -y -i "$SLOW" -an -vf reverse -c:v libx264 -preset slow -crf 20 "$REV"

printf "file '%s'\nfile '%s'\n" "$SLOW" "$REV" > "$LIST"
ffmpeg -y -f concat -safe 0 -i "$LIST" -an -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart "$OUT"
ffmpeg -y -i "$OUT" -frames:v 1 -update 1 "$POSTER"

DUR=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$OUT")
echo "완료"
echo "video=$OUT"
echo "poster=$POSTER"
echo "duration=$DUR"
