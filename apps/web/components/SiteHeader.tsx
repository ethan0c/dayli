import Link from 'next/link';
import { Wordmark } from '@/app/Wordmark';

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="wm-link" aria-label="Nowli home">
        <Wordmark width={104} />
      </Link>
      <nav className="nav" aria-label="Main">
        <Link href="/pricing">Pricing</Link>
        <Link className="btn ghost" href="/#try">
          Try it
        </Link>
      </nav>
    </header>
  );
}
