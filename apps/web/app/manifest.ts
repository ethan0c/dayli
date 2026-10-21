import type { MetadataRoute } from 'next';
import { DESCRIPTION, SITE_NAME } from '@/lib/site';
import { sitePalettes } from './tokens';

/** Lets "Add to Home Screen" and Android show the right name, icon and colors. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'browser',
    background_color: sitePalettes.light.canvas,
    theme_color: sitePalettes.light.canvas,
    icons: [
      { src: '/icon.png', type: 'image/png', sizes: '512x512' },
      { src: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  };
}
