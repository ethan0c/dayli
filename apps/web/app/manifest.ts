import type { MetadataRoute } from 'next';
import { DESCRIPTION, SITE_NAME } from '@/lib/site';

/** Lets "Add to Home Screen" and Android show the right name, icon and colors. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'browser',
    background_color: '#FAF9F6',
    theme_color: '#FAF9F6',
    icons: [
      { src: '/icon.png', type: 'image/png', sizes: '512x512' },
      { src: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  };
}
