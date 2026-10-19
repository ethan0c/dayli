'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FREE_IMPORTS_PER_MONTH, PLUS_PLANS, TRIAL_DAYS, money, type PlanId } from '@/lib/site';

const FREE = ['Calendar, tasks, and Today', 'Reminders on your phone', `${FREE_IMPORTS_PER_MONTH} AI imports a month: text, screenshot, or PDF`, 'Add events and to-dos by hand anytime'];
const PLUS = ['Unlimited AI imports', 'Syllabus import: a whole course in one go', 'See what changed when you add a new work schedule', 'Canvas sync and planning suggestions are coming soon'];

export function PlanCards() {
  const [billing, setBilling] = useState<PlanId>('semester');
  const [student, setStudent] = useState(true);
  const p = PLUS_PLANS.find((x) => x.id === billing)!;
  const price = student ? p.student : p.regular;
  return (
    <div className="plans">
      <div className="seg" role="radiogroup" aria-label="Billing period">
        {PLUS_PLANS.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={billing === b.id} className={billing === b.id ? 'on' : undefined} onClick={() => setBilling(b.id)}>
            {b.name}
          </button>
        ))}
      </div>
      <label className="student">
        <input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} />
        <span className="sw" aria-hidden="true" />
        <span>
          I&apos;m a student
          <small>Student pricing works on the honor system. No student ID or school email needed. Turn this off to see regular prices.</small>
        </span>
      </label>

      <div className="plan-grid">
        <div className="plan">
          <h3>Free</h3>
          <p className="blurb">For keeping track of your week.</p>
          <div className="price">
            <span className="amt">$0</span>
            <span className="per">forever</span>
          </div>
          <p className="note">No payment details needed.</p>
          <ul>
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Link className="btn ghost" href="/#try">
            Try it now
          </Link>
        </div>

        <div className="plan featured">
          <h3>Plus</h3>
          <p className="blurb">For a busy semester, with unlimited imports.</p>
          <div className="price">
            <span className="amt">{money(price / p.months)}</span>
            <span className="per">/ month</span>
          </div>
          <p className="note">
            {money(price)} billed {p.billed}
            {student ? <> · student price, regular {money(p.regular)}</> : null}
          </p>
          <ul>
            {PLUS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <span className="btn" aria-disabled="true" title="Dayli Plus will be available with the iPhone beta">
            {TRIAL_DAYS}-day free trial, soon
          </span>
        </div>
      </div>
    </div>
  );
}
