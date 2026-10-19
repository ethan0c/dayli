import { SITE_URL } from '@/lib/site';

export interface Faq {
  q: string;
  a: string;
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
      { '@type': 'ListItem', position: 1, name: 'Semli', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}
