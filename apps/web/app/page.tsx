import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneFrame } from '@/components/PhoneFrame';
import { FREE_IMPORTS_PER_MONTH, money, plan } from '@/lib/site';
import { TryIt } from './TryIt';
import styles from './home.module.css';

export const metadata: Metadata = { alternates: { canonical: '/' } };

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
          <span className="t">Stats reading, ch. 4</span>
          <span className="ck" />
        </div>
        <div className="row ev">
          <Glyph d={CAL} />
          <span className="t">Psych lecture</span>
          <span className="chip">9:00 am</span>
        </div>
        <div className="row ev personal">
          <Glyph d={BOOK} />
          <span className="t">Study · Stats</span>
          <span className="chip">1:00 pm</span>
        </div>
        <div className="row">
          <Glyph d={BAG} />
          <span className="t">Return library book</span>
          <span className="ck" />
        </div>
        <div className="row ev work">
          <Glyph d={WORK} />
          <span className="t">Café shift</span>
          <span className="chip">4–10 pm</span>
        </div>
        <div className="row ev">
          <Glyph d={EXAM} />
          <span className="t">Stats exam 2</span>
          <span className="chip">Fri</span>
        </div>
      </div>
      <div className="screen-nav" aria-hidden="true">
        <div className="navpill"><span>Today</span><span className="on">Plan</span><span>School</span></div>
        <span className="screen-add">+</span>
      </div>
    </div>
  );
}

function SyllabusPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.document} ${compact ? styles.compact : ''}`}>
      <div className={styles.documentFile}><Glyph d={BOOK} /><span>stats-201.pdf</span></div>
      <p className={styles.documentTitle}>Introduction to Statistics</p>
      <p className={styles.muted}>Fall semester · Course outline</p>
      <div className={styles.documentRule} />
      <p>Course materials and weekly readings</p>
      <p className={styles.highlight}>Oct 20 · Read chapter 4</p>
      <p>Practice problems and review</p>
      <p className={styles.highlight}>Oct 23 · Exam 2</p>
      {!compact ? <p className={styles.muted}>Your dates are already in here.</p> : null}
    </div>
  );
}

function SemesterPreview() {
  return (
    <figure className={styles.semesterPreview}>
      <figcaption className={styles.previewCaption}>A few dates from your syllabus</figcaption>
      <div className={styles.semesterHeader}><Glyph d={BOOK} /><span>Statistics</span><span>Fall semester</span></div>
      <div className={styles.semesterRow}><span>Oct<br /><strong>20</strong></span><div><strong>Read chapter 4</strong><small>Reading · To-do</small></div><span className={styles.checkCircle} aria-hidden="true" /></div>
      <div className={styles.semesterRow}><span>Oct<br /><strong>23</strong></span><div><strong>Exam 2</strong><small>School · Deadline</small></div><Glyph d={EXAM} /></div>
      <div className={styles.semesterRow}><span>Nov<br /><strong>06</strong></span><div><strong>Problem set 5</strong><small>Assignment · Due Friday</small></div><span className={styles.checkCircle} aria-hidden="true" /></div>
      <p className={styles.previewNote}>Review the details before adding them.</p>
    </figure>
  );
}

function ShiftPreview() {
  return (
    <figure className={styles.shiftPreview}>
      <figcaption className={styles.previewCaption}>Campus café · New work schedule</figcaption>
      <div className={styles.shiftRow}><div><strong>Friday, Oct 23</strong><small>Shift time changed</small></div><span><s>4–10 pm</s><strong>5–10 pm</strong></span></div>
      <div className={styles.shiftRow}><div><strong>Saturday, Oct 24</strong><small>New shift</small></div><span><strong>11 am–5 pm</strong></span></div>
      <div className={styles.shiftRow}><div><strong>Sunday, Oct 25</strong><small>Already in your plan</small></div><span><strong>10 am–2 pm</strong></span></div>
      <p className={styles.previewNote}><Glyph d={CAL} />You choose which changes to save.</p>
    </figure>
  );
}

const FAQS = [
  { q: 'What can I send to Semli?', a: 'A message, a screenshot, a photo, or a PDF. Try a syllabus, a class timetable, or a work schedule. PDFs and images can be up to 20 MB.' },
  { q: 'Can I check the dates first?', a: 'Yes. In the app, you review the dates and times, edit anything that needs a fix, and choose what to add. Nothing goes into your plan until you confirm. The demo on this page shows a preview only.' },
  { q: 'Is what I upload kept?', a: 'The website sends your message or file to our AI provider to read it, then shows you the result. Our server does not save the upload or the result. You can read more in our privacy policy.' },
  { q: 'What can I use for free?', a: `The website demo is free to try. The app’s free plan includes the calendar, to-dos, and ${FREE_IMPORTS_PER_MONTH} AI imports each month. Plus offers unlimited imports. The iPhone beta is coming soon.` },
];

export default function Home() {
  return (
    <main className={`page ${styles.home}`}>
      <section className={`hero ${styles.hero}`} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>The daily planner for college students</p>
          <h1 id="home-title">Your week,<br /><span>already organized.</span></h1>
          <p>
            Send Semli what you have. It finds the dates, spots schedule changes, and brings school, work, and life into one place.
          </p>
          <div className="cta">
            <a className="btn" href="#try">
              Try with your schedule <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className={styles.availability}>Try it here. No account needed. <span>iPhone beta coming soon.</span></p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroSource}><SyllabusPreview compact /><p className={styles.sourceCaption}>From your syllabus</p></div>
          <span className={styles.flowArrow} aria-hidden="true">↗</span>
          <PhoneFrame className={`hero-phone ${styles.heroPhone}`} priority decorative><PlanScreen /></PhoneFrame>
          <p className={styles.visualCaption}>An example of your week, brought together.</p>
        </div>
      </section>

      <TryIt />

      <section className={styles.feature} aria-labelledby="semester-title">
        <div className={styles.featureCopy}>
          <p className={styles.eyebrow}>For your semester</p>
          <h2 id="semester-title">Your semester,<br />already mapped out.</h2>
          <p>Your due dates don&apos;t need another round of typing. Add a syllabus and let Semli find the readings, assignments, and exams. Check the details, then make them part of your plan.</p>
          <Link className={styles.textLink} href="/syllabus-to-calendar">See how syllabus imports work <span aria-hidden="true">↗</span></Link>
        </div>
        <SemesterPreview />
      </section>

      <section className={`${styles.feature} ${styles.workFeature}`} aria-labelledby="shifts-title">
        <div className={styles.featureCopy}>
          <p className={styles.eyebrow}>For your work week</p>
          <h2 id="shifts-title">New shifts.<br />A plan that keeps up.</h2>
          <p>When your work schedule changes, send the new one. Semli compares it with your saved shifts so you can see what moved, what&apos;s new, and what stayed the same.</p>
          <Link className={styles.textLink} href="/work-and-school-schedule-planner">Bring work and school together <span aria-hidden="true">↗</span></Link>
        </div>
        <ShiftPreview />
      </section>

      <section className="teaser">
        <div>
          <h2>Free to start. Plus for the whole semester.</h2>
          <p>
            Free gives you the calendar, tasks, reminders, and {FREE_IMPORTS_PER_MONTH} AI imports a month. Plus is unlimited imports
            for {money(plan('semester').student)} a semester, or {money(plan('yearly').student)} a year, for students.
          </p>
        </div>
        <Link className="btn ghost" href="/pricing">
          See pricing
        </Link>
      </section>

      <section className={`faq ${styles.faq}`} aria-labelledby="home-faq-title">
        <div><p className={styles.eyebrow}>Before you try it</p><h2 id="home-faq-title">A few things<br />you might be wondering.</h2><Link className={styles.textLink} href="/privacy">Read our privacy policy <span aria-hidden="true">↗</span></Link></div>
        <div className="faq-list">{FAQS.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-title">
        <p className={styles.eyebrow}>Start with this week</p>
        <h2 id="final-title">One less thing<br />to keep in your head.</h2>
        <p>A syllabus, a screenshot, or a quick message. See what Semli finds.</p>
        <a className="btn" href="#try">Try with your schedule <span aria-hidden="true">↗</span></a>
        <small>No account needed to try the demo.</small>
      </section>
    </main>
  );
}
