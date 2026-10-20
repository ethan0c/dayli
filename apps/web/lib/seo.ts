import type { Metadata } from 'next';
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE, absoluteUrl } from '@/lib/site';

export interface Faq {
  q: string;
  a: string;
}

/** The title a share card shows when a page has no headline of its own. */
export const HOME_TITLE = `${SITE_NAME}: ${TAGLINE}`;

/**
 * Metadata for one page: canonical, description, and complete Open Graph and Twitter cards.
 * Next replaces a parent's `openGraph` object instead of merging it, so every page builds its own
 * here rather than half-overriding the layout's (which lost the site name and description).
 */
export function pageMetadata({
  path,
  title,
  description = DESCRIPTION,
  shareTitle,
  ownCard = false,
}: {
  path: string;
  /** The <title> before the " · Semli" template; omit for the home page. */
  title?: string;
  description?: string;
  /** The headline on share cards; defaults to the page title. */
  shareTitle?: string;
  /** True when the page folder has its own opengraph-image.png, which an explicit image would override. */
  ownCard?: boolean;
}): Metadata {
  const card = shareTitle ?? (title ? `${title} · ${SITE_NAME}` : HOME_TITLE);
  // Pages without their own card fall back to the site-wide one (a page's openGraph drops the layout's).
  // Leave the key out entirely for ownCard: even `images: undefined` hides the page's file.
  const image = ownCard ? {} : { images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: HOME_TITLE }] };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_US', url: absoluteUrl(path), title: card, description, ...image },
    twitter: { card: 'summary_large_image', title: card, description, ...image },
  };
}

/** FAQPage structured data for a page's questions; render with a JSON-LD script tag. */
export function faqJsonLd(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** BreadcrumbList for a top-level landing page. */
export function breadcrumbJsonLd(path: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
    ],
  };
}
