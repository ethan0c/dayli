import { useCallback, useEffect, useRef, useState } from 'react';

import { durations } from '@/lib/motion';

/**
 * Rows just completed hold their place while the check fills, then move to the done group.
 * `settle(id)` starts the hold; the list sorts a settling row as if it were still open.
 */
export function useSettling(): [string[], (id: string) => void] {
  const [settling, setSettling] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const settle = useCallback((id: string) => {
    setSettling((ids) => [...ids, id]);
    timers.current.push(setTimeout(() => setSettling((ids) => ids.filter((x) => x !== id)), durations.slow * 2));
  }, []);
  return [settling, settle];
}
