'use client';

import { useEffect, useRef, useState } from 'react';

/** The leading number and whatever follows it: "83%" becomes 83 and "%". */
function split(value: string): { n: number; rest: string } {
  const m = /^(\d+)(.*)$/.exec(value);
  return m ? { n: Number(m[1]), rest: m[2] ?? '' } : { n: NaN, rest: value };
}

/**
 * A number that counts up from zero the first time it scrolls into view, the way
 * the app's counts roll. Three slow beats long, on the token curve; static under
 * reduced motion or when there is no number to count.
 */
export function CountUp({ value }: { value: string }) {
  const { n, rest } = split(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || Number.isNaN(n)) return;
    // Reduced motion, or no observer: `shown` stays null and the final value renders as is.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return;
    const slow = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-slow')) || 360;
    const total = slow * 3;
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / total);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(n * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [n]);

  if (Number.isNaN(n)) return <span ref={ref}>{value}</span>;
  // Server-rendered with the final value, so search engines and no-JS readers see the real number.
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden>{shown ?? n}{rest}</span>
    </span>
  );
}
