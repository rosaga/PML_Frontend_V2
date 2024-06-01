"use client";
import React from "react";
import { Card, CardContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import "../../app/globals.css";

const Login = () => {

  const router = useRouter();

  const handleButtonClick = () => {
    router.push('/signup');
  };

  return (
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/onb1.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-2/5 h-full"></div> {/* Left half, empty */}
      <div className="w-3/5 h-full flex items-center justify-center"> {/* Right half */}
        <Card
          sx={{
            borderRadius: '24px',
            boxShadow: 'md',
            width: '60%', // Adjust the width as needed
            padding: 2,
          }}
        >
          <CardContent>
            <p className="text-6xl font-bold mb-4">Unlock</p>

            <p className="text-2xl text-[#E88A17] font-medium mb-4">Unlock Customer Engagement</p>

            <p className="text-lg"> Power your business with cutting-edge digital VAS tools </p>

            <p className="text-lg">that help you acquire, engage & retain your customers</p>

            <button className="bg-[#001F3D] w-full p-3 mt-14 text-white text-lg rounded-lg" onClick={handleButtonClick}> Get Started </button>
            
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Login;
