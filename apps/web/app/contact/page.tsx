import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the people building Nowli.',
  alternates: { canonical: '/contact' },
};

const REASONS = [
  { title: 'Help with Nowli', body: 'Having trouble with a file, a date, or the app? Tell us what happened and what you were trying to do.', subject: 'Bug' },
  { title: 'Plus and billing', body: 'Ask about a trial, a charge, cancellation, or a refund.', subject: 'Billing' },
  { title: 'Campus groups', body: 'Bring Nowli to your study group, cohort, or campus organization. Tell us about your group.', subject: 'Campus' },
  { title: 'Anything else', body: 'Share an idea, ask a question, or tell us what would make Nowli more useful.', subject: 'Hello' },
];

export default function ContactPage() {
  return (
    <main className="page">
      <Prose title="Say hi." lede="One inbox, read by the people building Nowli. We answer within a day or two.">
        <p className="contact-mail">
          <a className="btn" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <div className="reasons">
          {REASONS.map((r) => (
            <a key={r.title} className="reason" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(r.subject)}`}>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </a>
          ))}
        </div>
      </Prose>
    </main>
  );
}
