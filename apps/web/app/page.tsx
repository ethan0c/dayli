import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CountUp } from '@/components/CountUp';
import { Screen, Stage } from '@/components/Screen';
import { Shot } from '@/components/Shot';
import cafeShift from '@/public/photos/cafe-shift.jpg';
import campus from '@/public/photos/campus.jpg';
import heroAutumn from '@/public/photos/hero-autumn.jpg';
import table from '@/public/photos/table.jpg';
import { faqJsonLd, pageMetadata } from '@/lib/seo';
import { APP_STORE_LIVE, APP_STORE_URL, FREE_IMPORTS_PER_MONTH, money, plan } from '@/lib/site';
import { TryIt } from './TryIt';
import { Waitlist } from './Waitlist';
import styles from './home.module.css';

export const metadata: Metadata = pageMetadata({ path: '/' });

/** From the spring 2026 student survey (docs/pricing-and-positioning.md). No invented counts; public copy says "more than 50". */
const PROOF = [
  { n: '83%', q: 'have missed or nearly missed an assignment because it got buried' },
  { n: '73%', q: 'get assignments outside Canvas, at least sometimes' },
  { n: '65%', q: 'want reminders on their phone' },
];

/** Explain how Semli fits an existing workflow without unverified competitor or speed claims. */
const SWITCH = [
  { from: 'Apple Reminders and Notes', adds: 'Bring dates out of syllabi, screenshots, and messages. See them alongside your classes and shifts in a daily or weekly view.' },
  { from: 'Structured', adds: 'Add class times, deadlines, and work shifts from the schedules you already have. Review each import before adding it to your plan.' },
  { from: 'MyStudyLife', adds: 'Start with your syllabus. Check the class times and assignment dates Semli finds, then add them to your semester.' },
  { from: 'Google Calendar', adds: 'Use Semli to read your schedules, then export the dates as a calendar file for your existing calendar.' },
];

const FAQS = [
  { q: 'What can I send to Semli?', a: 'A message, screenshot, photo, or PDF. Try a syllabus, class timetable, work schedule, or a date from your group chat. Files can be up to 20 MB.' },
  { q: 'Can I check the dates first?', a: 'Yes. Review the dates and times Semli finds, fill in anything missing, and confirm what you want to add. You can undo an import later.' },
  { q: 'Does it work with Canvas?', a: 'Yes. Paste your Canvas calendar feed link to bring in assignments. Plus keeps them in sync when due dates change. You can also import a syllabus PDF or a screenshot of your Canvas to-do list.' },
  { q: 'What happens to my uploads?', a: 'Semli sends your upload to our AI provider to read the dates; our servers don’t save the upload or its response. The plan you confirm stays on your phone, with cloud backup if you create an account. See our privacy policy for details.' },
  { q: 'What’s free?', a: `The calendar, to-dos, reminders, and ${FREE_IMPORTS_PER_MONTH} AI imports a month, for as long as you like. Plus adds unlimited imports, Canvas sync, and schedule-change comparisons.` },
  { q: 'Is there an Android app?', a: 'Not yet. We’re starting with iPhone. You can try importing a schedule on this website without an account.' },
];

/** Photos are Unsplash, recorded in public/photos/SOURCES.md. They are decorative: empty alt, text carries the meaning.
 *  Static imports give each one a blurred placeholder, so a band never flashes empty while its photo loads. */
const PHOTO_SIZES = '100vw';
/** A stagger index for siblings revealing together; globals.css multiplies it by the stagger token. */
const stagger = (i: number) => ({ '--i': i } as React.CSSProperties);

function GetApp({ ghost = false }: { ghost?: boolean }) {
  const cls = `btn${ghost ? ' ghost' : ''}`;
  return APP_STORE_LIVE ? <a className={cls} href={APP_STORE_URL}>Get the iPhone app</a> : <Link className={cls} href="/#beta">Join the iPhone beta</Link>;
}

export default function Home() {
  const fromMonthly = money(Math.round((plan('yearly').student / 12) * 100) / 100);
  return (
    <main className={`page ${styles.home}`}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroPhoto} aria-hidden>
          <Image src={heroAutumn} alt="" fill priority placeholder="blur" sizes="100vw" />
        </div>
        <div className={styles.heroCopy}>
          <p className="eyebrow">The daily planner for college students</p>
          <h1 id="home-title" className="serif">Your week, already organized.</h1>
          <p className={styles.heroSub}>Classes, shifts, and deadlines in one plan. Add a syllabus, work schedule, or message, then see what’s next.</p>
          <div className={styles.ctas}>
            <a className="btn accent" href="#try">Try it with your schedule</a>
            <GetApp ghost />
          </div>
          <p className={styles.note}>{APP_STORE_LIVE ? 'Free on iPhone.' : 'The iPhone beta opens soon. The first 200 testers get in.'}</p>
        </div>
        <Shot name="today" width={372} priority className={styles.heroShot} label="Today: 6 hours 19 minutes until the next shift, then the day's plan" />
      </section>

      <TryIt />

      <section className={styles.proof} aria-label="What students told us">
        <p className={styles.bandEyebrow} data-reveal>What students told us</p>
        <div className={styles.stats}>
          {PROOF.map((p, i) => (
            <div key={p.n} className={styles.stat} data-reveal style={stagger(i)}>
              <div className={styles.statN}><CountUp value={p.n} /></div>
              <p>{p.q}</p>
            </div>
          ))}
        </div>
        <p className={styles.source} data-reveal>From a survey of more than 50 college students, spring 2026.</p>
      </section>

      <section className={`${styles.band} ${styles.soft} ${styles.bleed}`} aria-labelledby="how-title">
        <div className={styles.bandInner}>
          <h2 id="how-title" className="section-title" data-reveal>From a screenshot to your schedule.</h2>
          <div className={styles.how}>
            <figure data-reveal style={stagger(0)}><figcaption><strong>Send what you have.</strong> Choose a screenshot, upload a PDF, or paste a message.</figcaption><Screen name="add" width={320} height={420} label="Add: type, paste, or drop in a screenshot; your recent screenshots are right there" /></figure>
            <figure data-reveal style={stagger(1)}><figcaption><strong>Check the details.</strong> Review the dates and times, and fill in anything missing.</figcaption><Screen name="review" width={320} height={420} label="Review: 6 shifts found, the week as seven day bars, one shift asking for a time" /></figure>
            <figure data-reveal style={stagger(2)}><figcaption><strong>Make it your plan.</strong> Edit an event anytime, or undo the import.</figcaption><Screen name="item" width={320} height={420} label="An event in your plan: the time, the day around it, reminder and flexibility switches" /></figure>
          </div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="week-title">
        <div className={styles.featureCopy} data-reveal>
          <p className="eyebrow">Your whole week</p>
          <h2 id="week-title" className="section-title">See the week at a glance.</h2>
          <p className="lede">See where classes, shifts, and deadlines fit together. Plan the week, look at today by the hour, and spot overlaps in red.</p>
        </div>
        <div className={styles.single} data-reveal style={stagger(1)}><Stage><Screen name="plan" width={340} height={500} label="Plan: the week as seven bars, today's agenda and the rest of the week" /></Stage></div>
      </section>

      <section className={`${styles.band} ${styles.dark}`} aria-labelledby="diff-title">
        <div className={`${styles.bandPhoto} ${styles.workPhoto}`} aria-hidden>
          <Image src={cafeShift} alt="" fill placeholder="blur" sizes={PHOTO_SIZES} quality={85} />
        </div>
        <div className={`${styles.bandInner} ${styles.feature} ${styles.flip}`}>
          <div className={styles.featureCopy} data-reveal>
            <p className="eyebrow">For your work week</p>
            <h2 id="diff-title" className="section-title">Your work schedule, updated.</h2>
            <p className="lede">With Plus, compare an updated schedule with the shifts already in your plan. See what’s new, moved, or removed, then choose which changes to keep.</p>
            <Link className="textlink" href="/work-and-school-schedule-planner">Work and school in one plan</Link>
          </div>
          <div className={styles.single} data-reveal style={stagger(1)}><Shot name="review-update" label="Compared with what you have: 3 changes, one new shift, one moved, one dropped" /></div>
        </div>
      </section>

      <section className={styles.feature} aria-labelledby="term-title">
        <div className={styles.featureCopy} data-reveal>
          <p className="eyebrow">For your semester</p>
          <h2 id="term-title" className="section-title">Your syllabus, laid out for the semester.</h2>
          <p className="lede">Bring class times, exams, and assignment dates out of the PDF and into your plan. Connect Canvas for assignments, with Plus to keep due dates in sync.</p>
          <Link className="textlink" href="/syllabus-to-calendar">How syllabus imports work</Link>
        </div>
        <div className={styles.single} data-reveal style={stagger(1)}><Stage><Screen name="school" width={340} height={500} label="School: the next assignment due in 3 days, the next four weeks on one line, your courses" /></Stage></div>
      </section>

      <section className={styles.switch} aria-labelledby="switch-title">
        <div data-reveal>
          <h2 id="switch-title" className="section-title">Already using Structured, Reminders, or Notes?</h2>
          <p className="lede">Keep what you like. Here is what Semli adds.</p>
        </div>
        <dl className={styles.switchList}>
          {SWITCH.map((s, i) => (
            <div key={s.from} className={styles.switchRow} data-reveal style={stagger(i)}>
              <dt>{s.from}</dt>
              <dd>{s.adds}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${styles.band} ${styles.soft}`} aria-labelledby="price-title">
        <div className={`${styles.bandInner} ${styles.teaser}`}>
          <div className={styles.teaserCopy} data-reveal>
            <p className="eyebrow">Semli Plus</p>
            <h2 id="price-title" className="section-title">Start free. Add more with Plus.</h2>
            <p className="lede">
              Your calendar, to-dos, reminders, and {FREE_IMPORTS_PER_MONTH} imports a month are free. Plus adds unlimited imports, Canvas sync, and work-schedule comparisons.
            </p>
            <div className={styles.priceLine}>
              <span className={styles.priceBig}>{fromMonthly}</span>
              <span className={styles.priceUnit}>a month for students, billed yearly. Or {money(plan('semester').student)} every six months.</span>
            </div>
            <Link className="btn accent" href="/pricing">See pricing</Link>
          </div>
          <div className={styles.teaserPhoto} aria-hidden data-reveal style={stagger(1)}>
            <Image src={table} alt="" fill placeholder="blur" sizes="(max-width: 820px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <section className={`faq ${styles.faq}`} aria-labelledby="home-faq-title">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
        <div data-reveal>
          <h2 id="home-faq-title">Common questions.</h2>
          <Link className="textlink" href="/privacy">Read our privacy policy</Link>
        </div>
        <div className="faq-list" data-reveal style={stagger(1)}>{FAQS.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      {!APP_STORE_LIVE ? (
        <section id="beta" className={`${styles.band} ${styles.purple} ${styles.beta}`} aria-labelledby="beta-title">
          <div className={styles.bandPhoto} aria-hidden>
            <Image src={campus} alt="" fill placeholder="blur" sizes={PHOTO_SIZES} />
          </div>
          <div className={styles.bandInner} data-reveal>
            <h2 id="beta-title" className="section-title">The iPhone beta opens soon.</h2>
            <p className="lede">Help shape Semli before launch. Join the first 200 testers on TestFlight, try it with your week, and send feedback directly to the developer.</p>
            <Waitlist />
          </div>
        </section>
      ) : null}

      <section className={styles.closing} aria-labelledby="final-title">
        <h2 id="final-title" className="section-title serif" data-reveal>One less thing to keep in your head.</h2>
        <div className={styles.ctas} data-reveal style={stagger(1)}>
          <a className="btn accent" href="#try">Try it with your schedule</a>
          <GetApp ghost />
        </div>
      </section>
    </main>
  );
}
