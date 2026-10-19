import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { LEGAL_UPDATED, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Delete your data',
  description: 'How to remove everything Semli has stored, and what that covers.',
  robots: { index: false, follow: true },
};

export default function DeleteAccountPage() {
  return (
    <main className="page">
      <Prose
        title="Delete your data"
        lede="Semli keeps your plan on your device, so deleting it is in your hands. Here is exactly what to do and what it covers."
        meta={<span>Updated {LEGAL_UPDATED}</span>}
      >
        <section>
          <h2>In the app</h2>
          <ol>
            <li>Open Semli and tap the You tab.</li>
            <li>Scroll to Data.</li>
            <li>Tap Clear everything.</li>
          </ol>
          <p>
            That removes every event, task, course, work schedule, and import record. It takes effect immediately. Deleting the app from your
            phone does the same thing.
          </p>
        </section>

        <section>
          <h2>What about our servers?</h2>
          <p>
            There is nothing to delete there. The current version of Semli has no accounts, and our server does not store the content you
            send it to be read or the results it sends back. See the <a href="/privacy">Privacy Policy</a> for how reading works.
          </p>
          <p>
            When accounts and sync arrive, this page will describe how to delete your account from inside the app and by email, and how
            long deletion takes.
          </p>
        </section>

        <section>
          <h2>Plus subscriptions</h2>
          <p>
            Clearing your data does not cancel a subscription. If you bought Plus on your iPhone, cancel in Settings, under your name, then
            Subscriptions. If you bought it on the web, use the link in your receipt email or write to us.
          </p>
        </section>

        <section>
          <h2>Need a hand?</h2>
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Delete my data')}`}>{SUPPORT_EMAIL}</a> and we&apos;ll
            confirm what, if anything, we hold about you and remove it.
          </p>
        </section>
      </Prose>
    </main>
  );
}
