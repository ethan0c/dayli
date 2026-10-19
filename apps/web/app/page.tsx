import Link from 'next/link';
import { PhoneFrame } from '@/components/PhoneFrame';
import { FREE_IMPORTS_PER_MONTH, PLUS_PRICE } from '@/lib/site';
import { TryIt } from './TryIt';

const CAL = 'M3 4h18v18H3z M16 2v4M8 2v4M3 10h18';
const BOOK = 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z';
const WORK = 'M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16';
const BAG = 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18M16 10a4 4 0 0 1-8 0';
const EXAM = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 15l2 2 4-4';

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const WEEK = [
  ['19', 'mon'],
  ['20', 'tue'],
  ['21', 'wed'],
  ['22', 'thu'],
  ['23', 'fri'],
  ['24', 'sat'],
  ['25', 'sun'],
];

/** The Plan screen, drawn in CSS so it stays crisp and follows the site's light/dark theme. */
function PlanScreen() {
  return (
    <div className="screen">
      <div className="head">
        <div className="clockrow">
          <div className="clock">11:50</div>
          <div className="date">
            Oct 20
            <br />
            Tuesday
          </div>
        </div>
        <div className="week">
          {WEEK.map(([n, d]) => (
            <span key={n} className={n === '20' ? 'sel' : undefined}>
              <b>{n}</b>
              <small>{d}</small>
            </span>
          ))}
        </div>
      </div>
      <div className="rows">
        <div className="row">
          <Glyph d={BOOK} />
          <span className="t">Pharm reading, ch. 12</span>
          <span className="ck" />
        </div>
        <div className="row ev">
          <Glyph d={CAL} />
          <span className="t">Adult Health lecture</span>
          <span className="chip">9:00 am</span>
        </div>
        <div className="row ev personal">
          <Glyph d={BOOK} />
          <span className="t">Study · Pharm</span>
          <span className="chip">1:00 pm</span>
        </div>
        <div className="row">
          <Glyph d={BAG} />
          <span className="t">Buy scrubs</span>
          <span className="ck" />
        </div>
        <div className="row ev work">
          <Glyph d={WORK} />
          <span className="t">Olive Garden shift</span>
          <span className="chip">4–10 pm</span>
        </div>
        <div className="row ev">
          <Glyph d={EXAM} />
          <span className="t">Pharm exam 2</span>
          <span className="chip">Fri</span>
        </div>
      </div>
      <div className="navpill" aria-hidden="true">
        <span className="on">Today</span>
        <span>Plan</span>
        <span>School</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>The daily planner for college students.</h1>
          <p>
            Drop in a syllabus, a work schedule, or a quick message. Dayli reads the dates, spots what changed, and
            tells you what matters today. You never have to type it in.
          </p>
          <div className="cta">
            <a className="btn" href="#try">
              Drop in a schedule
            </a>
            <span className="btn ghost" aria-disabled="true" title="iPhone beta coming soon">
              iPhone beta soon
            </span>
          </div>
        </div>

        <PhoneFrame className="hero-phone" priority decorative>
          <PlanScreen />
        </PhoneFrame>
      </section>

      <section className="steps" aria-label="How it works">
        <div className="step">
          <h3>Send it the mess</h3>
          <p>A screenshot of next week&apos;s shifts, a syllabus PDF, or a text like &ldquo;exam Monday, work Fri 4–10&rdquo;.</p>
        </div>
        <div className="step">
          <h3>Check what it found</h3>
          <p>Every date and time, with the line it came from. Anything unclear gets a question, not a guess.</p>
        </div>
        <div className="step">
          <h3>See what changed</h3>
          <p>A new work schedule is compared with the old one. You confirm the changes; nothing gets doubled up.</p>
        </div>
      </section>

      <TryIt />

      <section className="teaser">
        <div>
          <h2>Free to start. Plus for the whole semester.</h2>
          <p>
            Free gives you the calendar, tasks, reminders, and {FREE_IMPORTS_PER_MONTH} AI imports a month. Plus is unlimited imports
            for ${PLUS_PRICE.semester} a semester, or ${PLUS_PRICE.yearly} a year.
          </p>
        </div>
        <Link className="btn ghost" href="/pricing">
          See pricing
        </Link>
      </section>
    </main>
  );
}
