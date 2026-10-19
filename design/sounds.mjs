// Generates Semli's UI sounds as small 16-bit mono WAVs, written to both apps.
// Run from the repo root: node design/sounds.mjs
//
// Every cue is a soft mallet: a fundamental plus a couple of overtones that die
// faster than it does, a breath of noise for the strike, and a gentle low-pass.
// Notes sit in the C major pentatonic (C D E G A), mostly in octaves 4 and 5,
// so any two cues sound fine together and none of them is shrill. Peaks stay
// well under full scale; these should sit under the user's music.
//
// Selection changes (chips, segments, day picker) are haptic-only on purpose,
// so there is no select sound: sounds mark outcomes, not browsing.

import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 44100;
const OUT = ['apps/mobile/assets/sounds', 'apps/web/public/sounds'];

// Pentatonic pitches used below, in Hz.
const E4 = 329.63, G4 = 392, A4 = 440, C5 = 523.25, D5 = 587.33, E5 = 659.25, A5 = 880;

/** Overtones as [ratio, gain, how many times faster than the fundamental they decay]. */
const MALLET = [[1, 1, 1], [2, 0.18, 2], [3.98, 0.06, 4]];
const MUTED = [[1, 1, 1], [2, 0.08, 2.5]];

/** One struck note. */
function note({ at = 0, freq, dur, gain = 0.3, decay = 18, partials = MALLET, strike = 0.03 }) {
  return { at, freq, dur, gain, decay, partials, strike };
}

const SOUNDS = {
  // Checking off a to-do: a rising fifth, the second note left to ring.
  complete: [note({ freq: D5, dur: 0.12, gain: 0.24, decay: 28 }), note({ at: 0.07, freq: A5, dur: 0.38, gain: 0.26, decay: 11 })],
  // Un-checking: one soft lower note.
  uncomplete: [note({ freq: A4, dur: 0.14, gain: 0.2, decay: 30, partials: MUTED })],
  // Semli finished reading something: a single bell, a little brighter and longer.
  ready: [note({ freq: E5, dur: 0.5, gain: 0.24, decay: 8, partials: [[1, 1, 1], [2, 0.22, 1.6], [3, 0.08, 3]] })],
  // Plans saved, onboarding done, sample loaded: a low note that lands on a warm dyad.
  success: [
    note({ freq: G4, dur: 0.14, gain: 0.22, decay: 24 }),
    note({ at: 0.09, freq: C5, dur: 0.6, gain: 0.2, decay: 7 }),
    note({ at: 0.09, freq: E5, dur: 0.6, gain: 0.14, decay: 8, strike: 0 }),
  ],
  // Deleting or clearing: two quick muted notes, stepping down.
  remove: [note({ freq: A4, dur: 0.08, gain: 0.2, decay: 36, partials: MUTED }), note({ at: 0.07, freq: E4, dur: 0.16, gain: 0.22, decay: 26, partials: MUTED })],
  // Undo: the same two notes, stepping up.
  undo: [note({ freq: E4, dur: 0.08, gain: 0.2, decay: 36, partials: MUTED }), note({ at: 0.07, freq: A4, dur: 0.16, gain: 0.2, decay: 24, partials: MUTED })],
  // Before something destructive (reset data): two even low taps, a knock rather than a chime.
  warning: [note({ freq: G4, dur: 0.09, gain: 0.22, decay: 34, partials: MUTED, strike: 0.05 }), note({ at: 0.13, freq: G4, dur: 0.12, gain: 0.22, decay: 30, partials: MUTED, strike: 0.05 })],
  // Something went wrong: two low, quick descending notes.
  error: [note({ freq: D5, dur: 0.1, gain: 0.22, decay: 30 }), note({ at: 0.11, freq: A4, dur: 0.2, gain: 0.22, decay: 18 })],
};

// Seeded so regenerating gives byte-identical files.
let seed = 1;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function render(notes) {
  const length = Math.ceil(Math.max(...notes.map((n) => n.at + n.dur)) * RATE) + 64;
  const buf = new Float32Array(length);
  for (const n of notes) {
    const start = Math.round(n.at * RATE);
    const count = Math.round(n.dur * RATE);
    const attack = Math.round(0.003 * RATE);
    const release = Math.round(0.015 * RATE);
    const strikeLen = Math.round(0.004 * RATE);
    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      let s = 0;
      for (const [ratio, g, k] of n.partials) s += g * Math.exp(-n.decay * k * t) * Math.sin(2 * Math.PI * n.freq * ratio * t);
      if (i < attack) s *= i / attack;
      if (i > count - release) s *= (count - i) / release;
      if (i < strikeLen) s += n.strike * noise() * (1 - i / strikeLen);
      buf[start + i] += n.gain * s;
    }
  }
  // One-pole low-pass around 5 kHz takes the edge off the strike and top overtone.
  const a = Math.exp((-2 * Math.PI * 5000) / RATE);
  for (let i = 1; i < buf.length; i++) buf[i] = (1 - a) * buf[i] + a * buf[i - 1];
  return buf;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

for (const dir of OUT) mkdirSync(dir, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  const file = wav(render(notes));
  for (const dir of OUT) writeFileSync(`${dir}/${name}.wav`, file);
  console.log(`${name}.wav  ${(file.length / 1024).toFixed(1)} KB`);
}
