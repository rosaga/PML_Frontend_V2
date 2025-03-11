"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiUrl from "../api/utils/apiUtils/apiUrl";
import "../../app/globals.css";
import OtpInput from "react-otp-input";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Otp = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);

  let email = null;
  if (typeof window !== "undefined") {
    email = localStorage.getItem("signupEmail");
  }

  // countdown timer effect.
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const verifyPayload = {
      email,
      otp,
    };

    try {
      const res = await axios.post(apiUrl.VERIFY_EMAIL, verifyPayload);
      if (res.status === 200) {
        setIsLoading(false);
        toast.success("VERIFICATION SUCCESSFUL");
        router.push("/signin");
      } else {
        setIsLoading(false);
        toast.error("VERIFICATION FAILED");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Error verifying OTP");
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await axios.post(apiUrl.REQUEST_OTP, { email });
      if (res.status === 200) {
        toast.success("New OTP sent, valid for 60 seconds.");
        setTimeLeft(60);
      } else {
        toast.error("Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Error while resending OTP");
    } finally {
      setIsResending(false);
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
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                <button
                  className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2"
                  onClick={handleVerify}
                >
                  {isLoading ? "Please wait..." : "Verify"}
                </button>

                <div className="flex flex-col items-center mt-8">
                  <p className="text-xs text-gray-600 font-md mb-2">
                    **Please check spam if you miss the code in your inbox**
                  </p>
                  <button
                    disabled={timeLeft > 0 || isResending}
                    onClick={handleResend}
                    className={`text-xs font-md ${
                      timeLeft > 0 || isResending ? "text-gray-400" : "text-[#E88A17]"
                    }`}
                  >
                    {timeLeft > 0
                      ? `Resend Code in ${timeLeft}s`
                      : "Resend Code"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Otp;
