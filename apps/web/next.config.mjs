/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@commerce/types', '@commerce/validation'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
