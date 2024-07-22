"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from 'axios';
import apiUrl from "../api/utils/apiUtils/apiUrl"
import "../../app/globals.css";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const PasswordReset = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  
  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const resetPayload = { email };

    try {
      const res = await axios.post(apiUrl.resetPassword, resetPayload);
      if (res.status === 200) {
        setIsLoading(false);
        toast.success("RESET EMAIL SENT SUCCESSFULLY, KINDLY CHECK YOUR EMAIL FOR OTP");
        router.push('/verifyreset');
        
      } else {
        setIsLoading(false);
        toast.error("RESET FAILED");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("An error occurred, please try again.");
    }
  };
  const handleLogin = ()=>{
    router.push('/signin')
  }

  return (
    <>
    <ToastContainer />
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/otp.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-2/5 h-full"></div> {/* Left half, empty */}
      <div className="w-3/5 h-full flex items-center justify-center mr-32">
        {" "}
        {/* Right half */}
        <Card
          sx={{
            borderRadius: "lg",
            boxShadow: "md",
            width: "50%", // Adjust the width as needed
            padding: 4,
          }}
        >
          <CardContent>
            <div>
              <div className="flex items-center justify-center flex-col mb-4">
              <div className="">
                  <img
                    src="/images/peaklogo.png"
                    className="h-30 sm:h-24"
                    alt="Peak Logo"
                  />
                </div>
                <div className="mb-4 mt-4">
                  <p className="text-2xl font-semibold">Password Reset</p>
                </div>
                <div>
                  <p className="text-lg font-md">Enter your email address</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mb-4 border rounded-md"
                  placeholder="Enter your email"
                />
              </div>

              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2"
                onClick={handleReset}
              >
               {isLoading ? "Please wait..." : "Reset Password"}
              </button>

              <p className="flex text-sm font-md justify-center mt-4">
                Back to Login?{" "}
                <span className="text-[#E88A17] cursor-pointer ml-2" onClick={handleLogin}>
                  Signin
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default PasswordReset;
