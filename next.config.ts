import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pure static site — `next build` emits out/ with no server runtime.
  output: 'export',
};

export default nextConfig;
