import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';
import { Wordmark } from '@/app/Wordmark';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Syllabus to calendar', href: '/syllabus-to-calendar' },
      { label: 'Assignment tracker', href: '/assignment-tracker' },
      { label: 'Work and school planner', href: '/work-and-school-schedule-planner' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: `Email ${SUPPORT_EMAIL}`, href: `mailto:${SUPPORT_EMAIL}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Delete your data', href: '/delete-account' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-grid">
        <div className="foot-brand">
          <Wordmark width={76} />
          <p>A little less juggling between work and school.</p>
          <p className="foot-note"><Link href="/syllabus-to-calendar#try">Try a schedule here</Link>. Keep your plan in the iPhone app.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="foot-col">
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith('mailto:') ? <a href={l.href}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="foot-base">
        <span>© 2026 Semli</span>
        <span>Built by <a href="https://ocelabs.xyz">OCELabs</a>.</span>
      </div>
    </footer>
  );
}
