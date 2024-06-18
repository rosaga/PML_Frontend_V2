import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Callback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const keycloak = await import('keycloak-js').then((mod) => mod.default);
      const kc = new keycloak({
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
      });
      await kc.init({ onLoad: 'login-required' });
      if (kc.authenticated) {
        localStorage.setItem('token', kc.token);
        router.push('/');
      }
    };

    handleAuth();
  }, [router]);

  return <div>Loading...</div>;
};

export default Callback;
