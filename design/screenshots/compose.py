"""
App Store screenshots: a caption on paper above the real screen inside the site's iPhone frame.

    python3 design/screenshots/compose.py raw/ out/

`raw/` holds 1320x2868 simulator captures named after SHOTS below; `out/` gets the finished
6.9-inch images (1320x2868, no alpha). Geist, sentence case, ink on paper, no gradients.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / 'apps/mobile/assets/fonts'
FRAME = ROOT / 'apps/web/public/phones/iphone-frame.png'          # 944x1902
MASK = ROOT / 'apps/web/public/phones/iphone-screen-mask.png'     # 850x1814, screen box at (47, 44)

W, H = 1320, 2868
PAPER, INK, INK2 = '#FAF9F6', '#222320', '#686963'
PHONE_W = 1080
PHONE_TOP = 640

# Order matters: the first three show in search results.
SHOTS = [
    ('today', 'Know what matters today', 'Classes, work shifts and due dates in one list, with a countdown to what’s next.'),
    ('review', 'Screenshot your work schedule. Done.', 'Semli reads the shifts and asks only about the one with no time.'),
    ('item', 'New schedule? See only what changed', 'Moved, new and dropped shifts, before anything is saved.'),
    ('plan', 'Your whole week as a chart', 'Lectures, shifts and study time on one timeline. Overlaps show in red.'),
    ('school', 'Every syllabus, mapped to the term', 'Exams and assignments from a PDF, or kept in sync with Canvas.'),
    ('paywall', 'Calendar, to-dos, reminders: always free', 'Plus adds unlimited imports and Canvas sync. Student pricing, no proof needed.'),
]


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f'Geist-{name}.ttf'), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words, lines, line = text.split(), [], ''
    for w in words:
        trial = f'{line} {w}'.strip()
        if draw.textlength(trial, font=f) <= width:
            line = trial
        else:
            lines.append(line)
            line = w
    return lines + [line]


def phone(screen: Image.Image) -> Image.Image:
    frame = Image.open(FRAME).convert('RGBA')
    mask = Image.open(MASK).convert('RGBA').split()[-1]  # the shape is the alpha channel
    s = PHONE_W / frame.width
    out = Image.new('RGBA', (PHONE_W, round(frame.height * s)), (0, 0, 0, 0))
    box = (round(47 * s), round(44 * s), round(850 * s), round(1814 * s))
    shot = screen.convert('RGBA').resize((box[2], box[3]), Image.LANCZOS)
    shot.putalpha(mask.resize((box[2], box[3]), Image.LANCZOS))
    out.alpha_composite(shot, (box[0], box[1]))
    out.alpha_composite(frame.resize(out.size, Image.LANCZOS))
    return out


def compose(raw: Path, title: str, sub: str) -> Image.Image:
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    gutter, y = 96, 150
    big = font('Light', 92)
    for line in wrap(d, title, big, W - 2 * gutter):
        d.text((gutter, y), line, font=big, fill=INK)
        y += 104
    y += 24
    small = font('Regular', 42)
    for line in wrap(d, sub, small, W - 2 * gutter):
        d.text((gutter, y), line, font=small, fill=INK2)
        y += 56
    p = phone(Image.open(raw))
    img.paste(p, ((W - p.width) // 2, max(PHONE_TOP, y + 56)), p)
    return img


if __name__ == '__main__':
    raw_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, (name, title, sub) in enumerate(SHOTS, 1):
        src = raw_dir / f'raw-{name}.png'
        if not src.exists():
            print(f'skip {name}: no {src}')
            continue
        compose(src, title, sub).save(out_dir / f'{i}-{name}.png', optimize=True)
        print(f'{i}-{name}.png')
