"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@mui/material";
import { sendBrandReward } from "@/app/api/actions/reward/reward";
import axios, { AxiosResponse } from "axios";
import Confetti from "react-confetti";
import { useSearchParams } from "next/navigation";

const UserRewards = () => {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { v4: uuidv4 } = require('uuid');

  // Default/initial states
  const [titleText, setTitleText] = useState("Title Text!");
  const [headerText, setHeaderText] = useState("Header Text");
  const [headerColor, setHeaderColor] = useState("#f58426");
  const [bottomColor, setBottomColor] = useState("#001f3c");
  const [logoImage, setLogoImage] = useState<string | null>(null);
  
  const defaultOrgId = "39d5582f-cc7b-45f0-8f4c-5cec79e5f3cd";
  const [orgId, setOrgId] = useState(defaultOrgId);

  // Parse query params on mount
  useEffect(() => {
    const qOrgId = searchParams.get("orgId");
    const qTitleText = searchParams.get("titleText");
    const qHeaderText = searchParams.get("headerText");
    const qHeaderColor = searchParams.get("headerColor");
    const qBottomColor = searchParams.get("bottomColor");
    const qLogoImage = searchParams.get("logoImage");

    if (qOrgId) setOrgId(qOrgId);
    if (qTitleText) setTitleText(qTitleText);
    if (qHeaderText) setHeaderText(qHeaderText);
    if (qHeaderColor) setHeaderColor(qHeaderColor);
    if (qBottomColor) setBottomColor(qBottomColor);
    if (qLogoImage) setLogoImage(qLogoImage);
  }, [searchParams]);

  // Track window size for Confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateSize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleRedeemClick = () => {
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number) {
      alert("Please enter a valid mobile number.");
      return;
    }

    const rewardPayload = {
      request_id: uuidv4(),
      bundle_amount: "20",
      msisdn: number,
      sender_id: 1,
      message: "Enjoy your free 1GB data from PEAKMOBILE!",
      postpay: true,
    };

    try {
      const response = await sendBrandReward({
        org_id: orgId,
        newReward: rewardPayload,
      });

      if (response && (response as AxiosResponse).status === 200) {
        setSuccess(true);
        setName("");
        setNumber("");
      } else {
        throw new Error("Failed to send reward.");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          alert("Insufficient units. Please try again later.");
        } else {
          alert(
            `Failed to send reward: ${error.response?.data?.message || error.message}`
          );
        }
      } else if (error instanceof Error) {
        alert(`An unexpected error occurred: ${error.message}`);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen p-4"
      style={{
        backgroundImage: "url('/images/rewards-bg.png')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay to improve readability */}

      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} />
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-6">{titleText}</h1>

        <Card className="w-full max-w-md overflow-hidden rounded-3xl shadow-xl bg-white">
          <CardContent className="p-0">
            <div className="relative">
              {/* Header Section */}
              <div
                className="flex flex-col items-center pt-8 pb-4"
                style={{ backgroundColor: headerColor }}
              >
                <h1 className="text-white text-2xl font-semibold">
                  {headerText}
                </h1>
                <div className="relative w-24 h-24 rounded-full bg-[#1a365d] border-4 border-white shadow-lg flex items-center justify-center mt-4">
                  {logoImage ? (
                    <img
                      src={logoImage}
                      alt="Logo"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-xl font-bold">Logo</div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div
                className="text-center px-6 py-8 rounded-b-3xl"
                style={{ backgroundColor: bottomColor }}
              >
                {!success ? (
                  <>
                    <h2 className="text-white text-lg mb-4">
                      Claim your Special 1GB Free Data Gift
                    </h2>
                    {!showForm ? (
                      <button
                        onClick={handleRedeemClick}
                        style={{ backgroundColor: headerColor }}
                        className="text-white py-3 px-6 rounded-xl text-lg font-semibold hover:opacity-90 transition-colors"
                      >
                        Redeem Data
                      </button>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                          type="text"
                          placeholder="Enter Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-black placeholder-gray-500 py-3 px-6 rounded-xl text-lg"
                        />
                        <input
                          type="tel"
                          placeholder="Enter Mobile Number"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="w-full text-black placeholder-gray-500 py-3 px-6 rounded-xl text-lg"
                        />
                        <button
                          type="submit"
                          style={{ backgroundColor: headerColor }}
                          className="w-full text-white py-3 px-6 rounded-xl text-lg font-semibold hover:opacity-90 transition-colors"
                        >
                          Submit
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div>
                    <h2 className="text-white text-lg mb-4">
                      Congratulations!
                    </h2>
                    <p className="text-white mb-8">
                      Thank you for being our loyal customer. Enjoy your free 1GB
                      data reward!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserRewards;
