/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.cloudivion.com',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
