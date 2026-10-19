'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FREE_IMPORTS_PER_MONTH, PLUS_PRICE, TRIAL_DAYS } from '@/lib/site';

const BILLING = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'semester', label: 'Semester' },
  { value: 'yearly', label: 'Yearly' },
] as const;
type Billing = (typeof BILLING)[number]['value'];

const PER_MONTH: Record<Billing, string> = {
  monthly: PLUS_PRICE.monthly.toFixed(2),
  semester: (PLUS_PRICE.semester / 4).toFixed(2),
  yearly: (PLUS_PRICE.yearly / 12).toFixed(2),
};
const BILLED: Record<Billing, string> = {
  monthly: `$${PLUS_PRICE.monthly} billed monthly`,
  semester: `$${PLUS_PRICE.semester} billed every 4 months`,
  yearly: `$${PLUS_PRICE.yearly} billed yearly`,
};

const FREE = ['Calendar, tasks, and Today', 'Reminders on your phone', `${FREE_IMPORTS_PER_MONTH} AI imports a month: text, screenshot, or PDF`, 'Manual add, always'];
const PLUS = ['Unlimited AI imports', 'Syllabus import: a whole course in one go', 'Work schedule diffing: see what changed, not duplicates', 'Canvas sync and planning suggestions when they ship'];

export function PlanCards() {
  const [billing, setBilling] = useState<Billing>('semester');
  return (
    <div className="plans">
      <div className="seg" role="radiogroup" aria-label="Billing period">
        {BILLING.map((b) => (
          <button key={b.value} type="button" role="radio" aria-checked={billing === b.value} className={billing === b.value ? 'on' : undefined} onClick={() => setBilling(b.value)}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="plan-grid">
        <div className="plan">
          <h3>Free</h3>
          <p className="blurb">Enough to feel it work.</p>
          <div className="price">
            <span className="amt">$0</span>
            <span className="per">forever</span>
          </div>
          <p className="note">No card, no trial.</p>
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
          <p className="blurb">Enough to run a semester.</p>
          <div className="price">
            <span className="amt">${PER_MONTH[billing]}</span>
            <span className="per">/ month</span>
          </div>
          <p className="note">{BILLED[billing]}</p>
          <ul>
            {PLUS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <span className="btn" aria-disabled="true" title="Dayli Plus opens with the iPhone beta">
            {TRIAL_DAYS}-day free trial, soon
          </span>
        </div>
      </div>
    </div>
  );
}
