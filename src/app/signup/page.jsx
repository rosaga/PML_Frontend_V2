"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import "../../app/globals.css";

const SignUp = () => {
  const router = useRouter();

  console.log("THE URL IS",process.env.NEXT_PUBLIC_KEYCLOAK_URL)

  const handleButtonClick = () => {
    const keycloakUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/peakmobile/protocol/openid-connect/registrations`;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const redirectUri = "http://localhost:3000/api/auth/callback";

    const registrationUrl = `https://auth-jja4kcvvdq-ez.a.run.app/realms/peakmobile/protocol/openid-connect/registrations?client_id=PeakmobileUI&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log("Registration URL:", registrationUrl);
    window.location.href = registrationUrl;
  };

  


  const handleLoginClick = () => {
    router.push("/signin");
  };

  return (
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/signup.png')",
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
                Welcome To Peak Mobile!
              </p>

              <div>
                <input
                  type="text"
                  placeholder="Your First Name *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 mt-2 rounded-md border-white"
                />

                <input
                  type="text"
                  placeholder="Your Last Name *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                />

                <input
                  type="text"
                  placeholder="Your Organization Name *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                />

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

                <input
                  type="password"
                  placeholder="Confirm Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                />
              </div>

              <div className="flex items-center mb-4 mt-2 justify-center">
                <input type="checkbox" className="mr-2" />
                <p className="text-sm font-md">
                  Agree to our terms & conditions ?
                </p>
              </div>
              <button
                className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md"
                onClick={handleButtonClick}
              >
                {" "}
                Sign-up{" "}
              </button>
              <p className="flex text-sm font-md justify-center mt-4">
                Already have an account?{" "}
                <span className="text-[#E88A17] cursor-pointer ml-2" onClick={handleLoginClick}>{" "}Login</span>
              </p>
              <p className="flex justify-center items-center m-1 relative">
                <span className="line"></span>
                <span className="mx-2">Or</span>
                <span className="line"></span>
              </p>

              <div className="flex justify-center m-2 ">
                <GoogleButton
                  type="dark"
                  label="Google"
                  onClick={() => {
                    console.log("Google button clicked");
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
