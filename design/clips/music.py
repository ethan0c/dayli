#!/usr/bin/env python3
"""A placeholder music bed for the clips: a quiet lo-fi loop, 80 bpm in F, four bars repeated.
Standard library only, so it runs anywhere.

    python3 design/clips/music.py design/clips/music/lofi-bed.wav 40

Swap the file for a licensed track before anything is posted (Epidemic Sound, Artlist, or a sound
added inside TikTok and Instagram, which their feeds reward). compose.py takes any WAV, MP3 or M4A.
"""
from __future__ import annotations

import math
import random
import struct
import sys
import wave

RATE = 32000
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT

# Chord tones (Hz) for Fmaj7, Am7, Dm7, Bbmaj7, with the bass root under each.
NOTE = {'F2': 87.31, 'A2': 110.0, 'Bb2': 116.54, 'D2': 73.42, 'D3': 146.83, 'F3': 174.61, 'A3': 220.0, 'Bb3': 233.08, 'C4': 261.63, 'E4': 329.63, 'G4': 392.0}
BARS = [
    (['F3', 'A3', 'C4', 'E4'], 'F2'),
    (['A3', 'C4', 'E4', 'G4'], 'A2'),
    (['D3', 'F3', 'A3', 'C4'], 'D2'),
    (['Bb3', 'D3', 'F3', 'A3'], 'Bb2'),
]


def render(seconds: float) -> list[float]:
    n = int(seconds * RATE)
    out = [0.0] * n
    rnd = random.Random(7)
    loop = len(BARS) * BAR
    two_pi = 2 * math.pi

    # Pad: each chord tone is a sine, its octave, and a slow detune, with a soft envelope.
    for i in range(n):
        t = i / RATE
        bar = int((t % loop) // BAR)
        pos = (t % loop) - bar * BAR
        env = min(pos / 0.4, 1.0) * min((BAR - pos) / 0.6, 1.0)
        s = 0.0
        for name in BARS[bar][0]:
            f = NOTE[name]
            s += math.sin(two_pi * f * t) + 0.25 * math.sin(two_pi * 2 * f * t + 0.3) + 0.5 * math.sin(two_pi * f * 1.004 * t)
        out[i] += 0.045 * env * s

    # Bass on beats 1 and 3, plucked.
    for i in range(n):
        t = i / RATE
        bar = int((t % loop) // BAR)
        pos = (t % loop) - bar * BAR
        hit = pos % (2 * BEAT)
        env = math.exp(-hit * 2.2) * min(hit / 0.01, 1.0)
        out[i] += 0.16 * env * math.sin(two_pi * NOTE[BARS[bar][1]] * t)

    # Drums, placed by beat.
    def add(start: float, samples: list[float]) -> None:
        a = int(start * RATE)
        for k, v in enumerate(samples):
            if a + k < n:
                out[a + k] += v

    kick = [0.5 * math.exp(-k / RATE * 18) * math.sin(two_pi * (45 + 80 * math.exp(-k / RATE * 40)) * k / RATE) for k in range(int(0.3 * RATE))]
    rim = [0.09 * math.exp(-k / RATE * 60) * rnd.uniform(-1, 1) for k in range(int(0.12 * RATE))]
    hat = [0.035 * math.exp(-k / RATE * 160) * rnd.uniform(-1, 1) for k in range(int(0.04 * RATE))]
    bars_total = int(seconds / BAR) + 1
    for b in range(bars_total):
        base = b * BAR
        add(base, kick)
        add(base + 2 * BEAT, kick)
        add(base + 2.5 * BEAT, [v * 0.5 for v in kick])
        add(base + BEAT, rim)
        add(base + 3 * BEAT, rim)
        for e in range(8):
            swing = 0.07 * BEAT if e % 2 else 0
            add(base + e * BEAT / 2 + swing, hat if e % 2 == 0 else [v * 0.6 for v in hat])

    # Vinyl hiss, then a one-pole low-pass for warmth and a soft clip.
    y = 0.0
    a = 1 - math.exp(-two_pi * 2600 / RATE)
    for i in range(n):
        x = out[i] + 0.004 * rnd.uniform(-1, 1)
        y += a * (x - y)
        out[i] = math.tanh(1.6 * y)
    peak = max(abs(v) for v in out) or 1.0
    return [v / peak * 0.6 for v in out]


def main() -> None:
    path = sys.argv[1]
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 40.0
    mono = render(seconds)
    # A little width: the right channel lags by 11 samples.
    lag = 11
    frames = bytearray()
    for i, v in enumerate(mono):
        r = mono[i - lag] if i >= lag else 0.0
        frames += struct.pack('<hh', int(v * 32767), int((0.5 * v + 0.5 * r) * 32767))
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(frames))
    print(f'wrote {path} ({seconds:.0f}s)')


if __name__ == '__main__':
    main()
