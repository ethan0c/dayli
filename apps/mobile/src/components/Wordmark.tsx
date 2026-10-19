import { WORDMARK_RATIO, lavender, wordmark } from '@dayli/tokens';
import Svg, { Circle, Path } from 'react-native-svg';

/** The semli. wordmark drawn from the real Onest SemiBold outlines, so it is identical to the icon and the website. */
export function Wordmark({ width = 120, ink, dot = lavender[500] }: { width?: number; ink: string; dot?: string }) {
  const [x, y, w, h] = wordmark.viewBox;
  return (
    <Svg width={width} height={width / WORDMARK_RATIO} viewBox={`${x} ${y} ${w} ${h}`} accessibilityLabel="semli">
      <Path d={wordmark.letters} fill={ink} />
      {wordmark.dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={dot} />
      ))}
    </Svg>
  );
}
