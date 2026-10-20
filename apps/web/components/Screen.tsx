import Image from 'next/image';
import type { ReactNode } from 'react';
import { SCREENS, type ShotName } from './screens';

/** The capture's size on disk (public/screens, see its README). */
const SHOT = { width: 660, height: 1434 };
/** The status bar and Dynamic Island at the top of every capture, cropped away here. */
const STATUS_BAR = 90;

/**
 * The grey card a frameless screen stands in. The screen starts a little way
 * down and runs off the card's bottom edge, so the crop is the card's edge,
 * never a fade through a row. Used on paper; inside a grey band the band is
 * the stage (see `.bleed` in home.module.css).
 */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`stage ${className ?? ''}`.trim()}>{children}</div>;
}

/**
 * A real app screen without the phone around it: the capture on its own
 * canvas with the status bar cropped off, rounded at the top, cut flat at
 * `height` where it meets the stage's edge. `width` is close to a phone's
 * logical width so app text stays smaller than the page's. `Shot` keeps the
 * iPhone for the places that earn it.
 */
export function Screen({ name, width = 330, height = 460, label, priority, className }: { name: ShotName; width?: number; height?: number; label: string; priority?: boolean; className?: string }) {
  return (
    <div className={`screen ${className ?? ''}`.trim()} role="img" aria-label={label} style={{ width, height, maxWidth: '100%' }}>
      {/* The crop is its own box, so the padding above it stays clear of the status bar. */}
      <div style={{ overflow: 'hidden' }}>
        <Image
          src={SCREENS[name]}
          alt=""
          placeholder="blur"
          priority={priority}
          sizes={`${width}px`}
          style={{ display: 'block', width: '100%', height: 'auto', marginTop: `${(-STATUS_BAR / SHOT.width) * 100}%` }}
        />
      </div>
    </div>
  );
}
