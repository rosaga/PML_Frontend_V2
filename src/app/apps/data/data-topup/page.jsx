"use client";

import React, { useState, useEffect } from "react";

const DataUnitsTopupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bundleSize, setBundleSize] = useState("20MB");
  const [units, setUnits] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("");
  
  const [cart, setCart] = useState([]);
  
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const ratePerMB = 0.20;

  useEffect(() => {
    let calculatedCost = 0;
  
    cart.forEach(item => {
      const mbValue = parseInt(item.bundleSize);
      calculatedCost += ratePerMB * mbValue * item.units;
    });
  
    const currentMB = parseInt(bundleSize);
    if (!isNaN(currentMB) && units > 0) {
      calculatedCost += ratePerMB * currentMB * units;
    }
  
    setTotalCost(calculatedCost);
  }, [cart, bundleSize, units]);
  


  const addBundle = () => {
    const newItem = {
      id: Date.now(), 
      bundleSize,
      units,
    };
    
    setCart([...cart, newItem]);
    
    setBundleSize("");
    setUnits(0);
  };
  
  const removeBundle = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const goToDashboard = () => {

    alert("Redirecting to dashboard...");

  };
  
  const handlePayment = () => {
  
    setPaymentSuccess(true);
  };
  
  const handleTopUpAgain = () => {
    setPaymentSuccess(false);
    setCurrentStep(1);
    setCart([]);
    setPhoneNumber("+254");
  };
  
  const handleExit = () => {
    alert("Redirecting to dashboard...");

  };

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-center text-3xl font-semibold mb-12">
          Top up your Data Units in 3 Easy Steps
        </h1>
        
        {/* Steps Navigation */}
        <div className="flex items-center justify-center mb-12">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-gray-500">
              1
            </div>
            <span className="ml-3 mr-5 text-gray-700">Select A Package</span>
            <span className="mx-3 text-gray-400">&#10095;</span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-gray-500">
              2
            </div>
            <span className="ml-3 mr-5 text-gray-700">Customize Order</span>
            <span className="mx-3 text-gray-400">&#10095;</span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-orange-400">
              3
            </div>
            <span className="ml-3 text-gray-700">Review & Pay</span>
          </div>
        </div>
        
        {/* Success Message Container */}
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          {/* Success Content */}
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <svg 
                className="w-20 h-20 text-white"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Payment Successful!
            </h2>
            
            <p className="text-center text-gray-600 mb-2">
              Your Payment has been confirmed
            </p>
            <p className="text-center text-gray-600 mb-12">
              Your Units Top Up is Underway. Please confirm within 5 Minutes
            </p>
            
            <hr className="w-full my-6" />
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={handleTopUpAgain}
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
              >
                Top Up Again
              </button>
              <button
                onClick={handleExit}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-center text-3xl font-semibold mb-12">
        Top up your Data Units in 3 Easy Steps
      </h1>

      {/* Steps Navigation - Updated to look like image */}
      {!showGrowthForm && (
        <div className="flex items-center justify-center mb-12">
          {/* Step 1 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                currentStep >= 1 ? "bg-gray-500" : "bg-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-3 mr-5 text-gray-700">Select A Package</span>
            <span className="mx-3 text-gray-400">&#10095;</span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                currentStep >= 2 ? "bg-gray-500" : "bg-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-3 mr-5 text-gray-700">Customize Order</span>
            <span className="mx-3 text-gray-400">&#10095;</span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                currentStep === 3 ? "bg-orange-400" : "bg-gray-300"
              }`}
            >
              3
            </div>
            <span className="ml-3 text-gray-700">Review & Pay</span>
          </div>
        </div>
      )}

      {/* Conditional Rendering of Sections */}
      {currentStep === 1 && !showGrowthForm && (
        // Packages Section (Select A Package)
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trial Package */}
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <img
              src="/images/freetrial.png"
              alt="Piggy Bank"
              className="mb-6"
            />

            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              TRIAL PACKAGE
            </h2>
            <div className="text-sm text-gray-600 mb-8 text-center">
              Run your first test reward for Free
            </div>
            <p className="text-gray-500 mb-4">Rate per MB: 0.00</p>

            <div className="text-4xl font-bold text-orange-400 mb-6">
              Free
            </div>

           
            <div className="text-sm text-gray-600 mb-2">
              10 Free units of 20MB
            </div>
            <div className="text-sm text-gray-600 mb-8">10 Free SMS</div>

            <button className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
                onClick={goToDashboard}>
              Request Now
            </button>
          </div>

          {/* Starter Package */}
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <img
              src="/images/starterpackage.png"
              alt="Rocket"
              className="mb-6"
            />

            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              STARTER PACKAGE
            </h2>
            <div className="text-sm text-gray-600 mb-8 text-center">
              For small businesses just getting started with Rewards
            </div>
            <p className="text-gray-500 mb-4">Rate per MB: 0.20</p>

            <div className="flex items-baseline mb-6">
              <span className="text-gray-400 text-sm mr-2">From Ksh</span>
              <span className="text-4xl font-bold text-orange-400">10,000</span>
            </div>


            <div className="text-sm text-gray-600 mb-2 text-center">
              Disburse Data via Self Service Platform or API
            </div>
            <div className="text-sm text-gray-600 mb-2">500 Free SMS</div>
       

            <button className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
                onClick={() => {

                  setCurrentStep(2);
                }}>
              Top up Now
            </button>
          </div>

          {/* Growth Package */}
          <div className="border rounded-lg p-6 flex flex-col items-center relative">
            <div className="absolute right-2 top-2 bg-gray-800 text-white text-xs py-1 px-3 rounded">
              Popular
            </div>

            <img
              src="/images/growth.png"
              alt="Safe with coins"
              className="mb-6"
            />

            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              GROWTH PACKAGE
            </h2>
            <div className="mb-8 w-full text-center">
            <p className="text-sm text-gray-600">
              For growing businesses looking to increase customer loyalty
            </p>
          </div>
            <p className="text-gray-500 mb-4">Rate per MB: Custom</p>

            <div className="flex items-baseline mb-6">
              <span className="text-gray-400 text-sm mr-2">From Ksh</span>
              <span className="text-4xl font-bold text-orange-400">
                100,000
              </span>
            </div>

            <div className="w-full mb-2">
              <div className="flex mb-2">
                <div className="text-sm text-gray-600 text-center">
                  Disburse Data via Self Service Platform or API
                </div>
              </div>

              <div className="text-sm text-gray-600 text-center">2000 Free SMS</div>


            </div>

            <button className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
                onClick={() => setShowGrowthForm(true)}>
              Talk to Sales
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && !showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          {/* Header with Cost and Add Bundle at the same level */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              Request Data Units
            </h2>
            <div className="flex items-center">
              <div className="bg-gray-200 rounded py-2 px-4 mr-4">
                Total Cost: Ksh {totalCost.toFixed(2)}
              </div>
              <button 
                onClick={addBundle}
                className="bg-orange-400 hover:bg-orange-500 text-white py-2 px-4 rounded">
                +Add Bundle
              </button>
            </div>
          </div>
          
          <p className="text-gray-500 mb-2">Please note:</p>
          <p className="text-gray-500 mb-1">
            The minimum amount to top up is Ksh 10,000
          </p>
          <p className="text-gray-500 mb-6">
            The maximum amount to top up is Ksh 250,000
          </p>

          {/* Cart Items Display */}
          {cart.length > 0 && (
            <div className="mb-6">
              {cart.map(item => (
                <div key={item.id} className="bg-green-100 rounded-md p-4 mb-2 flex justify-between items-center">
                  <span>{item.units} units of {item.bundleSize}</span>
                  <button 
                    onClick={() => removeBundle(item.id)}
                    className="text-red-500 font-bold text-xl">
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          <hr className="my-6" />

          {/* Bundle Amount Field */}
          <div className="mb-6">
            <label className="block text-gray-600 mb-2">
              Bundle Amount
            </label>
            <div className="relative">
              <select
                value={bundleSize}
                onChange={(e) => setBundleSize(e.target.value)}
                className="block appearance-none w-full bg-white border border-gray-300 rounded py-3 px-4 pr-8 leading-tight focus:outline-none focus:border-orange-400">
                <option>20MB</option>
                <option>50MB</option>
                <option>100MB</option>
                <option>200MB</option>
                <option>500MB</option>
                <option>1000MB</option>
                <option>5000MB</option>
                <option>10000MB</option>



              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Number of Units Field */}
          <div className="mb-6">
            <label className="block text-gray-600 mb-2">
              Number of Units
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value) || 1)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400"
              placeholder="1"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded w-48">
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-48"
              disabled={totalCost < 10000 || totalCost > 250000}>
              Proceed
            </button>
          </div>
        </div>
      )}


      {/* Review & Pay section that matches the image */}
      {currentStep === 3 && !showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Order Summary
          </h2>
          
          <p className="text-gray-600 mb-2">
            Please confirm your order details before checkout.
          </p>
          <p className="text-gray-600 mb-6">
            Enter your mobile number to receive a payment prompt on your phone and complete the transaction.
          </p>
          
          {/* Order Summary Card */}
          <div className="border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Starter Package
            </h3>
            
            <h4 className="text-gray-600 mb-3">Unit Details</h4>
            
            <div className="flex items-start mb-4">
              <img 
                src="/images/starterpackage.png" 
                alt="Piggy bank" 
                className="mr-6"
              />
              <div className="flex-grow">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between mb-3">
                    <span>{item.units} x {item.bundleSize}s</span>
                    <span>{(ratePerMB * parseInt(item.bundleSize) * item.units).toFixed(0)}</span>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-3 font-bold flex justify-between text-orange-500">
                  <span>Total</span>
                  <span>Ksh {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Phone Number Input */}
          <div className="mb-8">
            <label className="block text-gray-600 mb-2">
              Enter Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400"
              placeholder="+254"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
            >
              Pay
            </button>
          </div>
        </div>
      )}

      {/* Growth Package Form */}
      {showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Request Data Units: Growth Package
          </h2>
          <p className="text-gray-500 mb-6">
            Unlock Special Pricing From Ksh 100,000
          </p>
          
          <div className="mb-6">
            <label className="block text-gray-600 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400"
              placeholder="ICT"
            />
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-600 mb-2">
              What is your primary use case?
            </label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400 h-32"
              placeholder="Describe here"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowGrowthForm(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
            >
              Back
            </button>
            <button
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUnitsTopupPage;