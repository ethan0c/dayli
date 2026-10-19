import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * An iPhone drawn from a real device render, with a live mockup composited
 * into the screen cut-out behind the bezel.
 *
 * Geometry is measured off the 944x1902 frame in /phones/iphone-frame.png:
 * the screen cut-out sits at x 51-892, y 48-1853. The screen box runs 4px
 * past it on every side, under the bezel, and is clipped by
 * /phones/iphone-screen-mask.png (the bezel's interior, Dynamic Island
 * included, grown 3px) so no page colour shows between screen and bezel.
 */
const FRAME = { width: 944, height: 1902 };
const SCREEN_BOX = { x: 47, y: 44, width: 850, height: 1814 };
const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const MASK = 'url(/phones/iphone-screen-mask.png) center / 100% 100% no-repeat';

export function PhoneFrame({
  children,
  className = '',
  priority,
  decorative,
  label,
}: {
  children: ReactNode;
  className?: string;
  priority?: boolean;
  /** True when the screen is illustration only, so screen readers skip it. */
  decorative?: boolean;
  /** One sentence describing the screen; the whole phone becomes one image for screen readers. */
  label?: string;
}) {
  return (
    <div
      className={`phone ${className}`.trim()}
      style={{ aspectRatio: `${FRAME.width} / ${FRAME.height}` }}
      aria-hidden={decorative || undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div
        className="phone-screen"
        style={{
          left: pct(SCREEN_BOX.x, FRAME.width),
          top: pct(SCREEN_BOX.y, FRAME.height),
          width: pct(SCREEN_BOX.width, FRAME.width),
          height: pct(SCREEN_BOX.height, FRAME.height),
          mask: MASK,
          WebkitMask: MASK,
        }}
      >
        {children}
      </div>
      {/* Bezel art last, so it covers the screen edges */}
      <Image
        src="/phones/iphone-frame.png"
        alt=""
        width={FRAME.width}
        height={FRAME.height}
        priority={priority}
        sizes="(min-width: 820px) 320px, 70vw"
        className="phone-bezel"
      />
    </div>
  );
}
