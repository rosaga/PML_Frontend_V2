// components/SessionProviderWrapper.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { keepSessionAlive } from '@/utils/auth';

const SessionProviderWrapper = ({ children }) => {
  useEffect(() => {
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    const options = { passive: true, capture: true };
    events.forEach((event) => window.addEventListener(event, keepSessionAlive, options));
    return () => events.forEach((event) => window.removeEventListener(event, keepSessionAlive, options));
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
