'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Scroll reveals without wrapping anything: server components mark elements with
 * `data-reveal` (and `--i` for a stagger), this watcher sets `data-in` the first
 * time each one scrolls into view, and globals.css does the motion from the tokens.
 * The hidden state only applies under `@media (scripting: enabled)`, so without
 * JavaScript, or with reduced motion, everything is simply visible.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])'));
    if (targets.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      for (const el of targets) el.dataset.in = '';
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = '';
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    for (const el of targets) io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
