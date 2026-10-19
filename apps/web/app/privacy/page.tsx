import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose } from '@/components/Prose';
import { LEGAL_EFFECTIVE, LEGAL_UPDATED, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Nowli collects, what it does with your schedules and syllabi, and what it never does.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="page">
      <Prose
        title="Privacy Policy"
        lede="Your schedule is personal. Nowli reads your documents to build your plan, keeps that plan on your device, and does not sell, share, or train on what you send."
        meta={
          <>
            <span>Effective {LEGAL_EFFECTIVE}</span>
            <span>Updated {LEGAL_UPDATED}</span>
          </>
        }
      >
        <section>
          <h2>1. Who we are</h2>
          <p>
            Nowli (&ldquo;we&rdquo;, &ldquo;us&rdquo;) makes the Nowli iPhone app, the Nowli web app, and this website (together, the
            &ldquo;Service&rdquo;). This policy explains what information the Service handles and why. If you have a question it doesn&apos;t
            answer, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>2. What we handle</h2>
          <h3>2.1 Content you send to be read</h3>
          <p>
            When you ask Nowli to read something, you send it one of: a typed message, a screenshot or photo, or a PDF. Nowli reads the
            dates, times, courses, employers, and tasks in it. Along with the content, the app sends today&apos;s date, your time zone, and
            the names of courses and employers you already have, so the result lines up with your existing plan.
          </p>
          <h3>2.2 Your plan</h3>
          <p>
            The events, tasks, courses, and work schedules Nowli creates, plus your name if you enter one. In the current version this is
            stored on your device only. It is not sent to us.
          </p>
          <h3>2.3 Things we don&apos;t collect</h3>
          <ul>
            <li>No account, email, or password is required today.</li>
            <li>No location, contacts, or health data.</li>
            <li>No advertising identifiers, and no third-party ad or analytics trackers on this website.</li>
            <li>No payment card details. If you buy Plus, Apple or our payment processor handles the card, and we receive only a confirmation.</li>
          </ul>
          <h3>2.4 Permissions on iPhone</h3>
          <p>
            Nowli asks for the photo library only when you choose a screenshot, and for the camera only when you choose to photograph a
            printed schedule. It reads the image you pick and nothing else.
          </p>
        </section>

        <section>
          <h2>3. How reading works, and who sees it</h2>
          <p>
            To read your content, the app sends it to our server, which passes it to Anthropic&apos;s Claude API, the AI model Nowli uses.
            The model returns a structured list of dates and items, and our server passes it back to you.
          </p>
          <ul>
            <li>
              <strong>We don&apos;t store it.</strong> Our server does not save the content you send or the result. It handles the request and
              forgets it. Logs record errors, not your content.
            </li>
            <li>
              <strong>It is not used for training.</strong> We use Anthropic&apos;s commercial API, whose terms do not allow your content to be
              used to train its models. Anthropic may keep requests for a limited time to monitor for abuse, then deletes them.
            </li>
            <li>
              <strong>The try-it box on this site works the same way.</strong> What you paste is read and shown back to you. It is not
              stored.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Why we handle it</h2>
          <ul>
            <li>To read your documents and build your plan. That is the product.</li>
            <li>To keep the Service working, find bugs, and stop abuse.</li>
            <li>To process your Plus purchase and know which plan you&apos;re on.</li>
            <li>To answer you when you write to us.</li>
          </ul>
          <p>We don&apos;t sell your information, and we don&apos;t share it with advertisers.</p>
        </section>

        <section>
          <h2>5. Who we share with</h2>
          <p>Only the services needed to run Nowli:</p>
          <ul>
            <li>
              <strong>Anthropic</strong> reads the content you send, as described in section 3.
            </li>
            <li>
              <strong>Our hosting provider</strong> runs the website and the server that forwards your content.
            </li>
            <li>
              <strong>Apple</strong> handles App Store purchases and tells us that a purchase happened.
            </li>
            <li>
              <strong>Our payment processor</strong> handles web purchases of Plus and holds your card details, not us.
            </li>
          </ul>
          <p>We will also disclose information if the law requires it, or to protect the safety of people using the Service.</p>
        </section>

        <section>
          <h2>6. Where your data lives, and for how long</h2>
          <p>
            Today, your plan lives on your device. Delete the app, or use <em>Clear everything</em> in the app&apos;s You screen, and it is
            gone. We hold nothing to delete.
          </p>
          <p>
            When accounts and sync arrive, your plan will be stored on our servers in the United States, encrypted in transit and at rest,
            and kept until you delete your account. You will be able to export it (as a file and as a calendar feed) and delete it from
            inside the app. We will update this policy before that happens.
          </p>
        </section>

        <section>
          <h2>7. Your choices</h2>
          <ul>
            <li>
              <strong>Review before it&apos;s added.</strong> Nothing Nowli reads becomes part of your plan until you confirm it.
            </li>
            <li>
              <strong>Undo.</strong> Every import can be undone from the You screen.
            </li>
            <li>
              <strong>Delete.</strong> See <Link href="/delete-account">Delete your data</Link>.
            </li>
            <li>
              <strong>Ask us.</strong> Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> to ask what we hold about you, to correct
              it, or to have it deleted. If you live somewhere with privacy laws that give you specific rights (such as the EU, the UK, or
              California), those rights apply and we will honor them.
            </li>
          </ul>
        </section>

        <section>
          <h2>8. Children</h2>
          <p>
            Nowli is for people 13 and older. We don&apos;t knowingly collect information from children under 13. If you think a child has
            used Nowli, email us and we&apos;ll remove what we can.
          </p>
        </section>

        <section>
          <h2>9. Changes</h2>
          <p>
            We&apos;ll update this policy when the Service changes, and we&apos;ll note the date at the top. If a change matters, we&apos;ll tell
            you in the app or by email before it takes effect.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </section>
      </Prose>
    </main>
  );
}
