import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // IMPORTANT: DO NOT use 'standalone' for cPanel shared hosting
  // Standard build works better with cPanel proxy
  
  // Disable image optimization for cPanel shared hosting
  images: {
    unoptimized: true,
  },
  
  // Use consistent build ID to avoid path issues
  generateBuildId: async () => {
    return 'prod'
  },
  
  // Disable static optimization to prevent BUILD_ID subfolder
  experimental: {
    // Keep it simple for cPanel
  },
  
  // The Next.js dev "static route indicator" subscribes to the ISR manifest
  // and, on this version (16.2.x), throws a harmless console error in the
  // Pages Router hot-reloader (handleStaticIndicator → router.components).
  // Disabling the indicator removes the noisy dev-only console error.
  // This has no effect on production builds.
  devIndicators: false,
};

export default nextConfig;
