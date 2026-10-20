import type { MetadataRoute } from 'next';
import { LEGAL_UPDATED, absoluteUrl } from '@/lib/site';

type Entry = MetadataRoute.Sitemap[number];
const page = (path: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'monthly'): Entry => ({
  url: absoluteUrl(path),
  priority,
  changeFrequency,
});

/** Search engines read lastModified (they ignore priority); only pages with a known edit date get one. */
const legal = (path: string): Entry => ({ ...page(path, 0.2, 'yearly'), lastModified: new Date(LEGAL_UPDATED) });

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page('/', 1, 'weekly'),
    page('/pricing', 0.8),
    page('/syllabus-to-calendar', 0.7),
    page('/assignment-tracker', 0.7),
    page('/work-and-school-schedule-planner', 0.7),
    page('/contact', 0.4, 'yearly'),
    legal('/privacy'),
    legal('/terms'),
  ];
}
