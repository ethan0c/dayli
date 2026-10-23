/**
 * Motion tokens. Every animation in the app and on the site uses one of these;
 * nothing picks its own duration or spring. See docs/motion.md for the rules.
 *
 * Two springs: `snappy` for things under the finger (presses, toggles, checks,
 * segmented controls), `gentle` for rolling digits and continuous values.
 * Three durations for layout, entrances, fades and color changes, and one slow
 * breath for skeletons. Motion settles without overshooting or pulsing in size.
 */
export const motion = {
  spring: {
    // At least critical damping (2 * sqrt(stiffness * mass)): settle without
    // oscillating. Clamp the target too, including when a gesture adds velocity.
    snappy: { damping: 37, stiffness: 380, mass: 0.9, overshootClamping: true },
    gentle: { damping: 28, stiffness: 190, mass: 1, overshootClamping: true },
  },
  duration: { fast: 120, base: 220, slow: 360 },
  /** Each half of a skeleton's breath, dim then back; slow enough to read as waiting, not flicker. */
  pulse: 700,
  /** The one easing curve for timed animations (CSS cubic-bezier form). */
  easing: [0.2, 0, 0, 1] as const,
  /** How far a control shrinks and dims while pressed; `iconScale` for a small round icon button. */
  press: { scale: 0.97, iconScale: 0.9, opacity: 0.88 },
  /** Delay between siblings in a staggered entrance. */
  stagger: 45,
} as const;
