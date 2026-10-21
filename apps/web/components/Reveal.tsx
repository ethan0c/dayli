'use client';

import { createElement, useEffect, useRef, useState, type HTMLAttributes } from 'react';

const OPTIONS: IntersectionObserverInit = { rootMargin: '0px 0px -8% 0px', threshold: 0.08 };

/**
 * Own the reveal attributes in React so each element starts observing only after
 * its own hydration. A layout's effect cannot assume streamed pages have hydrated.
 * Render the original tag to preserve layout and semantics; children can stay
 * server-rendered. Motion and stagger timing still come from globals.css.
 */
export function Reveal({ as = 'div', ...props }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'p' | 'h2' | 'section' }) {
  const [ref, shown] = useReveal<HTMLElement>();
  return createElement(as, { ...props, ref, 'data-reveal': 'self', 'data-in': shown ? '' : undefined });
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
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Feature detection must happen after hydration to keep the initial markup identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
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
