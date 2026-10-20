import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { pageMetadata } from '@/lib/seo';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  path: '/contact',
  title: 'Contact',
  description: 'Get help with Semli, ask a billing question, or share feedback directly with the developer.',
});

const REASONS = [
  { title: 'Help with Semli', body: 'Having trouble with a file, a date, or the app? Tell us what happened and what you were trying to do.', subject: 'Bug' },
  { title: 'Plus and billing', body: 'Ask about a trial, a charge, cancellation, or a refund.', subject: 'Billing' },
  { title: 'Campus groups', body: 'Bring Semli to your study group, cohort, or campus organization. Tell us about your group.', subject: 'Campus' },
  { title: 'Anything else', body: 'Share an idea, ask a question, or tell us what would make Semli more useful.', subject: 'Hello' },
];

export default function ContactPage() {
  return (
    <main className="page">
      <Prose title="Say hi." lede="Need help, have an idea, or want to share feedback? Your message goes directly to Semli’s developer.">
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
