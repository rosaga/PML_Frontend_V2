"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import apiUrl from "../api/utils/apiUtils/apiUrl"
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import "react-toastify/dist/ReactToastify.css";
import "../../app/globals.css";


const SignUp = () => {
  const router = useRouter();

  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [organization, setOrganization] = useState(""); // Added state for organization
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstname) newErrors.firstname = "First name is required";
    if (!lastname) newErrors.lastname = "Last name is required";
    if (!organization) newErrors.organization = "Organization name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email address";
    }
    if (!password) newErrors.password = "Password is required";
    if (!agreeToTerms) newErrors.agreeToTerms = "Please agree to terms & conditions";
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
     if (!validateForm()) {
      return;
    }
    setIsLoading(true)
    const signupPayload = {
      firstname: firstname,
      lastName: lastname,
      email: email,
      credentials: [
          {
              type: "password",
              value: password,
              temporary: false
          }
      ],
      attributes: {
          ACCOUNT: [
              organization
          ]
      }
  }

    try {
      const res = await axios.post(apiUrl.SIGN_UP, signupPayload);
      if (res.status === 200) {
        setIsLoading(false)
        toast.success("SIGNUP SUCCESS")
        localStorage.setItem('signupEmail', email);
        router.push("/otp");
      } else {
        setIsLoading(false)
        toast.error("SIGN UP FAILED, EMAIL ALREADY EXISTS")
      }
    } catch (error) {
      setIsLoading(false)
      toast.error("SIGN UP FAILED")
    }
  };

  const handleLoginClick = () => {
    router.push("/signin");
  };

  return (
    <>
      <ToastContainer />
      <div
        className="relative h-screen w-full flex flex-col sm:flex-row items-center"
        style={{
          backgroundImage: "url('/images/signup.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Left half (hidden on small screens) */}
        <div className="hidden sm:block sm:w-2/5 h-full"></div>

        {/* Right half */}
        <div className="w-full sm:w-3/5 h-full flex items-center justify-center p-4">
          <Card
            sx={{
              borderRadius: "lg",
              boxShadow: "md",
              width: "90%",
              maxWidth: "500px", // Set a max width for larger screens
              padding: 0,
            }}
          >
            <CardContent>
              <div className="flex flex-col">
                <p className="text-xl font-lg mb-4 mt-2 text-center">
                  Welcome To Peak Mobile!
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your First Name *"
                    className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white"
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  {errors.firstname && <p className="text-red-500 text-xs mb-2">{errors.firstname}</p>}

                  <input
                    type="text"
                    placeholder="Your Last Name *"
                    className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white"
                    value={lastname}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {errors.lastname && <p className="text-red-500 text-xs mb-2">{errors.lastname}</p>}

                  <input
                    type="text"
                    placeholder="Your Organization Name *"
                    className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                  {errors.organization && <p className="text-red-500 text-xs mb-2">{errors.organization}</p>}

                  <input
                    type="email"
                    placeholder="Your Email *"
                    className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="text-red-500 text-xs mb-2">{errors.email}</p>}

                  <div className="relative w-full">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Your Password *"
                      className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white pr-10"
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
                  
                  {/* Uncomment if you need confirmation password field */}
                  {/* <div className="relative w-full">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Confirm Your Password *"
                      className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {errors.confirmPassword && <p className="text-red-500 text-xs mb-2">{errors.confirmPassword}</p>} */}
                  
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={agreeToTerms}
                      onChange={() => setAgreeToTerms(!agreeToTerms)}
                    />
                    <p className="text-sm">
                      Agree to our{" "}
                      <a
                        href="pdf/Peak T&Cs.pdf"
                        target="_blank"
                        className="text-[#E88A17] underline"
                      >
                        terms & conditions
                      </a>
                      ?
                    </p>
                  </div>
                  {errors.agreeToTerms && <p className="text-red-500 text-xs mb-4">{errors.agreeToTerms}</p>}
                  
                  <button
                    className="bg-[#001F3D] w-full p-2 text-white text-lg rounded-md"
                    onClick={handleSignup}
                  >
                    {isLoading ? "Please wait..." : "Sign-Up"}
                  </button>

                  <p className="text-sm text-center mt-4">
                    Already have an account?{" "}
                    <span
                      className="text-[#E88A17] cursor-pointer"
                      onClick={handleLoginClick}
                    >
                      Login
                    </span>
                  </p>

                  <div className="flex justify-center items-center mt-4 relative">
                    <span className="line w-1/3 border-t border-gray-300"></span>
                    <span className="mx-2">Or</span>
                    <span className="line w-1/3 border-t border-gray-300"></span>
                  </div>

                  <div className="flex justify-center mt-4">
                    <GoogleButton
                      type="dark"
                      label="Google"
                      onClick={() => {
                        console.log("Google button clicked");
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
export default SignUp;