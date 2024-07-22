// components/SignIn.js
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, LinearProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { setToken } from '@/utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import apiUrl from "../api/utils/apiUtils/apiUrl"
import "react-toastify/dist/ReactToastify.css";
import '../../app/globals.css';

const SignIn = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    const signinPayload = {
      username,
      password,
    };

    try {
      const res = await axios.post(apiUrl.SIGN_IN, signinPayload);
      if (res.status === 200) {
        setIsLoading(false)
        toast.success("LOGIN SUCCESS")
        router.push('/user-orgs');
        setToken(res.data.access_token)
      } else {
        setIsLoading(false)
        toast.error("WRONG USERNAME/PASSWORD")
      }
    } catch (error) {
      setIsLoading(false)
      toast.error("WRONG USERNAME/PASSWORD")
    }
  };

  const handleRegister = () => {
    router.push("/signup");
  };
  const handleForgetPassword = () => {
    router.push("/reset");
  };

  return (
    <>
    <ToastContainer />
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
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
               
                <input
                  type="password"
                  placeholder="Your Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
              </div>
              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2"
                onClick={handleSignIn}
              >
               {isLoading ? "Please wait..." : " Sign In"}
              </button>
              <div className='flex justify-between'>
              <p className="flex text-sm font-md justify-start mt-4">
                Don&apos;t have an account?{" "}
                <span className="text-[#E88A17] cursor-pointer ml-2" onClick={handleRegister}>
                  Register
                </span>
              </p>

              <p className="flex text-sm font-md justify-end mt-4">Forgot Password ?
              <span className="text-[#E88A17] cursor-pointer ml-2" onClick={handleForgetPassword}>
                  click here
                </span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default SignIn;
