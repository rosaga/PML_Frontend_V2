"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setToken } from "@/utils/auth";
import { ToastContainer, toast } from "react-toastify";
import apiUrl from "../api/utils/apiUtils/apiUrl";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import "../../app/globals.css";
import "react-toastify/dist/ReactToastify.css";

const SignIn = () => {
  const router = useRouter();

  const [authMode, setAuthMode] = useState("password");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpChannel, setOtpChannel] = useState("sms");
  const [otpSent, setOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpRequestLoading, setIsOtpRequestLoading] = useState(false);
  const [isOtpVerifyLoading, setIsOtpVerifyLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handlePasswordSignIn = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsLoading(true);

    const signinPayload = {
      username,
      password,
    };

    try {
      const res = await axios.post(apiUrl.SIGN_IN, signinPayload);

      if (res.status === 200 && res.data?.access_token) {
        toast.success("LOGIN SUCCESS");
        setToken(res.data.access_token);
        router.push("/user-orgs");
      } else {
        toast.error("WRONG USERNAME/PASSWORD");
      }
    } catch (error) {
      toast.error("WRONG USERNAME/PASSWORD");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!otpPhone) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsOtpRequestLoading(true);

    const otpPayload = {
      phone_number: otpPhone,
      channel: otpChannel,
    };

    try {
      const res = await axios.post(apiUrl.REQUEST_LOGIN_OTP, otpPayload);

      if (res.status === 200 || res.status === 201) {
        setOtpSent(true);

        if (otpChannel === "whatsapp") {
          toast.success("OTP sent on WhatsApp");
        } else {
          toast.success("OTP sent by SMS");
        }
      } else {
        toast.error("Could not send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Could not send OTP. Please try again.");
    } finally {
      setIsOtpRequestLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpPhone || !otpCode) {
      toast.error("Please enter your phone number and OTP");
      return;
    }

    setIsOtpVerifyLoading(true);

    const verifyPayload = {
      phone_number: otpPhone,
      otp: otpCode,
      channel: otpChannel,
    };

    try {
      const res = await axios.post(apiUrl.VERIFY_LOGIN_OTP, verifyPayload);

      const accessToken = res.data?.access_token || res.data?.token;

      if (res.status === 200 && accessToken) {
        toast.success("LOGIN SUCCESS");
        setToken(accessToken);
        router.push("/user-orgs");
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      toast.error("Invalid OTP");
    } finally {
      setIsOtpVerifyLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/signup");
  };

  const handleForgetPassword = () => {
    router.push("/reset");
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpCode("");
  };

  return (
    <>
      <ToastContainer />

      <div
        className="relative h-screen w-full flex flex-col sm:flex-row"
        style={{
          backgroundImage: "url('/images/miniapp_background.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "relative",
        }}
      >
        <div className="hidden sm:block sm:w-2/5 h-full"></div>

        <div className="w-full sm:w-3/5 h-full flex items-center justify-center p-4">
          <Card
            sx={{
              borderRadius: "lg",
              boxShadow: "md",
              width: "90%",
              maxWidth: "500px",
              padding: 0,
            }}
          >
            <CardContent>
              <div className="flex flex-col">
                <p className="text-xl font-lg mb-4 mt-2 text-center sm:text-left">
                  Welcome Back!
                </p>

                <div className="grid grid-cols-2 gap-2 mb-5 bg-[#F1F2F3] p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={`p-2 rounded-md text-sm font-medium ${
                      authMode === "password"
                        ? "bg-[#001F3D] text-white"
                        : "text-[#001F3D]"
                    }`}
                  >
                    Email Login
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode("otp")}
                    className={`p-2 rounded-md text-sm font-medium ${
                      authMode === "otp"
                        ? "bg-[#001F3D] text-white"
                        : "text-[#001F3D]"
                    }`}
                  >
                    OTP Login
                  </button>
                </div>

                {authMode === "password" && (
                  <form onSubmit={handlePasswordSignIn}>
                    <div className="mb-4">
                      <input
                        type="email"
                        placeholder="Your Email *"
                        className="w-full bg-[#F1F2F3] p-2.5 mb-2 rounded-md border-white"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />

                      <div className="relative w-full">
                        <input
                          type={isPasswordVisible ? "text" : "password"}
                          placeholder="Your Password *"
                          className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white pr-12"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />

                        <IconButton
                          aria-label="toggle password visibility"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                          onClick={() =>
                            setIsPasswordVisible(!isPasswordVisible)
                          }
                        >
                          {isPasswordVisible ? (
                            <VisibilityIcon />
                          ) : (
                            <VisibilityOffIcon />
                          )}
                        </IconButton>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2 disabled:opacity-70"
                    >
                      {isLoading ? "Please wait..." : "Sign In"}
                    </button>
                  </form>
                )}

                {authMode === "otp" && (
                  <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
                    <div className="mb-4">
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        className="w-full bg-[#F1F2F3] p-2.5 mb-3 rounded-md border-white"
                        value={otpPhone}
                        onChange={(e) => {
                          setOtpPhone(e.target.value);
                          resetOtpFlow();
                        }}
                      />

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Send OTP via
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpChannel("sms");
                              resetOtpFlow();
                            }}
                            className={`p-2 rounded-md text-sm border ${
                              otpChannel === "sms"
                                ? "bg-[#001F3D] text-white border-[#001F3D]"
                                : "bg-white text-[#001F3D] border-gray-300"
                            }`}
                          >
                            SMS
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOtpChannel("whatsapp");
                              resetOtpFlow();
                            }}
                            className={`p-2 rounded-md text-sm border ${
                              otpChannel === "whatsapp"
                                ? "bg-[#001F3D] text-white border-[#001F3D]"
                                : "bg-white text-[#001F3D] border-gray-300"
                            }`}
                          >
                            WhatsApp
                          </button>
                        </div>
                      </div>

                      {otpSent && (
                        <input
                          type="text"
                          placeholder="Enter OTP *"
                          className="w-full bg-[#F1F2F3] p-2.5 mb-2 rounded-md border-white"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isOtpRequestLoading || isOtpVerifyLoading}
                      className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2 disabled:opacity-70"
                    >
                      {!otpSent &&
                        (isOtpRequestLoading
                          ? "Sending OTP..."
                          : "Send OTP")}

                      {otpSent &&
                        (isOtpVerifyLoading
                          ? "Verifying OTP..."
                          : "Verify OTP")}
                    </button>

                    {otpSent && (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isOtpRequestLoading}
                        className="w-full p-2 text-[#E88A17] text-sm rounded-md mt-2 disabled:opacity-70"
                      >
                        {isOtpRequestLoading ? "Resending..." : "Resend OTP"}
                      </button>
                    )}
                  </form>
                )}

                <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm">
                  <p className="flex items-center justify-start mb-2 sm:mb-0">
                    Don&apos;t have an account?{" "}
                    <span
                      className="text-[#E88A17] cursor-pointer ml-2"
                      onClick={handleRegister}
                    >
                      Register
                    </span>
                  </p>

                  <p className="flex items-center justify-start">
                    Forgot Password?
                    <span
                      className="text-[#E88A17] cursor-pointer ml-2"
                      onClick={handleForgetPassword}
                    >
                      Click here
                    </span>
                  </p>
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