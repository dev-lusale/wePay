/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Required when using pages/ alongside app/ in Next.js 14
  experimental: {},
};

export default nextConfig;
