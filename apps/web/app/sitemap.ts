import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

type Entry = MetadataRoute.Sitemap[number];
const page = (path: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'monthly'): Entry => ({
  url: absoluteUrl(path),
  priority,
  changeFrequency,
});

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page('/', 1, 'weekly'),
    page('/pricing', 0.8),
    page('/syllabus-to-calendar', 0.7),
    page('/assignment-tracker', 0.7),
    page('/work-and-school-schedule-planner', 0.7),
    page('/contact', 0.4, 'yearly'),
    page('/privacy', 0.2, 'yearly'),
    page('/terms', 0.2, 'yearly'),
  ];
}
