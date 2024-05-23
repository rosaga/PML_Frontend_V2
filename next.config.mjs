const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: `/apps/${process.env.NEXT_PUBLIC_APP_ID}/dashboard`, // Redirect to the dashboard page
          permanent: true,
        },
      ]
    },
  }
  
  export default nextConfig;