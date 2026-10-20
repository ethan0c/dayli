import type { Metadata } from 'next';
import { FREE_IMPORTS_PER_MONTH, SUPPORT_EMAIL, TRIAL_DAYS, money, plan } from '@/lib/site';
import { PlanCards } from './PlanCards';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Semli is free with ${FREE_IMPORTS_PER_MONTH} AI imports a month. Semli Plus is unlimited imports for students at ${money(plan('monthly').student)} a month, ${money(plan('semester').student)} a semester, or ${money(plan('yearly').student)} a year.`,
  alternates: { canonical: '/pricing' },
};

const ROWS: { label: string; free: string | boolean; plus: string | boolean }[] = [
  { label: 'Calendar, tasks, and the Today screen', free: true, plus: true },
  { label: 'Reminders', free: true, plus: true },
  { label: 'Urgent items that ring like an alarm', free: false, plus: true },
  { label: 'Add by hand', free: true, plus: true },
  { label: 'AI imports from text, screenshots, and PDFs', free: `${FREE_IMPORTS_PER_MONTH} a month`, plus: 'Unlimited' },
  { label: 'Syllabus import', free: 'Counts as an import', plus: true },
  { label: 'See changes to your work schedule', free: false, plus: true },
  { label: 'Overlap warnings and manual time edits', free: true, plus: true },
  { label: 'Suggested times for overlapping plans', free: false, plus: true },
  { label: 'Canvas assignments', free: 'One-time import', plus: 'Kept in sync' },
  { label: 'Optional account with backup', free: true, plus: true },
  { label: 'Export your data', free: true, plus: true },
];

const FAQS = [
  {
    q: 'Is there a free plan?',
    a: `Yes. Your calendar, to-dos, reminders, and ${FREE_IMPORTS_PER_MONTH} AI imports a month are free, with no time limit. You can use the app as a guest.`,
  },
  {
    q: 'What counts as an import?',
    a: 'One message, one screenshot, or one PDF sent to Semli to read. A ten-page syllabus is one import. Adding something by hand is never an import.',
  },
  {
    q: 'How does student pricing work?',
    a: `Choose student pricing if you’re in college; no student ID or school email is needed. Student plans cost ${money(plan('monthly').student)} a month, ${money(plan('semester').student)} every six months, or ${money(plan('yearly').student)} a year. Turn off the student switch to see regular prices.`,
  },
  {
    q: 'Why a semester plan?',
    a: `The semester plan covers six months, including the break, for ${money(plan('semester').student)} at the student price. The yearly student plan is ${money(plan('yearly').student)}, equivalent to ${money(plan('yearly').student / 12)} a month.`,
  },
  {
    q: 'Is there a trial?',
    a: `Eligible new subscribers can try Plus free for ${TRIAL_DAYS} days. Trial eligibility, the renewal price, and the billing period are shown before you subscribe. You can keep using the free plan if you cancel.`,
  },
  {
    q: 'How do I cancel?',
    a: 'On your iPhone, open Settings, tap your name, then Subscriptions, and choose Semli. Cancelling stops the next renewal. For a paid subscription, Plus stays available until the period you paid for ends.',
  },
  {
    q: 'Do you offer refunds?',
    a: <>App Store purchases follow Apple’s refund policy. <a href="https://reportaproblem.apple.com/">Request a refund from Apple</a>, or <a href={`mailto:${SUPPORT_EMAIL}`}>email us</a> for help understanding a charge.</>,
  },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <span className="yes" aria-label="Included">
        ✓
      </span>
    );
  if (v === false)
    return (
      <span className="no" aria-label="Not included">
        –
      </span>
    );
  return <span>{v}</span>;
}

export default function PricingPage() {
  return (
    <main className="page pricing-page">
      <header className="page-head">
        <h1 className="serif">Start free. Add more with Plus.</h1>
        <p className="lede">
          Keep your week organized for free. Plus adds unlimited imports, Canvas sync, work-schedule comparisons,
          suggested times for overlapping plans, and urgent items that ring like an alarm.
        </p>
      </header>

      <PlanCards />

      <section className="cmp" aria-label="Free versus Plus">
        <h2>Free and Plus, compared</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">Free</th>
              <th scope="col">Plus</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>
                  <Cell v={r.free} />
                </td>
                <td>
                  <Cell v={r.plus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="faq" aria-label="Pricing questions">
        <h2>Questions</h2>
        <div className="faq-list">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
