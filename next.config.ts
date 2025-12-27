import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
} as NextConfig & {
  // For Next.js 16, increase body size limit for API routes
  // This property is available but not in the TypeScript types yet
  middlewareClientMaxBodySize?: string;
};

// @ts-ignore - Next.js 16 allows this configuration for FormData uploads
(nextConfig as any).middlewareClientMaxBodySize = '50mb';

export default nextConfig;
