'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Wordmark } from '@/app/Wordmark';
import { APP_STORE_LIVE, APP_STORE_URL } from '@/lib/site';

export function SiteHeader() {
  const path = usePathname();
  const overHero = useOverHero(path === '/');
  return (
    <header className={overHero ? 'topbar over-hero' : 'topbar'}>
      <div className="topbar-in">
        <Link href="/" className="wm-link" aria-label="Semli home">
          <Wordmark width={76} />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/pricing" aria-current={path === '/pricing' ? 'page' : undefined}>
            Pricing
          </Link>
          <Link href="/contact" className="nav-contact" aria-current={path === '/contact' ? 'page' : undefined}>
            Contact
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

/** True while the bar sits over the home hero's sky, so its wordmark and links go white. */
function useOverHero(home: boolean) {
  const [over, setOver] = useState(true);
  useEffect(() => {
    if (!home) return;
    // The sky photo is the hero's first child; below its middle the veil fades to paper.
    const sky = document.querySelector('[aria-labelledby="home-title"]')?.firstElementChild;
    if (!sky) return;
    const update = () => {
      const r = sky.getBoundingClientRect();
      setOver(r.top + r.height / 2 > (document.querySelector('.topbar')?.clientHeight ?? 64));
    };
    const first = requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [home]);
  return home && over;
}
