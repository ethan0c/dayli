import type { Metadata } from 'next';
import { FREE_IMPORTS_PER_MONTH, TRIAL_DAYS, money, plan } from '@/lib/site';
import { PlanCards } from './PlanCards';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Nowli is free with ${FREE_IMPORTS_PER_MONTH} AI imports a month. Nowli Plus is unlimited imports for students at ${money(plan('monthly').student)} a month, ${money(plan('semester').student)} a semester, or ${money(plan('yearly').student)} a year.`,
  alternates: { canonical: '/pricing' },
};

const ROWS: { label: string; free: string | boolean; plus: string | boolean }[] = [
  { label: 'Calendar, tasks, and the Today screen', free: true, plus: true },
  { label: 'Reminders', free: true, plus: true },
  { label: 'Add by hand', free: true, plus: true },
  { label: 'AI imports from text, screenshots, and PDFs', free: `${FREE_IMPORTS_PER_MONTH} a month`, plus: 'Unlimited' },
  { label: 'Syllabus import', free: 'Counts as an import', plus: true },
  { label: 'See changes to your work schedule', free: false, plus: true },
  { label: 'Canvas sync', free: false, plus: 'Coming soon' },
  { label: 'Planning suggestions', free: false, plus: 'Coming soon' },
  { label: 'Export your data', free: true, plus: true },
];

const FAQS = [
  {
    q: 'Is there a free plan?',
    a: `Yes, and it doesn't expire. You get the calendar, tasks, Today, reminders, and ${FREE_IMPORTS_PER_MONTH} AI imports a month. Your first import works before you even sign up.`,
  },
  {
    q: 'What counts as an import?',
    a: 'One message, one screenshot, or one PDF sent to Nowli to read. A ten-page syllabus is one import. Adding something by hand is never an import.',
  },
  {
    q: 'How does student pricing work?',
    a: `Student pricing works on the honor system. No student ID or school email needed. Students pay ${money(plan('monthly').student)}, ${money(plan('semester').student)}, or ${money(plan('yearly').student)}. Everyone else pays ${money(plan('monthly').regular)}, ${money(plan('semester').regular)}, or ${money(plan('yearly').regular)}. Turn off student pricing to see regular prices.`,
  },
  {
    q: 'Why a semester plan?',
    a: `It covers a full semester in one payment. ${money(plan('semester').student)} covers four months. If you'd rather not think about it, yearly is ${money(plan('yearly').student)}, which works out to ${money(plan('yearly').student / 12)} a month.`,
  },
  {
    q: 'Is there a trial?',
    a: `Every Plus plan starts with a ${TRIAL_DAYS}-day free trial. Cancel before it ends and you pay nothing. You keep the free plan either way.`,
  },
  {
    q: 'How do I cancel?',
    a: 'If you subscribed on your iPhone, cancel in Settings, then your name, then Subscriptions. If you subscribed on the web, use the link in your receipt email or write to us. Cancelling stops the next charge; you keep Plus until the period ends.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Purchases through the App Store follow Apple’s refund policy. For web purchases, email us within 14 days of a charge and we’ll sort it out.',
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
    <main className="page">
      <header className="page-head">
        <h1>Start free. Get more room with Plus.</h1>
        <p className="lede">
          Use Nowli free for as long as you like. Plus removes the import limit, so every syllabus and every new work schedule goes
          straight in.
        </p>
      </header>

      <PlanCards />

      <section className="cmp" aria-label="Free versus Plus">
        <h2>Free vs Plus</h2>
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
