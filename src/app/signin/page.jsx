"use client"
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
import Modal from "@mui/material/Modal";
import "../../app/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { GetSenderId } from "../api/actions/senderId/senderId";

const SignIn = () => {
 
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);



  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const signinPayload = {
      username,
      password,
    };

    try {
      const res = await axios.post(apiUrl.SIGN_IN, signinPayload);
      if (res.status === 200) {
        setIsLoading(false);
        toast.success("LOGIN SUCCESS");
        setToken(res.data.access_token);
        router.push("/user-orgs"); 
      } else {
        setIsLoading(false);
        toast.error("WRONG USERNAME/PASSWORD");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("WRONG USERNAME/PASSWORD");
    }
  };

  const handleRegister = () => {
    router.push("/signup");
  };

  const handleForgetPassword = () => {
    router.push("/reset");
  };


  return (
    <>

      <ToastContainer />
      <div
        className="relative h-screen w-full flex flex-col sm:flex-row"
        style={{
          backgroundImage: "url('/images/miniapp_background.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: 'relative',
        }}
      >
        <div className="hidden sm:block sm:w-2/5 h-full"></div>
        <div className="w-full sm:w-3/5 h-full flex items-center justify-center p-4">
          <Card
            sx={{
              borderRadius: "lg",
              boxShadow: "md",
              width: "90%",
              maxWidth: "500px", // Max width to keep it compact on larger screens
              padding: 0,
            }}
          >
            <CardContent>
              <div className="flex flex-col">
                <p className="text-xl font-lg mb-4 mt-2 text-center sm:text-left">Welcome Back!</p>
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Your Email *"
                    className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  
                  <div className="relative w-full">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Your Password *"
                      className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <IconButton
                      aria-label="toggle password visibility"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
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
                  className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md mt-2"
                  onClick={handleSignIn}
                >
                  {isLoading ? "Please wait..." : "Sign In"}
                </button>
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

      {/* Modal for success */}
    
    </>
  );
};


export default SignIn;
