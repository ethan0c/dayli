/**
 * UI sounds and haptics for the site, matching the app's cues (same WAVs, from design/sounds.mjs).
 * Only deliberate actions trigger a cue; nothing plays on load or scroll.
 */
export type Cue = 'tap' | 'select' | 'ready' | 'success' | 'remove' | 'error';

const CUES: Record<Cue, { vibrate: number | number[]; sound?: string }> = {
  tap: { vibrate: 10 },
  select: { vibrate: 6, sound: 'select' },
  ready: { vibrate: 20, sound: 'ready' },
  success: { vibrate: [12, 60, 12], sound: 'success' },
  remove: { vibrate: 14, sound: 'remove' },
  error: { vibrate: [20, 60, 20], sound: 'error' },
};

const KEY = 'semli:sounds';
const listeners = new Set<() => void>();

export function soundsOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundsOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  listeners.forEach((l) => l());
}

export function subscribeSounds(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function buffer(name: string): Promise<AudioBuffer | null> {
  let b = buffers.get(name);
  if (!b) {
    b = fetch(`/sounds/${name}.wav`)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx!.decodeAudioData(data))
      .catch(() => null);
    buffers.set(name, b);
  }
  return b;
}

async function play(name: string) {
  if (typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  const buf = await buffer(name);
  if (!buf) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.5;
  src.buffer = buf;
  src.connect(gain).connect(ctx.destination);
  src.start();
}

/**
 * Android browsers take navigator.vibrate. iOS Safari doesn't, but toggling a native
 * `<input switch>` gives a system tick (the same trick expo-haptics uses on the web).
 */
function haptic(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
    return;
  }
  if (!matchMedia('(pointer: coarse)').matches) return;
  try {
    const label = document.createElement('label');
    label.ariaHidden = 'true';
    label.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    label.remove();
  } catch {}
}

export function feedback(cue: Cue) {
  if (typeof window === 'undefined') return;
  const { vibrate, sound } = CUES[cue];
  haptic(vibrate);
  if (sound && soundsOn()) play(sound).catch(() => {});
}
