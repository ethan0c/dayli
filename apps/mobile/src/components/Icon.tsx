import type { IconName } from '@dayli/schema';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconKey =
  | IconName
  | 'home'
  | 'plus'
  | 'x'
  | 'camera'
  | 'image'
  | 'file'
  | 'mic'
  | 'chevronLeft'
  | 'chevronRight'
  | 'undo'
  | 'tick'
  | 'user'
  | 'sparkle'
  | 'alert'
  | 'trash'
  | 'clock';

type El = { d: string } | { rect: [number, number, number, number, number] } | { circle: [number, number, number] };

// 24-unit grid, 1.75 stroke, rounded caps, outline style.
const GLYPHS: Record<IconKey, El[]> = {
  calendar: [{ rect: [3, 4, 18, 18, 3] }, { d: 'M16 2v4M8 2v4M3 10h18' }],
  book: [
    { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z' },
    { d: 'M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5' },
  ],
  check: [{ rect: [3, 3, 18, 18, 4] }, { d: 'm8.5 12 2.5 2.5 4.5-5' }],
  work: [{ rect: [2, 7, 20, 14, 3] }, { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }],
  bag: [{ d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }, { d: 'M3 6h18M16 10a4 4 0 0 1-8 0' }],
  pen: [{ d: 'M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z' }],
  school: [{ d: 'M22 10 12 5 2 10l10 5 10-5z' }, { d: 'M6 12v5c3 3 9 3 12 0v-5' }],
  exam: [{ d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }, { d: 'M14 2v6h6M9 15l2 2 4-4' }],
  heart: [{ d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' }],
  home: [{ d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' }],
  plus: [{ d: 'M12 5v14M5 12h14' }],
  x: [{ d: 'M18 6 6 18M6 6l12 12' }],
  camera: [{ d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' }, { circle: [12, 13, 4] }],
  image: [{ rect: [3, 3, 18, 18, 3] }, { circle: [8.5, 8.5, 1.5] }, { d: 'M21 15l-5-5L5 21' }],
  file: [{ d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }, { d: 'M14 2v6h6' }],
  mic: [{ d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z' }, { d: 'M19 10v2a7 7 0 0 1-14 0v-2M12 19v4' }],
  chevronLeft: [{ d: 'm15 18-6-6 6-6' }],
  chevronRight: [{ d: 'm9 18 6-6-6-6' }],
  undo: [{ d: 'M3 7v6h6' }, { d: 'M21 17a9 9 0 0 0-15-6.7L3 13' }],
  tick: [{ d: 'm5 12 5 5L20 7' }],
  user: [{ circle: [12, 8, 4] }, { d: 'M4 21a8 8 0 0 1 16 0' }],
  sparkle: [{ d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' }, { d: 'M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z' }],
  alert: [{ circle: [12, 12, 9] }, { d: 'M12 8v4M12 16h.01' }],
  trash: [{ d: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6' }],
  clock: [{ circle: [12, 12, 9] }, { d: 'M12 7v5l3 2' }],
};

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 1.75,
}: {
  name: IconKey;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {GLYPHS[name].map((el, i) => {
        if ('d' in el) return <Path key={i} d={el.d} />;
        if ('rect' in el) {
          const [x, y, w, h, rx] = el.rect;
          return <Rect key={i} x={x} y={y} width={w} height={h} rx={rx} />;
        }
        const [cx, cy, r] = el.circle;
        return <Circle key={i} cx={cx} cy={cy} r={r} />;
      })}
    </Svg>
  );
}

