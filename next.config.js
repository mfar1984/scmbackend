/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Output standalone for better performance
  output: 'standalone',
  
  // Image optimization (updated to use remotePatterns)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scm-core.malaysiadev.com',
      },
      {
        protocol: 'https',
        hostname: 'scm.malaysiadev.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack configuration for standalone build
  // Standalone mode handles dependency bundling automatically
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config;
  },
  
  // API routes configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Environment variables that should be available on client-side
  env: {
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://scm.malaysiadev.com',
    APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || 'https://scm-core.malaysiadev.com',
  },
};

module.exports = nextConfig;
