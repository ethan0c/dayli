import Image from 'next/image';
import { PhoneFrame } from './PhoneFrame';
import { SCREENS, type ShotName } from './screens';

export type { ShotName };

/**
 * A real screenshot of the app inside the iPhone frame. The capture fills the
 * screen cut-out; the frame's mask hides the Dynamic Island area the same way
 * the App Store screenshots are composed.
 */
export function Shot({ name, width = 300, label, priority, className }: { name: ShotName; width?: number; label: string; priority?: boolean; className?: string }) {
  // The screen box is about 90% of the phone's width.
  const screenPx = Math.round(width * 0.9);
  return (
    <PhoneFrame width={width} label={label} priority={priority} className={className}>
      <Image
        src={SCREENS[name]}
        alt=""
        placeholder="blur"
        priority={priority}
        sizes={`${screenPx}px`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
      />
    </PhoneFrame>
  );
}
