import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';
import { Wordmark } from '@/app/Wordmark';
import { SoundToggle } from '@/components/SoundToggle';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Try it', href: '/#try' },
      { label: 'Pricing', href: '/pricing' },
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
          <p>Built for working students first.</p>
          <p className="foot-note">Nothing you paste on this site is stored. It is only used to show you the result.</p>
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
        <span>© 2026 Nowli</span>
        <span>iPhone and web. No Android for now.</span>
        <SoundToggle />
      </div>
    </footer>
  );
}
