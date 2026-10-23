import { APP_URL, SITE_URL } from './site';

/**
 * Browsers may call the API from the site, from the web planner, and from anywhere in development
 * (the Expo web build runs on another port). The app's native requests carry no origin and ignore CORS.
 */
export function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowed = origin && (origin === SITE_URL || origin === APP_URL || process.env.NODE_ENV === 'development') ? origin : SITE_URL;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RevenueCat-App-User-Id',
    Vary: 'Origin',
  };
}
