#!/bin/zsh
# Record one raw clip from the dev build on the booted simulator (iPhone 17 Pro Max, Metro on 8081).
#
#   design/clips/record.sh <dev-command> <name> <seconds> [deep-link] [link-at-seconds]
#
#   design/clips/record.sh demo shifts 46                       # Today → Add → review → confirm → Plan
#   design/clips/record.sh demo-syllabus syllabus 46
#   design/clips/record.sh review-update update 24
#   design/clips/record.sh list today 24 semli://plan 18
#   design/clips/record.sh sample plan 24 semli://plan 12
#   design/clips/record.sh sample free 30 semli://paywall 14    # prices load a few seconds after
#
# The app is reset first (your simulator data goes; back it up if you care), the clock is pinned to
# Monday Oct 19 09:41, and the launch is a plain one, not the dev-client URL, so no dev toast shows.
# Metro can take 20 s or more to serve the bundle on the first launch after an edit; look at the
# strip in design/clips/stills/<name>.png and set the clip's `start` in compose.py from it. The
# simulator stops writing frames when the screen stops changing, so recordings end early; compose.py
# holds the last frame.
set -e
ROOT=${0:A:h:h:h}
CMD=$1; NAME=$2; SECS=$3; LINK=${4:-}; AT=${5:-0}; CLOCK="2026-10-19 09:41"
RAW=$ROOT/design/clips/raw; STILLS=$ROOT/design/clips/stills
mkdir -p "$RAW" "$STILLS"
xcrun simctl terminate booted app.semli.mobile 2>/dev/null || true
C=$(xcrun simctl get_app_container booted app.semli.mobile data)
for d in Documents "Library/Application Support" Library/Preferences Library/Caches Library/HTTPStorages tmp; do
  [ -d "$C/$d" ] && find "$C/$d" -mindepth 1 -delete
done
mkdir -p "$C/Documents"
print -n "$CLOCK" > "$C/Documents/dev-clock.txt"
print -n "$CMD" > "$C/Documents/dev-command.txt"
xcrun simctl io booted recordVideo --codec=h264 --force "$RAW/$NAME.mp4" > /dev/null 2>&1 &
REC=$!
sleep 1
xcrun simctl launch booted app.semli.mobile > /dev/null
if [ -n "$LINK" ]; then sleep "$AT"; xcrun simctl openurl booted "$LINK"; sleep $((SECS - AT)); else sleep "$SECS"; fi
kill -INT $REC
wait $REC 2>/dev/null || true
sleep 2
echo "$NAME $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RAW/$NAME.mp4")s"
ffmpeg -v error -y -i "$RAW/$NAME.mp4" -vf "fps=1,scale=150:-1,tile=12x4" -frames:v 1 -update 1 "$STILLS/$NAME.png"
