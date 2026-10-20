import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PhoneFrame } from '@/components/PhoneFrame';
import { AddPhone, AddedPhone, DiffPhone, HourPhone, PlanPhone, ReviewPhone, SchoolPhone, SyllabusPhone, TodayScreen } from '@/components/Screens';
import { APP_STORE_LIVE, APP_STORE_URL, FREE_IMPORTS_PER_MONTH, money, plan } from '@/lib/site';
import { TryIt } from './TryIt';
import { Waitlist } from './Waitlist';
import styles from './home.module.css';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** From the spring 2026 student survey (docs/pricing-and-positioning.md). No invented counts; public copy says "more than 50". */
const PROOF = [
  { n: '83%', q: 'have missed an assignment because it got buried' },
  { n: '73%', q: 'get due dates from somewhere other than Canvas' },
  { n: '65%', q: 'want reminders on their phone' },
];

const FAQS = [
  { q: 'What can I send to Semli?', a: 'A message, a screenshot, a photo, or a PDF: a syllabus, a class timetable, a work schedule from the scheduling app or the group chat. Files can be up to 20 MB.' },
  { q: 'Can I check the dates first?', a: 'Always. Semli shows what it found as a chart, asks about anything without a time, and adds nothing until you confirm. Every import can be undone.' },
  { q: 'Does it work with Canvas?', a: 'Yes. Paste your Canvas calendar feed link once and your assignments come in on their own, then move when a professor changes a due date. Keeping Canvas in sync is part of Plus. Syllabus PDFs and screenshots of the to-do list work for everyone.' },
  { q: 'Is what I upload kept?', a: 'No. Semli sends your message or file to our AI provider to read it, shows you the result, and keeps neither. Your plan lives on your phone. If you make an account, it’s backed up so a new phone can restore it.' },
  { q: 'What’s free?', a: `The calendar, to-dos, reminders, and ${FREE_IMPORTS_PER_MONTH} AI imports a month, for as long as you like. Plus adds unlimited imports, Canvas sync, and schedule-change comparisons.` },
  { q: 'Is there an Android app?', a: 'Not yet. Semli is on iPhone, with the web for trying it. Android comes if enough campuses ask for it.' },
];

/** Photos are Unsplash, recorded in public/photos/SOURCES.md. They are decorative: empty alt, text carries the meaning. */
const PHOTO_SIZES = '100vw';

function GetApp({ ghost = false }: { ghost?: boolean }) {
  const cls = `btn${ghost ? ' ghost' : ''}`;
  return APP_STORE_LIVE ? <a className={cls} href={APP_STORE_URL}>Get the iPhone app</a> : <Link className={cls} href="/#beta">Join the iPhone beta</Link>;
}

export default function Home() {
  const fromMonthly = money(Math.round((plan('yearly').student / 12) * 100) / 100);
  return (
    <main className={`page ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">The daily planner for college students</p>
          <h1 id="home-title">Your week, already organized.</h1>
          <p className={styles.heroSub}>Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.</p>
          <div className={styles.ctas}>
            <a className="btn accent" href="#try">Try it with your schedule</a>
            <GetApp ghost />
          </div>
          {APP_STORE_LIVE ? <p className={styles.note}>Free on iPhone.</p> : <>
            <p className={styles.note}>iPhone beta opening soon, 200 spots. Leave your email for the link.</p>
            <Waitlist compact />
          </>}
        </div>
        <div className={styles.heroPhone}>
          <div className={styles.heroPhoto} aria-hidden>
            <Image src="/photos/hero.jpg" alt="" fill priority sizes="(max-width: 820px) 100vw, 60vw" />
          </div>
          <PhoneFrame priority width={330} label="Today in Semli: 2 hours 14 minutes until a café shift, the day as a bar, and the list with due and done pills">
            <TodayScreen />
          </PhoneFrame>
        </div>
      </section>

      <TryIt />

      <section className={`${styles.band} ${styles.purple} ${styles.proof}`} aria-label="What students told us">
        <div className={styles.bandPhoto} aria-hidden>
          <Image src="/photos/library.jpg" alt="" fill sizes={PHOTO_SIZES} />
        </div>
        <div className={styles.bandInner}>
          <p className={styles.bandEyebrow}>What students told us</p>
          <div className={styles.stats}>
            {PROOF.map((p) => (
              <div key={p.n} className={styles.stat}>
                <div className={styles.statN}>{p.n}</div>
                <p>{p.q}</p>
              </div>
            ))}
          </div>
          <p className={styles.source}>From a survey of more than 50 college students, spring 2026.</p>
        </div>
      </section>

      <section className={`${styles.band} ${styles.soft}`} aria-labelledby="how-title">
        <div className={styles.bandInner}>
          <h2 id="how-title" className="section-title">Three taps from a screenshot to your week.</h2>
          <div className={styles.how}>
            <figure><AddPhone /><figcaption><strong>Add what you have.</strong> Your recent screenshots are right there.</figcaption></figure>
            <figure><ReviewPhone /><figcaption><strong>Check it as a chart.</strong> Anything without a time gets a question, not a guess.</figcaption></figure>
            <figure><AddedPhone /><figcaption><strong>It’s in your plan.</strong> Changed your mind? Undo.</figcaption></figure>
          </div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="week-title">
        <div className={styles.featureCopy}>
          <p className="eyebrow">Plan and Today</p>
          <h2 id="week-title" className="section-title">See the week at a glance.</h2>
          <p className="lede">Classes, shifts and deadlines on one timeline. The week as seven bars, today by the hour, and a countdown to whatever’s next. Overlaps show in red before they become a problem.</p>
        </div>
        <div className={styles.pair}><PlanPhone /><HourPhone /></div>
      </section>

      <section className={`${styles.band} ${styles.dark}`} aria-labelledby="diff-title">
        <div className={styles.bandPhoto} aria-hidden>
          <Image src="/photos/shift.jpg" alt="" fill sizes={PHOTO_SIZES} />
        </div>
        <div className={`${styles.bandInner} ${styles.feature} ${styles.flip}`}>
          <div className={styles.featureCopy}>
            <p className="eyebrow">For your work week</p>
            <h2 id="diff-title" className="section-title">New schedule, only the changes.</h2>
            <p className="lede">Send next week’s schedule and Semli compares it with the shifts you already have: what moved, what’s new, what got dropped. Keep anything with one tap.</p>
            <Link className="textlink" href="/work-and-school-schedule-planner">Work and school in one plan</Link>
          </div>
          <div className={styles.single}><DiffPhone /></div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="term-title">
        <div className={styles.featureCopy}>
          <p className="eyebrow">For your semester</p>
          <h2 id="term-title" className="section-title">A syllabus becomes the term.</h2>
          <p className="lede">Every exam, reading and due date from a syllabus PDF, laid out on one line. On Canvas? Connect it once and due dates stay in sync when professors move them.</p>
          <Link className="textlink" href="/syllabus-to-calendar">How syllabus imports work</Link>
        </div>
        <div className={styles.pair}><SyllabusPhone /><SchoolPhone /></div>
      </section>

      <section className={`${styles.band} ${styles.soft}`} aria-labelledby="price-title">
        <div className={`${styles.bandInner} ${styles.teaser}`}>
          <div className={styles.teaserCopy}>
            <p className="eyebrow">Semli Plus</p>
            <h2 id="price-title" className="section-title">Free to start. Plus when you want it all.</h2>
            <p className="lede">
              The calendar, to-dos, reminders and {FREE_IMPORTS_PER_MONTH} imports a month are free. Plus is unlimited imports and Canvas sync.
            </p>
            <div className={styles.priceLine}>
              <span className={styles.priceBig}>{fromMonthly}</span>
              <span className={styles.priceUnit}>a month for students, billed yearly. Or {money(plan('semester').student)} a semester.</span>
            </div>
            <Link className="btn accent" href="/pricing">See pricing</Link>
          </div>
          <div className={styles.teaserPhoto} aria-hidden>
            <Image src="/photos/table.jpg" alt="" fill sizes="(max-width: 820px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <section className={`faq ${styles.faq}`} aria-labelledby="home-faq-title">
        <div>
          <h2 id="home-faq-title">Questions.</h2>
          <Link className="textlink" href="/privacy">Read our privacy policy</Link>
        </div>
        <div className="faq-list">{FAQS.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      {!APP_STORE_LIVE ? (
        <section id="beta" className={`${styles.band} ${styles.purple} ${styles.beta}`} aria-labelledby="beta-title">
          <div className={styles.bandPhoto} aria-hidden>
            <Image src="/photos/campus.jpg" alt="" fill sizes={PHOTO_SIZES} />
          </div>
          <div className={styles.bandInner}>
            <h2 id="beta-title" className="section-title">The iPhone beta opens soon.</h2>
            <p className="lede">200 spots on TestFlight. You get the real app with the real 7-day trial, and the people building it read every message you send.</p>
            <Waitlist />
          </div>
        </section>
      ) : null}

      <section className={styles.closing} aria-labelledby="final-title">
        <h2 id="final-title" className="section-title">One less thing to keep in your head.</h2>
        <div className={styles.ctas}>
          <a className="btn accent" href="#try">Try it with your schedule</a>
          <GetApp ghost />
        </div>
      </section>
    </main>
  );
}
