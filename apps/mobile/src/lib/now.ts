import { localParts } from '@dayli/core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Current local date and time, refreshed every 30 s and whenever the app returns to the foreground. */
export function useNow(): { date: string; time: string } {
  const [now, setNow] = useState(() => localParts(new Date()));
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
