import { PhotoHeader } from '@/components/PhotoHeader';
import { skySlot, type SkySlot } from '@/lib/sky';
import { useTheme } from '@/theme';

const SKY: Record<SkySlot, number> = {
  dawn: require('../../assets/images/sky/dawn.webp'),
  morning: require('../../assets/images/sky/morning.webp'),
  afternoon: require('../../assets/images/sky/afternoon.webp'),
  golden: require('../../assets/images/sky/golden.webp'),
  night: require('../../assets/images/sky/night.webp'),
};

/** The sky behind Today's header, by the hour; credits in docs/photo-credits.md. */
export function SkyHeader({ time }: { time: string }) {
  const { c, dark } = useTheme();
  const slot = skySlot(time, dark);
  // Keyed by slot so a new hour's sky fades in through PhotoHeader's own load fade.
  return <PhotoHeader key={slot} source={SKY[slot]} height={330} to={c.canvas} fadeFrom={0.45} />;
}
