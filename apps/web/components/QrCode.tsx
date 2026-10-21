import type { Qr } from '@/lib/qr';

/** The mark's two dots (design/icon-b-dots.svg), in its 1024 box: big ink is today, small accent is next. */
export const MARK = { big: { cx: 446, cy: 596, r: 240 }, small: { cx: 714, cy: 320, r: 102 } };
/** The two dots' bounds in that box, so the mark can fill the code's cleared middle. */
const MARK_BOX = { x: 206, y: 218, size: 630 };

/** One of the three corner eyes: a rounded ring around a rounded square. */
function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g className="qr-ink">
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={2} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} fill="currentColor" />
    </g>
  );
}

/**
 * The branded code: round dots, rounded eyes, the Semli mark in the middle. Four modules of
 * white all round, the quiet zone the QR spec asks for; less and cameras miss it.
 */
export function QrCode({ qr, label }: { qr: Qr; label: string }) {
  const { size, hole } = qr;
  const s = hole.size / MARK_BOX.size;
  return (
    <svg viewBox={`-4 -4 ${size + 8} ${size + 8}`} role="img" aria-label={label}>
      <path className="qr-ink" d={qr.dots} fill="currentColor" />
      <Eye x={0} y={0} />
      <Eye x={size - 7} y={0} />
      <Eye x={0} y={size - 7} />
      <g transform={`translate(${hole.at} ${hole.at}) scale(${s}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})`}>
        <circle className="qr-ink" cx={MARK.big.cx} cy={MARK.big.cy} r={MARK.big.r} fill="currentColor" />
        <circle className="qr-accent" cx={MARK.small.cx} cy={MARK.small.cy} r={MARK.small.r} fill="currentColor" />
      </g>
    </svg>
  );
}
