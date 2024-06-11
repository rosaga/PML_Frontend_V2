"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import "../../app/globals.css";

const Otp = () => {
  const router = useRouter();

  const [timer, setTimer] = useState(60); // Initial timer value in seconds

  useEffect(() => {
    // Decrease timer every second
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    // Redirect to login page when timer reaches zero
    if (timer === 0) {
      router.push("/apps/1/dashboard");
    }

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [timer, router]);

  return (
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
        {" "}
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
                  <p className="text-md font-light">siderravictor@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <form class="max-w-sm mx-auto">
                  <div class="flex mb-2 space-x-2 rtl:space-x-reverse">
                    <div>
                      <label for="code-1" class="sr-only">
                        First code
                      </label>
                      <input
                        type="text"
                        maxLength="1"
                        data-focus-input-init
                        data-focus-input-next="code-2"
                        id="code-1"
                        class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label for="code-2" class="sr-only">
                        Second code
                      </label>
                      <input
                        type="text"
                        maxLength="1"
                        data-focus-input-init
                        data-focus-input-prev="code-1"
                        data-focus-input-next="code-3"
                        id="code-2"
                        class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label for="code-3" class="sr-only">
                        Third code
                      </label>
                      <input
                        type="text"
                        maxLength="1"
                        data-focus-input-init
                        data-focus-input-prev="code-2"
                        data-focus-input-next="code-4"
                        id="code-3"
                        class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label for="code-4" class="sr-only">
                        Fourth code
                      </label>
                      <input
                        type="text"
                        maxLength="1"
                        data-focus-input-init
                        data-focus-input-prev="code-3"
                        data-focus-input-next="code-5"
                        id="code-4"
                        class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>
              <p className="flex text-sm font-md justify-center mt-4">
                Timeout <span className="text-[#E88A17] ml-2"> {timer}</span>
              </p>

              <p className="flex text-sm font-md justify-center mt-4">
                Did not Receive the Code?{" "}
                <span className="text-[#E88A17] ml-2"> Resend Code</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Otp;
