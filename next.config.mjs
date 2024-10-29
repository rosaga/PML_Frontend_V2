export default {
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