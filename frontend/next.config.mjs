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
        domains: ['localhost'],
      },
};

export default nextConfig;
