// components/SignIn.js
'use client';

import React, { useState } from 'react';
import { Card, CardContent, LinearProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import '../../app/globals.css';

const SignIn = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
    signIn('keycloak');
  };

  if (status === 'authenticated') {
    return (
      <div>
        <div>Your name is {session.user?.name}</div>
        <div>
          <button onClick={() => signOut()}>Sign out of Keycloak</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/onblogin.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-2/5 h-full"></div>
      <div className="w-3/5 h-full flex items-center justify-center mr-28">
        <Card
          sx={{
            borderRadius: 'lg',
            boxShadow: 'md',
            width: '60%',
            padding: 2,
          }}
        >
          <CardContent>
            <div>
              <p className="text-xl font-lg mb-4 mt-2">Welcome Back!</p>
              <div>
                <input
                  type="email"
                  placeholder="Your Email *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Your Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md"
                onClick={handleSignIn}
              >
                {isLoading ? <LinearProgress /> : 'Log in'}
              </button>
              <p className="flex text-sm font-md justify-end mt-4">Forgot Password?</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
