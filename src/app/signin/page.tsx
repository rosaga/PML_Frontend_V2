"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import "../../app/globals.css";

const SignUp = () => {
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/apps/1/dashboard");
  };

  

  return (
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/onblogin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-2/5 h-full"></div> {/* Left half, empty */}
      <div className="w-3/5 h-full flex items-center justify-center">
        {" "}
        {/* Right half */}
        <Card
          sx={{
            borderRadius: "lg",
            boxShadow: "md",
            width: "60%", // Adjust the width as needed
            padding: 2,
          }}
        >
          <CardContent>
            <div>
              <p className="text-xl font-lg mb-4 mt-2">
                Welcome Back!
              </p>

              <div>

                <input
                  type="email"
                  placeholder="Your Email *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                />

                <input
                  type="password"
                  placeholder="Your Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                />

              </div>

              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md"
                onClick={handleButtonClick}
              >
                {" "}
                Login{" "}
              </button>
              <p className="flex text-sm font-md justify-end mt-4">
                Forgot Password?
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
