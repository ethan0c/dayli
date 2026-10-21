import Link from 'next/link';
import type { ReactNode } from 'react';
import { TryIt } from '@/app/TryIt';
import { GET_APP_QR } from '@/lib/qr';
import { breadcrumbJsonLd, faqJsonLd, type Faq } from '@/lib/seo';

export interface Step {
  title: string;
  body: string;
}

export interface Related {
  href: string;
  label: string;
}

/**
 * One search-intent landing page: a specific job, how Semli does it, the try-it box,
 * questions people actually ask, and links to the neighbouring jobs.
 */
export function LandingPage({
  path,
  name,
  title,
  lede,
  steps,
  detail,
  faqs,
  related,
}: {
  path: string;
  name: string;
  title: string;
  lede: string;
  steps: Step[];
  detail: ReactNode;
  faqs: Faq[];
  related: Related[];
}) {
  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(path, name)) }} />
      <header className="page-head">
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </header>

      <section className="steps" aria-label="How it works">
        {steps.map((s) => (
          <div className="step" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </section>

      <section className="prose" aria-label="Details">
        {detail}
      </section>

      <TryIt qr={GET_APP_QR} />

      <section className="faq" aria-label="Questions">
        <h2>Questions</h2>
        <div className="faq-list">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="related" aria-label="Related">
        <h2>Also useful</h2>
        <ul>
          {related.map((r) => (
            <li key={r.href}>
              <Link href={r.href}>{r.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/pricing">Pricing</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
