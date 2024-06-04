"use client";
import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import "../../app/globals.css";

const SignIn = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post("https://peak-mobile-backend-4yhy5.ondigitalocean.app/public/token", {
        username,
        password,
      });

      if (response.status === 200) {
        // Login successful, redirect to dashboard
        router.push("/apps/1/dashboard");
      } else {
        // Handle failed login (e.g., display error message)
        console.error("Login failed:", response.data);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
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
                onClick={handleLogin}
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

export default SignIn;