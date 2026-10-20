'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const OPTIONS: IntersectionObserverInit = { rootMargin: '0px 0px -8% 0px', threshold: 0.08 };

/**
 * Scroll reveals without wrapping anything: server components mark elements with
 * `data-reveal` (and `--i` for a stagger), this watcher sets `data-in` the first
 * time each one scrolls into view, and globals.css does the motion from the tokens.
 * The hidden state only applies under `@media (scripting: enabled)`, so without
 * JavaScript, or with reduced motion, everything is simply visible.
 *
 * Server-rendered DOM hydrates before this effect runs, so stamping it is safe.
 * A client component's subtree can hydrate later, and React would then find an
 * attribute it never rendered: those use `useReveal` (data-reveal="self") instead
 * and are skipped here.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="self"]):not([data-in])'));
    if (targets.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      for (const el of targets) el.dataset.in = '';
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.in = '';
        io.unobserve(entry.target);
      }
    }, OPTIONS);
    for (const el of targets) io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

/**
 * The same reveal for an element inside a client component: React renders the attributes
 * itself. Returns the ref and whether the element has been seen; render
 * `data-reveal="self" data-in={seen ? '' : undefined}`.
 */
export function useReveal<E extends HTMLElement>(): [React.RefObject<E | null>, boolean] {
  const ref = useRef<E>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      setShown(true);
    }, OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}
