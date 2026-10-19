import Link from 'next/link';
import { Wordmark } from '@/app/Wordmark';
import { APP_STORE_LIVE, APP_STORE_URL } from '@/lib/site';

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="wm-link" aria-label="Semli home">
        <Wordmark width={104} />
      </Link>
      <nav className="nav" aria-label="Main">
        <Link href="/pricing">Pricing</Link>
        <Link href="/#try">Try it</Link>
        {APP_STORE_LIVE ? (
          <a className="btn" href={APP_STORE_URL}>
            Get the app
          </a>
        ) : (
          <Link className="btn" href="/#try">
            Get the app
          </Link>
        )}
      </nav>
    </header>
  );
}
