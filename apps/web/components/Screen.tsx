import Image from 'next/image';
import { SCREENS, type ShotName } from './screens';

/** The capture's size on disk (public/screens, see its README). */
const SHOT = { width: 660, height: 1434 };
/** The status bar and Dynamic Island at the top of every capture, cropped away here. */
const STATUS_BAR = 110;

/**
 * A real app screen without the phone around it: the capture in a rounded
 * rectangle, status bar cropped off, cut to `ratio` (width / height) from the
 * top so the part that matters reads large. Use it where a bezel would only
 * add noise; `Shot` keeps the iPhone for the one place it earns it.
 */
export function Screen({ name, width = 320, ratio = 660 / 900, label, priority, className }: { name: ShotName; width?: number; ratio?: number; label: string; priority?: boolean; className?: string }) {
  return (
    <div className={`screen ${className ?? ''}`.trim()} role="img" aria-label={label} style={{ width, maxWidth: '100%', aspectRatio: `${ratio}` }}>
      <Image
        src={SCREENS[name]}
        alt=""
        placeholder="blur"
        priority={priority}
        sizes={`${width}px`}
        style={{ display: 'block', width: '100%', height: 'auto', marginTop: `${(-STATUS_BAR / SHOT.width) * 100}%` }}
      />
    </div>
  );
}
