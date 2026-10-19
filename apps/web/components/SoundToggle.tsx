'use client';

import { useSyncExternalStore } from 'react';
import { feedback, setSoundsOn, soundsOn, subscribeSounds } from '@/lib/feedback';

export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSounds, soundsOn, () => true);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      onClick={() => {
        setSoundsOn(!on);
        if (!on) feedback('select');
      }}
    >
      Sounds {on ? 'on' : 'off'}
    </button>
  );
}
