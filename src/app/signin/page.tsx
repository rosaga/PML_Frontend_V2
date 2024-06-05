"use client" ;  
import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, LinearProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import "../../app/globals.css";
import { setToken } from "../../utils/auth";

const SignIn = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/token`, {
        username,
        password,
      });
     
      if (response.status === 200) {
        let token = response.data.token;
        console.log(response.data)
        setToken(token); 
        alert("Login successful!");
        router.push("/apps/1/dashboard");
      } else {
        console.error("Login failed:", response.data);
      }
      setIsLoading(false);
    } catch (error) {
      alert("Login failed. Invalid username or password Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/onblogin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <div className="w-2/5 h-full"></div>
      <div className="w-3/5 h-full flex items-center justify-center">
        <Card sx={{
            borderRadius: "lg",
            boxShadow: "md",
            width: "60%",
            padding: 2,
          }}>
          <CardContent>
            <div>
              <p className="text-xl font-lg mb-4 mt-2">Welcome Back!</p>
              <div>
                <input type="email" placeholder="Your Email *" className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                  value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Your Password *" className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md" onClick={!isLoading ? handleLogin : undefined}> {isLoading ? <LinearProgress></LinearProgress> : 'Loading'}</button>
              <p className="flex text-sm font-md justify-end mt-4">Forgot Password?</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;