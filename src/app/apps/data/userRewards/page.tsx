"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@mui/material";
import { sendReward } from "@/app/api/actions/reward/reward";
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

  // Shared data from localStorage
  const [titleText, setTitleText] = useState("Celebrate valentines day with BuuPass!");
  const [headerText, setHeaderText] = useState("Happy Valentines");
  const [headerColor, setHeaderColor] = useState("#eb344f");
  const [bottomColor, setBottomColor] = useState("#eb8934");
  const [logoImage, setLogoImage] = useState<string | null>(null);

  // Default org_id
  const defaultOrgId = "734f4299-106c-4ced-92b8-ac0bbb501a32";
  const [orgId, setOrgId] = useState(defaultOrgId);

  // Load org_id and shared data on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem("selectedAccountId");
    setOrgId(savedOrgId || defaultOrgId);

    const savedTitleText = localStorage.getItem("titleText");
    const savedHeaderText = localStorage.getItem("headerText");
    const savedHeaderColor = localStorage.getItem("headerColor");
    const savedBottomColor = localStorage.getItem("bottomColor");
    const savedLogoImage = localStorage.getItem("logoImage");

    if (savedTitleText) setTitleText(savedTitleText);
    if (savedHeaderText) setHeaderText(savedHeaderText);
    if (savedHeaderColor) setHeaderColor(savedHeaderColor);
    if (savedBottomColor) setBottomColor(savedBottomColor);
    if (savedLogoImage) setLogoImage(savedLogoImage);
  }, []);

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

  // Stop confetti after a few seconds
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
      request_id: "user-request-" + Date.now(),
      bundle_amount: "20",
      msisdn: number,
      sender_id: 1,
      message: "Enjoy your free 1GB data from PEAKMOBILE!",
      postpay: true,
    };

    try {
      const response = await sendReward({
        org_id: orgId, // Use orgId (from localStorage or default)
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} />
      )}

      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{titleText}</h1>
      </div>

      <Card className="w-full max-w-md overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="relative">
            <div className="rounded-t-3xl overflow-hidden">
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
                    <div className="text-white text-xl font-bold">BuuPass</div>
                  )}
                </div>
              </div>
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
                        style={{ backgroundColor: headerColor }} // Use headerColor
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
                          className="w-full text-black placeholder-black/90 py-3 px-6 rounded-xl text-lg"
                        />
                        <input
                          type="tel"
                          placeholder="Enter Mobile Number"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="w-full text-black placeholder-black/90 py-3 px-6 rounded-xl text-lg"
                        />
                        <button
                          type="submit"
                          style={{ backgroundColor: headerColor }} // Use headerColor
                          className="w-full text-white py-3 px-6 rounded-xl text-lg font-semibold hover:opacity-90 transition-colors"
                        >
                          Submit
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div>
                    <h2 className="text-white text-lg mb-4">Congratulations!</h2>
                    <p className="text-white mb-8">
                      Thank you for being our loyal customer. Enjoy your free 1GB
                      data reward!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRewards;
