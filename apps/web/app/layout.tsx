import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { DESCRIPTION, KEYWORDS, SITE_URL, SUPPORT_EMAIL, TAGLINE } from '@/lib/site';
import './globals.css';

/** Geist everywhere, the same as the app (CLAUDE.md). */
const sans = Geist({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Semli: ${TAGLINE}`, template: '%s · Semli' },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: 'Semli',
  openGraph: { siteName: 'Semli', type: 'website', locale: 'en_US', url: SITE_URL, title: `Semli: ${TAGLINE}`, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `Semli: ${TAGLINE}`, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#151515' },
  ],
};

/** Structured data for search engines: who we are, what the app is, and that the site is searchable by name. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'Semli', url: SITE_URL, logo: `${SITE_URL}/icon.png`, email: SUPPORT_EMAIL },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, url: SITE_URL, name: 'Semli', publisher: { '@id': `${SITE_URL}/#org` } },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'Semli',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'iOS',
      description: DESCRIPTION,
      url: SITE_URL,
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free plan' },
        { '@type': 'Offer', price: '4.99', priceCurrency: 'USD', description: 'Semli Plus, monthly, student price' },
        { '@type': 'Offer', price: '29.99', priceCurrency: 'USD', description: 'Semli Plus, yearly, student price' },
      ],
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <div className="wrap">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
