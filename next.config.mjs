/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [280, 360, 520, 640, 768, 1024, 1280],
    imageSizes: [50, 72, 120, 200, 250],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.output = config.output || {};
      config.output.chunkLoadTimeout = 300000; // 300 seconds (5 minutes)
    }
    return config;
  },
};

export default nextConfig;
