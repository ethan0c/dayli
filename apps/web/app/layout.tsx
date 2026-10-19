import type { Metadata, Viewport } from 'next';
import { Onest } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { DESCRIPTION, SITE_URL, TAGLINE } from '@/lib/site';
import './globals.css';

const onest = Onest({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-onest', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Nowli: ${TAGLINE}`, template: '%s · Nowli' },
  description: DESCRIPTION,
  openGraph: { siteName: 'Nowli', type: 'website', locale: 'en_US', url: SITE_URL, title: `Nowli: ${TAGLINE}`, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `Nowli: ${TAGLINE}`, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0E13' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={onest.variable}>
      <body>
        <div className="wrap">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
