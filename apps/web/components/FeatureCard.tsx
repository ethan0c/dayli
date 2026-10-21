import Image, { type StaticImageData } from 'next/image';
import type { ReactNode } from 'react';
import styles from './feature-card.module.css';

/**
 * A feature row's media: a photo of a real student with one small product card floating
 * over it. The card shows the moment the feature helps, not a whole screen. The photo is
 * decorative; `label` describes the card for screen readers. The card hangs off the left
 * or right edge, so the row alternates with the copy beside it.
 */
export function FeatureCard({ photo, position = 'left', label, children, hang = 'right' }: {
  photo: StaticImageData;
  /** Where the photo's subject sits, so the card does not cover it. */
  position?: string;
  label: string;
  children: ReactNode;
  hang?: 'left' | 'right';
}) {
  return (
    <div className={`${styles.wrap} ${hang === 'left' ? styles.hangLeft : styles.hangRight}`}>
      <div className={styles.photo} aria-hidden>
        <Image src={photo} alt="" fill placeholder="blur" sizes="(max-width: 820px) 100vw, 560px" style={{ objectFit: 'cover', objectPosition: position }} />
      </div>
      <div className={styles.card} role="img" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
