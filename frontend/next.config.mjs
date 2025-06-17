/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
          {
            source: '/',
            destination: '/offers',
            permanent: true,
          },
        ];
      },
      images: {
        remotePatterns: [
          {
            protocol: 'http',
            hostname: 'localhost',
          },
          {
            protocol: 'http',
            hostname: '116.203.198.150',
          }
        ],
      },
};

export default nextConfig;
