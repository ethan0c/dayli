'use client';

import { useEffect, useRef } from 'react';
import type { Qr } from '@/lib/qr';
import { APP_STORE_LIVE, APP_STORE_URL } from '@/lib/site';

/** Where the dialog's button goes: the App Store once live, the counted beta link until then. */
export const GET_APP_HREF = APP_STORE_LIVE ? APP_STORE_URL : '/beta?r=demo';

/** The mark's two dots (design/icon-b-dots.svg), in its 1024 box: big ink is today, small accent is next. */
const MARK = { big: { cx: 446, cy: 596, r: 240 }, small: { cx: 714, cy: 320, r: 102 } };
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

/** Four modules of white all round: the quiet zone the QR spec asks for. Less and cameras miss it. */
function QrCode({ qr }: { qr: Qr }) {
  const { size, hole } = qr;
  const s = hole.size / MARK_BOX.size;
  return (
    <svg viewBox={`-4 -4 ${size + 8} ${size + 8}`} role="img" aria-label={APP_STORE_LIVE ? 'QR code to get the iPhone app' : 'QR code to join the iPhone beta waitlist'}>
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

/** The app icon (design/icon-b-dots.svg), the way the App Store shows it. */
function AppIcon() {
  return (
    <svg className="getapp-icon" viewBox="0 0 1024 1024" aria-hidden="true">
      <rect width="1024" height="1024" fill="#1C1B21" />
      <circle cx={MARK.big.cx} cy={MARK.big.cy} r={MARK.big.r} fill="#FFFFFF" />
      <circle cx={MARK.small.cx} cy={MARK.small.cy} r={MARK.small.r} fill="#A796F0" />
    </svg>
  );
}

/**
 * Shown when the site's previews run out: an App Store style header, the copy and the link on
 * the left, a QR for the phone on lavender paper on the right. A native dialog, so focus,
 * Escape and the backdrop come from the browser.
 */
export function GetAppDialog({ open, onClose, qr }: { open: boolean; onClose: () => void; qr: Qr }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="getapp"
      aria-labelledby="getapp-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button type="button" className="getapp-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <div className="getapp-copy">
        <div className="getapp-app">
          <AppIcon />
          <div>
            <div className="getapp-name">Semli</div>
            <div className="getapp-sub">{APP_STORE_LIVE ? 'AI student planner · Free' : 'AI student planner · iPhone beta'}</div>
          </div>
        </div>
        <p className="getapp-kicker">You’ve reached the preview limit.</p>
        <h2 id="getapp-title" className="getapp-title">
          {APP_STORE_LIVE ? <>Keep planning in the <span className="getapp-word">app</span>.</> : <>Join the <span className="getapp-word">iPhone beta</span>.</>}
        </h2>
        <p className="getapp-text">
          {APP_STORE_LIVE
            ? 'Turn syllabi, work schedules, and messages into one plan. Review the dates, then add them alongside your classes and shifts.'
            : 'Keep classes, shifts, and deadlines in one plan. Join the waitlist and we’ll email you when the beta opens.'}
        </p>
        <a className="btn getapp-btn" href={GET_APP_HREF}>
          {APP_STORE_LIVE ? 'Get the iPhone app' : 'Join the waitlist'}
        </a>
      </div>
      <div className="getapp-qr">
        <div className="getapp-code">
          <QrCode qr={qr} />
        </div>
        <span>{APP_STORE_LIVE ? 'Scan with your iPhone to get the app' : 'Scan with your iPhone to join the waitlist'}</span>
      </div>
    </dialog>
  );
}
