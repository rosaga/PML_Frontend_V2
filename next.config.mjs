import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/signin',
        permanent: false,
      },
    ];
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default withPWA(nextConfig);