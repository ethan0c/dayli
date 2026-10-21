import type { CSSProperties, ReactNode } from 'react';
import m from './mock.module.css';
import { PhoneFrame } from './PhoneFrame';

/*
 * The pieces every phone mockup on the site is drawn from. All CSS, no raster,
 * so the screens stay crisp and follow the light and dark theme.
 */

export type Tone = 'ink' | 'green' | 'red' | 'amber' | 'grey';

const TONE_TEXT: Record<Tone, string | undefined> = { ink: m.toneInk, green: m.toneGreen, red: m.toneRed, amber: m.toneAmber, grey: undefined };

/** A phone mockup: the real device render, with a CSS-drawn screen inside. `label` makes the whole phone one image for screen readers. */
export function Phone({ children, width = 300, label, className = '' }: { children: ReactNode; width?: number; label: string; className?: string }) {
  return (
    <PhoneFrame width={width} label={label} className={className}>
      <Screen>{children}</Screen>
    </PhoneFrame>
  );
}

/** The screen box for the real PhoneFrame, which positions its own cut-out. */
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${m.screen} ${className}`.trim()}>{children}</div>;
}

export function Pill({ tone = 'grey', children, style }: { tone?: 'grey' | 'red' | 'redText' | 'green' | 'amber'; children: ReactNode; style?: CSSProperties }) {
  const cls = { grey: '', red: m.pillRed, redText: m.pillRedText, green: m.pillGreen, amber: m.pillAmber }[tone];
  return (
    <span className={`${m.pill} ${cls}`.trim()} style={style}>
      {children}
    </span>
  );
}

export type Lead = 'ring' | 'ringSm' | 'dot' | 'dotGrey' | 'done';

export function LeadMark({ kind }: { kind: Lead }) {
  if (kind === 'done')
    return (
      <span className={`${m.lead} ${m.done}`}>
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5.5 9.2 7.8 11.5 12.5 6.8" />
        </svg>
      </span>
    );
  if (kind === 'ring') return <span className={`${m.lead} ${m.ring}`} />;
  const inner = kind === 'ringSm' ? m.ringSm : kind === 'dotGrey' ? `${m.dot} ${m.dotGrey}` : m.dot;
  return (
    <span className={m.lead}>
      <span className={inner} />
    </span>
  );
}

/** A hairline row: a mark, a title with an optional second line, and whatever acts on the right. */
export function Row({ lead, title, sub, trailing, last, muted, strike, style, index = 0 }: { lead: Lead; title: ReactNode; sub?: ReactNode; trailing?: ReactNode; last?: boolean; muted?: boolean; strike?: boolean; style?: CSSProperties; /** Position among siblings, for the staggered entrance. */ index?: number }) {
  return (
    <div className={`${m.row} ${last ? m.rowLast : ''}`.trim()} style={{ '--i': index, ...style } as CSSProperties}>
      <LeadMark kind={lead} />
      <span className={`${m.rowText} ${muted ? m.muted : ''} ${strike ? m.strike : ''}`.trim()}>
        {title}
        {sub ? <small>{sub}</small> : null}
      </span>
      {trailing}
    </div>
  );
}

export type Segment = { left: number; width: number; tone?: 'ink' | 'green' | 'red' };

/** The day as a horizontal bar, 6 am to midnight. `now` is a percent across the day. */
export function DayBar({ segments, now, labels = true, style }: { segments: Segment[]; now?: number; labels?: boolean; style?: CSSProperties }) {
  return (
    <div style={style}>
      <div className={m.bar}>
        {segments.map((s, i) => (
          <span key={i} className={`${m.seg} ${s.tone === 'green' ? m.segGreen : s.tone === 'red' ? m.segRed : ''}`.trim()} style={{ left: `${s.left}%`, width: `${s.width}%` }} />
        ))}
        {now !== undefined ? <span className={m.now} style={{ left: `${now}%` }} /> : null}
      </div>
      {labels ? (
        <div className={m.barLabels}>
          <span style={{ left: 0 }}>6 am</span>
          <span className={m.barLabelMid} style={{ left: `${100 / 3}%` }}>noon</span>
          <span className={m.barLabelMid} style={{ left: `${200 / 3}%` }}>6 pm</span>
          <span style={{ right: 0 }}>midnight</span>
        </div>
      ) : null}
    </div>
  );
}

export type Block = { top: number; height: number; tone?: 'ink' | 'green' | 'red'; outline?: 'dashed' | 'dropped'; half?: boolean };
export type Day = {
  label: string;
  /** Day of the month, under the weekday, as on Plan. */
  num?: number;
  blocks?: Block[];
  /** Rings at an exam or deadline's time, as a percent of the day. */
  rings?: number[];
  /** The source gave no time: an amber outlined bar. */
  unknown?: boolean;
  /** Text under the bar: "4–10p", "off", "time?". */
  under?: string;
  underTone?: Tone;
};

/** The week as seven vertical day bars, 6 am to midnight. Percents are of the day. */
export function WeekChart({ days, height = 88, style, label }: { days: Day[]; height?: number; style?: CSSProperties; label?: string }) {
  return (
    <div className={m.week} style={{ '--h': `${height}px`, ...style } as CSSProperties} role={label ? 'img' : undefined} aria-label={label}>
      {days.map((d, i) => (
        <div key={i} className={m.day} style={{ '--i': i } as CSSProperties}>
          {d.label}
          {d.num !== undefined ? <span className={m.dayNum}>{d.num}</span> : null}
          <span className={`${m.track} ${d.unknown ? m.trackUnknown : ''}`.trim()}>
            {(d.blocks ?? []).map((b, j) => (
              <span
                key={j}
                className={[m.block, b.tone === 'green' ? m.blockGreen : '', b.tone === 'red' ? m.blockRed : '', b.outline === 'dashed' ? m.blockDashed : '', b.outline === 'dropped' ? m.blockDropped : '', b.half ? m.blockHalf : '']
                  .filter(Boolean)
                  .join(' ')}
                style={{ top: `${b.top}%`, height: `${b.height}%` }}
              />
            ))}
            {(d.rings ?? []).map((top, j) => <span key={`r${j}`} className={m.weekRing} style={{ top: `${top}%` }} />)}
          </span>
          {d.under !== undefined ? <span className={TONE_TEXT[d.underTone ?? 'grey']}>{d.under}</span> : null}
        </div>
      ))}
    </div>
  );
}

export type TermMark = { left: number; kind: 'dot' | 'ring' | 'tick'; tone?: 'ink' | 'red' };

/** The term as one line: month labels above, dots for due dates, rings for exams. */
export function TermLine({ months, marks, style, label }: { months?: { label: string; left: number }[]; marks: TermMark[]; style?: CSSProperties; label?: string }) {
  return (
    <div style={style} role={label ? 'img' : undefined} aria-label={label}>
      {months ? (
        <div className={m.termMonths}>
          {months.map((mo, i) => (
            <span key={i} style={{ left: `${mo.left}%` }}>
              {mo.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className={m.term}>
        {marks.map((k, i) => (
          <span key={i} className={k.kind === 'ring' ? m.termRing : k.kind === 'tick' ? m.termTick : `${m.termDot} ${k.tone === 'red' ? m.termDotRed : ''}`.trim()} style={{ left: `${k.left}%`, '--i': i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

/** One course line on the School map. */
export function MapRow({ code, marks }: { code: string; marks: TermMark[] }) {
  return (
    <div className={m.map}>
      <span className={m.mapCode}>{code}</span>
      <TermLine marks={marks} style={{ flex: 1 }} />
    </div>
  );
}

export function MapHead({ cols }: { cols: string[] }) {
  return (
    <div className={m.mapHead}>
      <span />
      {cols.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}

const TABS = ['Today', 'Plan', 'School', 'You'] as const;

/** The five-tab glass bar: four tabs in a pill and the detached plus. */
export function Tabs({ active }: { active: (typeof TABS)[number] }) {
  return (
    <div className={m.tabs} aria-hidden="true">
      <div className={m.tab}>
        {TABS.map((t) => (t === active ? <b key={t}>{t}</b> : <span key={t}>{t}</span>))}
      </div>
      <div className={m.plus}>+</div>
    </div>
  );
}

/** The glass circle that toggles Today between the list and the hour view. */
export function GlassToggle() {
  return (
    <span className={m.glass} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    </span>
  );
}

export function Toast({ text, action = 'Undo', style }: { text: string; action?: string; style?: CSSProperties }) {
  return (
    <div className={m.toast} style={style}>
      <span>{text}</span>
      <span>{action}</span>
    </div>
  );
}

/** A number that rolls in one character at a time, the site's version of the app's Ticker. */
export function Roll({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`${m.roll} ${className}`.trim()} role="text" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className={m.rollChar} style={{ '--i': i } as CSSProperties} aria-hidden="true">
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  );
}

export function PrimaryPill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={m.primary} style={style}>
      {children}
    </div>
  );
}

const SHIFTS: [string, string | null][] = [
  ['Mon', '4–10 pm'],
  ['Tue', '4–10 pm'],
  ['Wed', null],
  ['Thu', '4–10 pm'],
  ['Fri', '4–10 pm'],
  ['Sat', '9 am–3 pm'],
  ['Sun', '11 am–5 pm'],
];

/** A stand-in for a screenshot of a shift schedule: a white card with grey lines and the week's rows. */
export function ShotCard({ small }: { small?: boolean }) {
  return (
    <div className={`${m.shotCard} ${small ? m.shotSm : ''}`.trim()} aria-hidden="true">
      <div className={m.shotHead}>
        <b>Campus Café · week of Oct 19</b>
        <i />
      </div>
      {SHIFTS.map(([d, t]) => (
        <div key={d} className={m.shotRow}>
          <span>{d}</span>
          <i />
          {t ? <span>{t}</span> : <span className={m.off}>off</span>}
        </div>
      ))}
    </div>
  );
}

/** The hour view of the day: a short column of hours with the blocks in place. */
export function HourView() {
  return (
    <div className={m.hour} aria-hidden="true">
      <div className={m.hLabel} style={{ top: 0 }}>8 am</div>
      <div className={m.hLine} style={{ top: 6 }} />
      <div className={`${m.hBlock} ${m.hDone}`} style={{ top: 24, height: 26 }}>Stats lecture · 9–10:15</div>
      <div className={m.hLabel} style={{ top: 96 }}>noon</div>
      <div className={m.hLine} style={{ top: 102 }} />
      <div className={m.hNow} style={{ top: 138 }} />
      <div className={`${m.hBlock} ${m.hInk}`} style={{ top: 190, height: 130 }}>
        Café shift
        <br />
        <span>4:00 – 10:00 pm</span>
      </div>
      <div className={`${m.hBlock} ${m.hOverlap}`} style={{ top: 255, height: 22 }}>Study group · overlaps</div>
    </div>
  );
}

export { m as mock };
