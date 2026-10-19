import type { Metadata, Viewport } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';

const onest = Onest({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-onest', display: 'swap' });

export const metadata: Metadata = {
  title: 'Dayli',
  description: 'Your life, already organized. Send Dayli a work schedule, a syllabus, or a message, and get back a plan.',
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
      <body>{children}</body>
    </html>
  );
}
