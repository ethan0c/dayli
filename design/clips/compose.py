#!/usr/bin/env python3
"""Faceless marketing clips: a simulator recording inside the site's iPhone frame, a caption on
paper above it, an end card with the beta link. 1080x1920 for TikTok, Reels and Shorts.

    python3 design/clips/compose.py raw/ out/            # every clip in CLIPS with a raw file
    python3 design/clips/compose.py raw/ out/ shifts     # one clip

`raw/<name>.mp4` are `xcrun simctl io booted recordVideo` captures (1320x2868) of the dev build
driven by the demo commands in apps/mobile/src/lib/dev.ts; see docs/launch-guide.md part 2 for
the setup and docs/marketing-500.md for where each clip goes. Geist, sentence case, ink on
paper, no gradients, no voice: captions are the whole script.

Needs ffmpeg and Pillow.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / 'apps/mobile/assets/fonts'
FRAME = ROOT / 'apps/web/public/phones/iphone-frame.png'        # 944x1902, transparent screen
MASK = ROOT / 'apps/web/public/phones/iphone-screen-mask.png'   # 850x1814 at (47, 44)

W, H = 1080, 1920
PAPER, INK, INK2 = (250, 249, 246), (34, 35, 32), (104, 105, 99)
PHONE_W = 800                      # the frame's width on the canvas; it bleeds off the bottom
PHONE_TOP = 560
FPS = 30


@dataclass(frozen=True)
class Clip:
    name: str
    title: str          # the caption, two lines at most
    sub: str            # one quieter line under it
    trim: tuple[float, float] | None = None   # seconds kept from the raw recording
    speed: float = 1.0  # >1 plays the screen faster; waits in the demo are real time


# The eight clips in docs/marketing-500.md. One raw recording can serve two captions.
CLIPS = [
    Clip('shifts', 'Screenshot your work schedule. Done.', 'Semli reads every shift and asks only about the one with no time.'),
    Clip('syllabus', 'A syllabus becomes the whole semester.', 'Every exam, quiz and due date, in two minutes.'),
    Clip('update', 'New schedule? See only what changed.', 'Moved, new and dropped shifts, before anything is saved.'),
    Clip('today', 'Know what matters today.', 'Classes, shifts and due dates ranked, with a countdown to what’s next.'),
    Clip('plan', 'Your whole week as a chart.', 'Lectures, shifts and study time on one timeline. Overlaps show in red.'),
    Clip('evidence', 'It shows its work.', 'Every date comes with the line it was read from. Nothing is saved until you confirm.'),
    Clip('switch', 'Set up a semester in two minutes.', 'Not two hours. Calendar, to-dos and reminders stay free.'),
    Clip('free', 'Calendar, to-dos, reminders: always free.', 'Plus is unlimited imports and Canvas sync. Student pricing, no proof needed.'),
]
END_CARD = ('semli.app/beta', '200 beta spots on iPhone. Link in bio.')


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f'Geist-{name}.ttf'), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words, lines, line = text.split(), [], ''
    for w in words:
        cand = f'{line} {w}'.strip()
        if draw.textlength(cand, font=f) <= width:
            line = cand
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def caption_card(clip: Clip) -> Image.Image:
    """Paper with the caption and the phone frame, screen cut out so the video shows through."""
    img = Image.new('RGBA', (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    margin = 72
    y = 150
    for line in wrap(d, clip.title, font('Medium', 72), W - 2 * margin):
        d.text((margin, y), line, font=font('Medium', 72), fill=INK)
        y += 82
    y += 14
    for line in wrap(d, clip.sub, font('Regular', 36), W - 2 * margin):
        d.text((margin, y), line, font=font('Regular', 36), fill=INK2)
        y += 46
    frame = Image.open(FRAME).convert('RGBA')
    scale = PHONE_W / frame.width
    frame = frame.resize((PHONE_W, round(frame.height * scale)), Image.LANCZOS)
    x = (W - PHONE_W) // 2
    # Punch the screen out of the paper too, so the video is the only thing in that box.
    mask = Image.open(MASK).convert('L').resize((round(850 * scale), round(1814 * scale)), Image.LANCZOS)
    hole = Image.new('L', (W, H), 255)
    hole.paste(Image.eval(mask, lambda v: 255 - v), (x + round(47 * scale), PHONE_TOP + round(44 * scale)))
    img.putalpha(hole)
    img.alpha_composite(frame, (x, PHONE_TOP))
    return img


def end_card() -> Image.Image:
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    title, sub = END_CARD
    tf, sf = font('Light', 104), font('Regular', 40)
    tw = d.textlength(title, font=tf)
    d.text(((W - tw) / 2, H / 2 - 110), title, font=tf, fill=INK)
    sw = d.textlength(sub, font=sf)
    d.text(((W - sw) / 2, H / 2 + 20), sub, font=sf, fill=INK2)
    return img


def render(clip: Clip, raw: Path, out: Path) -> None:
    scale = PHONE_W / 944
    sw, sh = round(850 * scale), round(1814 * scale)
    sx, sy = (W - PHONE_W) // 2 + round(47 * scale), PHONE_TOP + round(44 * scale)
    with tempfile.TemporaryDirectory() as tmp:
        card = Path(tmp) / 'card.png'
        end = Path(tmp) / 'end.png'
        caption_card(clip).save(card)
        end_card().save(end)
        trim = ['-ss', str(clip.trim[0]), '-to', str(clip.trim[1])] if clip.trim else []
        tempo = f'setpts={1 / clip.speed:.4f}*PTS,' if clip.speed != 1 else ''
        # The raw capture is 1320x2868 (the full status bar included); the mask box is 850x1814
        # of a 944x1902 frame, the same proportions, so a plain scale fits.
        filt = (
            f'color=c=0x{PAPER[0]:02x}{PAPER[1]:02x}{PAPER[2]:02x}:s={W}x{H}:r={FPS}[bg];'
            f'[0:v]{tempo}scale={sw}:{sh}:flags=lanczos,fps={FPS}[scr];'
            f'[bg][scr]overlay={sx}:{sy}:shortest=1[v1];'
            f'[v1][1:v]overlay=0:0[v2];'
            f'[2:v]fps={FPS}[endv];'
            f'[v2][endv]xfade=transition=fade:duration=0.5:offset=PLACEHOLDER[v]'
        )
        # Duration of the screen part decides where the end card fades in.
        probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(raw)], capture_output=True, text=True, check=True)
        total = float(probe.stdout.strip())
        if clip.trim:
            total = clip.trim[1] - clip.trim[0]
        total /= clip.speed
        filt = filt.replace('PLACEHOLDER', f'{max(total - 0.5, 0.1):.2f}')
        subprocess.run([
            'ffmpeg', '-y', '-v', 'error',
            *trim, '-i', str(raw),
            '-loop', '1', '-t', str(total + 3), '-i', str(card),
            '-loop', '1', '-t', '3', '-i', str(end),
            '-filter_complex', filt, '-map', '[v]',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', '-an',
            str(out),
        ], check=True)


def main() -> None:
    raw_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    only = set(sys.argv[3:])
    out_dir.mkdir(parents=True, exist_ok=True)
    for clip in CLIPS:
        if only and clip.name not in only:
            continue
        raw = raw_dir / f'{clip.name}.mp4'
        if not raw.exists():
            print(f'skip {clip.name}: no {raw}')
            continue
        out = out_dir / f'{clip.name}.mp4'
        render(clip, raw, out)
        print(f'wrote {out}')


if __name__ == '__main__':
    main()
