import { PhotoHeader } from '@/components/PhotoHeader';
import { SKY } from '@/lib/images';
import { skySlot } from '@/lib/sky';
import { useTheme } from '@/theme';

/** The sky behind Today's header, by the hour; credits in docs/photo-credits.md. */
export function SkyHeader({ time }: { time: string }) {
  const { c, dark } = useTheme();
  const slot = skySlot(time, dark);
  // Keyed by slot: the launch sky is decoded before the splash lifts; a new hour's sky fades in.
  return <PhotoHeader key={slot} source={SKY[slot]} height={330} to={c.canvas} fadeFrom={0.45} />;
}
