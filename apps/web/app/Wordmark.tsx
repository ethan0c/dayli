import { WORDMARK_RATIO, wordmark } from '@dayli/tokens';

/** The nowli. wordmark from the Onest outlines; colors come from CSS so it follows the theme. */
export function Wordmark({ width = 120 }: { width?: number }) {
  const [x, y, w, h] = wordmark.viewBox;
  return (
    <svg
      width={width}
      height={width / WORDMARK_RATIO}
      viewBox={`${x} ${y} ${w} ${h}`}
      role="img"
      aria-label="nowli"
      style={{ display: 'block' }}>
      <path d={wordmark.letters} fill="currentColor" />
      {wordmark.dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="var(--lav-500)" />
      ))}
    </svg>
  );
}
