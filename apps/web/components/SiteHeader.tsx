'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/app/Wordmark';
import { APP_STORE_LIVE, APP_STORE_URL } from '@/lib/site';

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className={path === '/' ? 'topbar over-hero' : 'topbar'}>
      <div className="topbar-in">
        <Link href="/" className="wm-link" aria-label="Semli home">
          <Wordmark width={76} />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/pricing" aria-current={path === '/pricing' ? 'page' : undefined}>
            Pricing
          </Link>
          <Link href="/#try" className="nav-try">
            Try it
          </Link>
          {APP_STORE_LIVE ? (
            <a className="btn" href={APP_STORE_URL}>
              Get the app
            </a>
          ) : (
            <Link className="btn" href="/#beta">
              Join the beta
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
