import { localParts } from '@dayli/core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Development only: a fixed clock ("09:41", or "2026-10-19 09:41" to also fix the day) for screenshots, set from dev-clock.txt (lib/dev.ts). */
let devTime: string | null = null;
let devDate: string | null = null;
export function setDevTime(value: string | null) {
  if (!__DEV__) return;
  const m = value ? /^(?:(\d{4}-\d{2}-\d{2}) )?(\d{2}:\d{2})$/.exec(value) : null;
  devDate = m?.[1] ?? null;
  devTime = m?.[2] ?? null;
}

/** Current local date and time, refreshed every 30 s and whenever the app returns to the foreground. */
export function useNow(): { date: string; time: string } {
  const [real, setNow] = useState(() => localParts(new Date()));
  const now = devTime ? { date: devDate ?? real.date, time: devTime } : real;
  useEffect(() => {
    const tick = () => setNow(localParts(new Date()));
    const id = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return now;
}
