"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from 'axios';
import apiUrl from "../api/utils/apiUtils/apiUrl"
import "../../app/globals.css";
import OtpInput from 'react-otp-input';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const Otp = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  let email = null;
  if (typeof window !== 'undefined') {
    email = localStorage.getItem('signupEmail');
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    const verifyPayload = {
      email,
      otp,
    };

    try {
      const res = await axios.post(apiUrl.VERIFY_EMAIL, verifyPayload);
      if (res.status === 200) {
        setIsLoading(false)
        toast.success("VERIFICATION SUCCESSFULL")
        router.push('/signin');
        setToken(res.data.access_token)
      } else {
        setIsLoading(false)
        toast.error("VERIFICATION FAILED")
      }
    } catch (error) {
      console.log("VERIFY ERROR", error)
      setIsLoading(false)
      toast.error("VERIFICATION FAILED")
    }
  };

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
                  <p className="text-2xl font-semibold">OTP Verification</p>
                </div>
                <div>
                  <p className="text-lg font-md">Enter the OTP Sent to</p>
                  <p className="text-md font-light">{email}</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderSeparator={<span>&nbsp;</span>}
                  renderInput={(props) => <input {...props} />}
                  inputStyle={{
                    width: "35px",
                    marginBottom: "10px",
                    height: "30px",
                    backgroundColor: "transparent",
                    outline: "none",
                    borderRadius: "5px", // Add border radius
                    border: "1px solid #ccc", // Optional: Add a border for better visibility
                  }}
                />
              </div>

              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2"
                onClick={handleVerify}
              >
               {isLoading ? "Please wait..." : "Verify"}
              </button>

              <p className="flex text-xs text-gray-600 font-md justify-center mt-8">
                **Please check spam if you miss the code in your inbox**{" "}
                {/* <span className="text-[#E88A17] ml-2"> Resend Code</span> */}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Otp;
