"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@mui/material";
import { sendReward } from "@/app/api/actions/reward/reward";
import axios, { AxiosResponse } from "axios";
import Confetti from "react-confetti";
import { Edit2 } from "lucide-react";

const Rewards = () => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  // Customizable fields
  const [headerText, setHeaderText] = useState("Happy Birthday");
  const [headerColor, setHeaderColor] = useState("#90c73e");
  const [bottomColor, setBottomColor] = useState("#1a365d");
  const [titleText, setTitleText] = useState("Welcome to the Rewards Program");
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { v4: uuidv4 } = require("uuid");


  // Load persisted values from localStorage on component mount
  useEffect(() => {
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
      request_id: uuidv4(),
      bundle_amount: "20",
      msisdn: number,
      sender_id: 1,
      message: "Enjoy your free 1GB data from PEAKMOBILE!",
      postpay: true,
    };

    try {
      const response = await sendReward({
        org_id: localStorage.getItem("selectedAccountId"),
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
          alert("Insufficient units. Please top up to proceed.");
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

  // Editing/saving text & colors to localStorage
  const updateTitleText = () => {
    const newText = prompt("Edit Title Text:", titleText) || titleText;
    setTitleText(newText);
    localStorage.setItem("titleText", newText);
  };

  const updateHeaderText = () => {
    const newText = prompt("Edit Header Text:", headerText) || headerText;
    setHeaderText(newText);
    localStorage.setItem("headerText", newText);
  };

  const updateHeaderColor = (newColor: string) => {
    setHeaderColor(newColor);
    localStorage.setItem("headerColor", newColor);
  };

  const updateBottomColor = (newColor: string) => {
    setBottomColor(newColor);
    localStorage.setItem("bottomColor", newColor);
  };

  // Handle logo image upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result as string;
        setLogoImage(base64Image);
        localStorage.setItem("logoImage", base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  // ---- NEW: Build the shareable link with query parameters
  const buildShareLink = () => {
    const baseUrl = `${window.location.origin}/apps/data/userRewards`;
    const orgId = localStorage.getItem("selectedAccountId") || "";

    // Build query params from current state
    const params = new URLSearchParams({
      orgId,
      titleText,
      headerText,
      headerColor,
      bottomColor,
      // Omit the logo from the URL so we don't explode the length
    });

    return `${baseUrl}?${params.toString()}`;
  };


  // ---- NEW: Copy link to clipboard
  const handleCopyLink = () => {
    const shareLink = buildShareLink();
    navigator.clipboard.writeText(shareLink).then(
      () => {
        alert("Link copied to clipboard!");
      },
      (err) => {
        console.error("Failed to copy link:", err);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} />
      )}

      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1
          className="text-3xl font-semibold text-gray-700 cursor-pointer"
          onClick={updateTitleText}
        >
          {titleText}
        </h1>
      </div>

      <Card className="w-full max-w-md overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="relative">
            <div className="rounded-t-3xl overflow-hidden">
              {/* Green Header */}
              <div
                className="flex flex-col items-center pt-8 pb-4 relative"
                style={{ backgroundColor: headerColor }}
              >
                <h1
                  className="text-white text-2xl font-semibold cursor-pointer"
                  onClick={updateHeaderText}
                >
                  {headerText}
                </h1>
                {/* Edit Header Color Icon */}
                <div className="absolute top-2 right-2">
                  <label className="flex items-center cursor-pointer">
                    <Edit2 size={16} className="mr-1 text-white" />
                    <input
                      type="color"
                      value={headerColor}
                      onChange={(e) => updateHeaderColor(e.target.value)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="relative w-24 h-24 rounded-full bg-[#1a365d] border-4 border-white shadow-lg flex items-center justify-center mt-4">
                  {logoImage ? (
                    <img
                      src={logoImage}
                      alt="Logo"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-xl font-bold">KCB</div>
                  )}
                  {/* Logo Upload */}
                  <label className="absolute bottom-2 right-2 cursor-pointer">
                    <Edit2 size={16} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {/* Blue Section */}
              <div
                className="text-center px-6 py-8 rounded-b-3xl relative"
                style={{ backgroundColor: bottomColor }}
              >
                {/* Edit Bottom Color Icon */}
                <div className="absolute top-2 right-2">
                  <label className="flex items-center cursor-pointer">
                    <Edit2 size={16} className="mr-1 text-white" />
                    <input
                      type="color"
                      value={bottomColor}
                      onChange={(e) => updateBottomColor(e.target.value)}
                      className="hidden"
                    />
                  </label>
                </div>
                {!success ? (
                  <>
                    <h2 className="text-white text-lg mb-4">
                      Claim your Special 1GB Free Data
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
                          style={{ backgroundColor: headerColor }}
                          className="w-full text-white py-3 px-6 rounded-xl text-lg font-semibold hover:opacity-90 transition-colors"
                        >
                          Submit
                        </button>
                      </form>
                    )}
                    <div className="mt-6 text-gray-300 text-sm">
                      <span className="mr-4">Terms & Conditions</span>
                      <span>How to Use</span>
                    </div>

                    {/* NEW: Copy Link Button */}
                    <div className="mt-4">
                      <button
                        onClick={handleCopyLink}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md"
                      >
                        Copy Customization Link
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <h2 className="text-white text-lg mb-4">
                      Congratulations!
                    </h2>
                    <p className="text-white mb-8">
                      Thank you for being our loyal customer. Enjoy your free 1GB data reward!
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

export default Rewards;
