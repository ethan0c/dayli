import { lavender, motion, palettes, radius, space, typeScale, type Palette } from '@dayli/tokens';

/**
 * The site's CSS variables, emitted from @dayli/tokens so the web and the app
 * share one source of truth. Rendered once into a <style> in layout.tsx.
 * Names stay the ones globals.css and the modules already use.
 */

const WEIGHT = { light: 300, regular: 400, medium: 500, semibold: 600, serif: 400 } as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function colorVars(p: Palette): Record<string, string> {
  return {
    '--canvas': p.canvas,
    '--header': p.header,
    '--row': p.row,
    '--surface': p.surface,
    '--ink': p.inkPrimary,
    '--ink-2': p.inkSecondary,
    '--ink-3': p.inkTertiary,
    '--on-primary': p.onPrimary,
    '--on-accent': p.onAccent,
    '--line': p.line,
    '--nav': p.nav,
    '--scrim': p.scrim,
    '--accent': p.accent,
    '--accent-soft': p.accentSoft,
    '--accent-border': p.accentBorder,
    '--accent-ink': p.accentInk,
    '--control-fill': p.controlFill,
    '--control-ink': p.controlInk,
    '--control-outline': p.controlOutline,
    '--chart-booked': p.chartBooked,
    '--chart-on-booked': p.chartOnBooked,
    '--conflict': p.conflict,
    '--conflict-bg': p.conflictBg,
    '--changed': p.changed,
    '--changed-bg': p.changedBg,
    '--added': p.added,
    '--added-bg': p.addedBg,
    '--chip': p.chip,
  };
}

/** Site-only surfaces, still built from the palette: the purple band and the dark band. */
const bandVars = {
  light: { '--lav-500': lavender[500], '--band-purple': lavender[600], '--band-ink': palettes.light.inkPrimary },
  dark: { '--lav-500': lavender[500], '--band-purple': lavender[800], '--band-ink': '#0F0F12' },
};

const typeVars: Record<string, string> = {};
for (const [name, t] of Object.entries(typeScale)) {
  const k = `--type-${kebab(name)}`;
  typeVars[`${k}-size`] = `${t.size}px`;
  typeVars[`${k}-line`] = `${t.line}px`;
  typeVars[`${k}-weight`] = String(WEIGHT[t.weight]);
  typeVars[`${k}-tracking`] = `${t.tracking}em`;
}

const motionVars = {
  '--dur-fast': `${motion.duration.fast}ms`,
  '--dur-base': `${motion.duration.base}ms`,
  '--dur-slow': `${motion.duration.slow}ms`,
  '--ease': `cubic-bezier(${motion.easing.join(', ')})`,
  '--stagger': `${motion.stagger}ms`,
  '--press-scale': String(motion.press.scale),
  '--press-opacity': String(motion.press.opacity),
};

const shapeVars: Record<string, string> = {};
for (const [k, v] of Object.entries(radius)) shapeVars[`--radius-${k}`] = `${v}px`;
for (const [k, v] of Object.entries(space)) shapeVars[`--space-${k}`] = `${v}px`;

const block = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

export const TOKENS_CSS = [
  `:root{${block({ ...colorVars(palettes.light), ...bandVars.light, ...typeVars, ...motionVars, ...shapeVars })};color-scheme:light}`,
  `@media (prefers-color-scheme: dark){:root{${block({ ...colorVars(palettes.dark), ...bandVars.dark })};color-scheme:dark}}`,
  `[data-semli-theme="dark"]{${block(colorVars(palettes.dark))};color-scheme:dark}`,
].join('\n');
