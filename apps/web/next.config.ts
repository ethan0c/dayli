import type { NextConfig } from 'next';

// Next's own runtime needs inline scripts and styles; everything else is first-party (fonts are
// self-hosted through next/font). Dev adds eval for React Refresh.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: CSP },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: { qualities: [75, 85] },
  transpilePackages: ['@dayli/core', '@dayli/schema', '@dayli/tokens', '@dayli/extract'],
};

export default nextConfig;
