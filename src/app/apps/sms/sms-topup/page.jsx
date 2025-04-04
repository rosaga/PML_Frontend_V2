"use client";
import React, { useState } from "react";

const SMSPricing = () => {
  const [activeTab, setActiveTab] = useState("packages");
  const [smsUnits, setSmsUnits] = useState(1);
  const [rate, setRate] = useState(0.8);
  const [cost, setCost] = useState(0);

  const pricingPackages = [
    {
      id: 1,
      range: "1-19,999 SMS",
      price: "0.8 ksh per SMS",
      buttonText: "Select Package",
      buttonAction: "select",
      rate: 0.8
    },
    {
      id: 2,
      range: "20,000-99,999 SMS",
      price: "0.7 ksh per SMS",
      buttonText: "Select Package",
      buttonAction: "select",
      rate: 0.7
    },
    {
      id: 3,
      range: "100,001-399,999 SMS",
      price: "0.5 Ksh per SMS",
      buttonText: "Select Package",
      buttonAction: "select",
      rate: 0.5
    },
    {
      id: 4,
      range: "400,000+ SMS",
      price: "0.4 Ksh per SMS",
      buttonText: "Contact Sales",
      buttonAction: "contact",
      rate: 0.4
    }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleButtonClick = (action, packageId) => {
    if (action === "select") {
      console.log(`Selected package ID: ${packageId}`);
      const selectedPackage = pricingPackages.find(pkg => pkg.id === packageId);
      if (selectedPackage) {
        setRate(selectedPackage.rate);
        handleTabChange("custom"); 
      }
    } else if (action === "contact") {
      console.log("Contact sales button clicked");
    }
  };

  const handleSmsUnitsChange = (e) => {
    const units = parseInt(e.target.value) || 0;
    setSmsUnits(units);
    setCost(units * rate);
  };

  const handleChangePlan = () => {
    console.log("Changing plan");
    handleTabChange("packages");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-medium text-gray-700 mb-6">SMS Pricing</h2>

      {/* Tabs - Centered */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex">
          <button
            className={`px-6 py-2 rounded-full ${
              activeTab === "packages"
                ? "bg-orange-400 text-white"
                : "bg-white text-gray-700"
            } font-medium transition-colors duration-200`}
            onClick={() => handleTabChange("packages")}
          >
            Packages
          </button>
          <button
            className={`px-6 py-2 rounded-full ml-4 ${
              activeTab === "custom"
                ? "bg-orange-400 text-white"
                : "bg-white text-gray-700"
            } font-medium transition-colors duration-200`}
            onClick={() => handleTabChange("custom")}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Packages Tab Content */}
      {activeTab === "packages" && (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{marginLeft:'100px'}}>
            {pricingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col items-center"
              >
                {/* Paper Plane Icon */}
                <div className="mb-4 text-orange-400">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13"></path>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                  </svg>
                </div>

                {/* Package Details*/}
                <h3 className="text-base font-medium text-gray-700 mb-1 text-center">{pkg.range}</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">{pkg.price}</p>

                {/* Action Button */}
                <button
                  className={`w-full py-2 text-sm rounded-md ${
                    pkg.buttonAction === "select"
                      ? "bg-orange-100 text-[#F58426]"
                      : "bg-orange-100 text-[#F58426]"
                  } font-medium hover:opacity-90 transition-opacity`}
                  onClick={() => handleButtonClick(pkg.buttonAction, pkg.id)}
                >
                  {pkg.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tab Content */}
      {activeTab === "custom" && (
        <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-medium text-gray-700">Request SMS Package</h3>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <div className="bg-gray-200 px-4 py-2 rounded-md">
                <span className="text-gray-700">Rate: {rate} Per SMS</span>
              </div>
              <button 
                className="bg-orange-100 text-orange-500 px-4 py-2 rounded-md hover:bg-orange-200 transition-colors"
                onClick={handleChangePlan}
              >
                Change Plan
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Number of SMS Units</label>
              <input
                type="number"
                value={smsUnits}
                onChange={handleSmsUnitsChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="Enter number of SMS units"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">SMS Cost</label>
              <input
                type="text"
                value={cost.toFixed(2)}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button className="w-1/2 bg-gray-900 text-white py-3 rounded-md hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button className="w-1/2 bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors">
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSPricing;