import { useMemo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { toQR } from 'toqr';

/** toqr's error-correction level H (its enum is not exported), as the site's code uses. */
const EC_HIGH = 2 as Parameters<typeof toQR>[1];

/**
 * A QR code drawn the site's way (apps/web/lib/qr.ts): round dots, rounded eyes, ink on the page.
 * The web's onboarding shows it so a phone camera opens Semli for iPhone.
 */
export function QrCode({ text, size = 148, ink, paper }: { text: string; size?: number; ink: string; paper: string }) {
  const { n, dots } = useMemo(() => {
    const modules = toQR(text, EC_HIGH);
    const side = Math.sqrt(modules.length);
    const inEye = (x: number, y: number) => (x < 8 && y < 8) || (x >= side - 8 && y < 8) || (x < 8 && y >= side - 8);
    let d = '';
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        if (modules[y * side + x] && !inEye(x, y)) d += `M${x + 0.04} ${y + 0.5}a.46 .46 0 1 0 .92 0a.46 .46 0 1 0-.92 0`;
      }
    }
    return { n: side, dots: d };
  }, [text]);
  const eye = (x: number, y: number) => (
    <>
      <Rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.8} fill="none" stroke={ink} strokeWidth={1} />
      <Circle cx={x + 3.5} cy={y + 3.5} r={1.6} fill={ink} />
    </>
  );
  return (
    <Svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} accessibilityLabel="QR code for Semli for iPhone">
      <Rect x={-2} y={-2} width={n + 4} height={n + 4} rx={3} fill={paper} />
      <Path d={dots} fill={ink} />
      {eye(0, 0)}{eye(n - 7, 0)}{eye(0, n - 7)}
    </Svg>
  );
}
