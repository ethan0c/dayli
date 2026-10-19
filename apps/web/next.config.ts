import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ['@dayli/core', '@dayli/schema', '@dayli/tokens', '@dayli/extract'],
};

export default nextConfig;
