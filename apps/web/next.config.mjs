/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@commerce/types', '@commerce/validation'],
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;
