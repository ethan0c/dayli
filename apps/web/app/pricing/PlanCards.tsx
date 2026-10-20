'use client';

import Link from 'next/link';
import { useState } from 'react';
import { feedback } from '@/lib/feedback';
import { APP_STORE_LIVE, APP_STORE_URL, FREE_IMPORTS_PER_MONTH, PLUS_PLANS, TRIAL_DAYS, money, type PlanId } from '@/lib/site';

const FREE = ['Calendar, tasks, and Today', 'Reminders on your phone', `${FREE_IMPORTS_PER_MONTH} AI imports a month: text, screenshot, or PDF`, 'Add events and to-dos by hand anytime'];
const PLUS = ['Unlimited imports from text, screenshots, and PDFs', 'Compare updates to your work schedule', 'Suggested times for overlapping plans', 'Canvas sync when assignment dates change'];

export function PlanCards() {
  const [billing, setBilling] = useState<PlanId>('semester');
  const [student, setStudent] = useState(true);
  const p = PLUS_PLANS.find((x) => x.id === billing)!;
  const price = student ? p.student : p.regular;
  return (
    <div className="plans">
      <div className="seg" role="radiogroup" aria-label="Billing period" style={{ '--i': PLUS_PLANS.findIndex((x) => x.id === billing), '--n': PLUS_PLANS.length } as React.CSSProperties}>
        <span className="seg-pill" aria-hidden="true" />
        {PLUS_PLANS.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={billing === b.id} className={billing === b.id ? 'on' : undefined} onClick={() => {
            if (b.id !== billing) feedback('select');
            setBilling(b.id);
          }}>
            {b.name}
          </button>
        ))}
      </div>
      <label className="student">
        <input type="checkbox" checked={student} onChange={(e) => {
          feedback('select');
          setStudent(e.target.checked);
        }} />
        <span className="sw" aria-hidden="true" />
        <span>
          I&apos;m a student
          <small>No student ID or school email needed. Turn this off to see regular prices.</small>
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
            Try a schedule
          </Link>
        </div>

        <div className="plan featured">
          {p.tag ? <span className="tag rise" key={p.tag}>{p.tag}</span> : null}
          <h3>Plus</h3>
          <p className="blurb">For a busy semester, with unlimited imports.</p>
          <div className="price">
            <span className="amt rise" key={price}>
              {money(price / p.months)}
            </span>
            <span className="per">/ month</span>
          </div>
          <p className="note rise" key={`${price}-${student}`}>
            {money(price)} billed {p.billed}
            {student ? <> · student price, regular {money(p.regular)}</> : null}
          </p>
          <ul>
            {PLUS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {APP_STORE_LIVE ? <a className="btn" href={APP_STORE_URL}>Get Plus on iPhone</a> : <Link className="btn" href="/#beta">Join the iPhone beta</Link>}
          <p className="note">At launch, eligible new subscribers can try Plus free for {TRIAL_DAYS} days.</p>
        </div>
      </div>
    </div>
  );
}
