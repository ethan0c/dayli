import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the people building Dayli.',
  alternates: { canonical: '/contact' },
};

const REASONS = [
  { title: 'Something broke', body: 'A screenshot it couldn’t read, a date it got wrong, a crash. Send the file if you can; it helps.', subject: 'Bug' },
  { title: 'Plus and billing', body: 'Trials, charges, cancelling, refunds.', subject: 'Billing' },
  { title: 'Campus groups', body: 'Nursing cohorts, study groups, RAs, student orgs. We want to talk to you.', subject: 'Campus' },
  { title: 'Anything else', body: 'Ideas, press, or just to say what you wish it did.', subject: 'Hello' },
];

export default function ContactPage() {
  return (
    <main className="page">
      <Prose title="Say hi." lede="One inbox, read by the people building Dayli. We answer within a day or two.">
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
