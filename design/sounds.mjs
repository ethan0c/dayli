// Generates Nowli's UI sounds as small 16-bit mono WAVs, written to both apps.
// Run from the repo root: node design/sounds.mjs
//
// Every cue is a few soft sine partials with a fast attack and an exponential
// decay, pitched on a C major pentatonic so any two cues sound fine together.
// Peaks stay well under full scale; these should sit under the user's music.

import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 44100;
const OUT = ['apps/mobile/assets/sounds', 'apps/web/public/sounds'];

/** One note: a sine with a touch of its octave, optional pitch glide. */
function note({ at = 0, freq, to = freq, dur, gain = 0.3, decay = 18, shimmer = 0.12 }) {
  return { at, freq, to, dur, gain, decay, shimmer };
}

const SOUNDS = {
  // Chips, segments, day picker, plan cards: a tiny wooden tick.
  select: [note({ freq: 1568, dur: 0.05, gain: 0.16, decay: 70, shimmer: 0.05 })],
  // Checking off a to-do: a quick rising two-note "ding".
  complete: [note({ freq: 1318.5, dur: 0.12, gain: 0.22, decay: 30 }), note({ at: 0.065, freq: 1975.5, dur: 0.32, gain: 0.26, decay: 12 })],
  // Un-checking: one soft lower note.
  uncomplete: [note({ freq: 987.8, dur: 0.12, gain: 0.16, decay: 34 })],
  // Nowli finished reading something: a gentle single bell.
  ready: [note({ freq: 1318.5, dur: 0.4, gain: 0.22, decay: 9, shimmer: 0.2 })],
  // Plans saved, onboarding done, sample loaded: a three-note rising arpeggio.
  success: [
    note({ freq: 1046.5, dur: 0.16, gain: 0.2, decay: 26 }),
    note({ at: 0.07, freq: 1318.5, dur: 0.16, gain: 0.2, decay: 26 }),
    note({ at: 0.14, freq: 1568, dur: 0.5, gain: 0.24, decay: 8, shimmer: 0.18 }),
  ],
  // Deleting or clearing: a short downward glide.
  remove: [note({ freq: 784, to: 392, dur: 0.16, gain: 0.22, decay: 22, shimmer: 0.04 })],
  // Undo: the same glide, upward.
  undo: [note({ freq: 392, to: 784, dur: 0.16, gain: 0.2, decay: 20, shimmer: 0.04 })],
  // Something went wrong: two low, quick descending notes.
  error: [note({ freq: 587.3, dur: 0.1, gain: 0.22, decay: 30, shimmer: 0.25 }), note({ at: 0.11, freq: 440, dur: 0.18, gain: 0.22, decay: 20, shimmer: 0.25 })],
};

function render(notes) {
  const length = Math.ceil(Math.max(...notes.map((n) => n.at + n.dur)) * RATE) + 64;
  const buf = new Float32Array(length);
  for (const n of notes) {
    const start = Math.round(n.at * RATE);
    const count = Math.round(n.dur * RATE);
    const attack = Math.round(0.004 * RATE);
    const release = Math.round(0.012 * RATE);
    let phase = 0;
    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      const f = n.freq * Math.pow(n.to / n.freq, i / count);
      phase += (2 * Math.PI * f) / RATE;
      let env = Math.exp(-n.decay * t);
      if (i < attack) env *= i / attack;
      if (i > count - release) env *= (count - i) / release;
      buf[start + i] += n.gain * env * (Math.sin(phase) + n.shimmer * Math.sin(2 * phase));
    }
  }
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
