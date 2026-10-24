import { PhotoHeader } from '@/components/PhotoHeader';
import { SKY } from '@/lib/images';
import { SKY_LOOK, skySlot } from '@/lib/sky';
import { useTheme } from '@/theme';

/** The header's usual height. */
const HEIGHT = 330;
/** How long a dark sky takes to fade into a light page, below what sits on it; the screen leaves that much room. */
export const DARK_FADE = 64;

/**
 * The sky behind Today's header, by the hour; credits in docs/photo-credits.md. A light sky shows
 * at full strength under ink (or under its measured wash, `SKY_LOOK`) and fades into the page from
 * 30% down. A dark sky under a light page keeps its dark part behind everything that sits on it,
 * down to `darkBottom` (the end of the day bar, measured by Today), then fades into the page.
 * Without `darkBottom` (the auth welcome, where nothing sits on the sky) every sky draws the plain way.
 */
export function SkyHeader({ time, darkBottom }: { time: string; darkBottom?: number }) {
  const { c, dark } = useTheme();
  const slot = skySlot(time, dark);
  const look = SKY_LOOK[slot];
  // Keyed by slot: the launch sky is decoded before the splash lifts; a new hour's sky fades in.
  if (dark) return <PhotoHeader key={slot} source={SKY[slot]} height={HEIGHT} to={c.canvas} fadeFrom={0.3} dim={0.1} />;
  if (look.text === 'ink' || darkBottom === undefined) return <PhotoHeader key={slot} source={SKY[slot]} height={HEIGHT} to={c.canvas} fadeFrom={0.3} dim={look.wash} />;
  const height = darkBottom + DARK_FADE;
  return (
    <PhotoHeader key={slot} source={SKY[slot]} height={height} to={c.canvas} fadeFrom={darkBottom / height}
      photoHeight={Math.max(height, darkBottom / (look.darkTo ?? 1))} />
  );
}
