"use client";
import React from "react";
import { Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import "../../app/globals.css";

const Login = () => {
  const router = useRouter();

  const handleButtonClick = () => {
    router.push('/signup');
  };

  return (
    <div
      className="relative h-screen w-full flex items-center justify-center"
      style={{
        backgroundImage: "url('/images/onb1.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hidden lg:block w-2/5 h-full"></div> {/* Left half, hidden on small screens */}
      
      <div className="lg:w-3/5 w-full h-full flex items-center justify-center px-4 lg:px-32"> {/* Right half, responsive */}
        <Card
          sx={{
            borderRadius: '24px',
            boxShadow: 'md',
            width: { xs: '100%', sm: '80%', md: '70%', lg: '60%' }, // Dynamic width
            padding: 2,
          }}
        >
          <CardContent className="text-center"> {/* Center content */}
            <p className="text-4xl md:text-6xl font-bold mb-4">Unlock</p>

            <p className="text-xl md:text-2xl text-[#E88A17] font-medium mb-4">Unlock Customer Engagement</p>

            <p className="text-md md:text-lg">Power your business with cutting-edge digital VAS tools</p>

            <p className="text-md md:text-lg">that help you acquire, engage & retain your customers</p>

            <button 
              className="bg-[#001F3D] w-full p-3 mt-8 md:mt-14 text-white text-md md:text-lg rounded-lg" 
              onClick={handleButtonClick}
            > 
              Get Started 
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
