"use client";

import React, { useState } from "react";
import { initiateAirtimePayment, formatMSISDN } from "@/app/api/actions/payments/payments";

const AirtimeTopupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("");
  const [amountError, setAmountError] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [requestId, setRequestId] = useState("");

  const validateStarterAmount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || amount === "") {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numAmount < 1) {
      setAmountError("Minimum amount is KES 10,000");
      return false;
    }
    if (numAmount > 99000) {
      setAmountError("Maximum amount is KES 99,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  const validateGrowthAmount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || amount === "") {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numAmount < 10) {
      setAmountError("Minimum amount is KES 100,000");
      return false;
    }
    if (numAmount > 250000) {
      setAmountError("Maximum amount is KES 250,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleProceedFromAmount = () => {
    if (selectedPackage === "Starter") {
      if (validateStarterAmount(airtimeAmount)) {
        setTotalCost(parseInt(airtimeAmount));
        setCurrentStep(3);
      }
    } else if (selectedPackage === "Growth") {
      if (validateGrowthAmount(airtimeAmount)) {
        setTotalCost(parseInt(airtimeAmount));
        setCurrentStep(3);
      }
    }
  };

  const goToDashboard = () => {
    alert("Redirecting to dashboard...");
  };

  const isValidPhone = (phone) => {
    const msisdn = formatMSISDN(phone);
    return /^2547\d{8}$/.test(msisdn);
  };

  const handlePayment = async () => {
    setPaymentError("");

    if (!isValidPhone(phoneNumber)) {
      setPaymentError("Please enter a valid Kenyan mobile number (e.g. 0712345678).");
      return;
    }
    if (totalCost <= 0) {
      setPaymentError("Amount is invalid. Please review your amount.");
      return;
    }

    try {
      setIsPaying(true);
      setModalType("processing");
      setShowModal(true);

      const result = await initiateAirtimePayment(totalCost, phoneNumber);

      if (!result.success) {
        setPaymentError(result.errors?._error || "Payment initiation failed");
        setModalType("failure");
        setIsPaying(false);
        return;
      }

      const checkoutRequestId = result.payment?.request_id;
      setRequestId(checkoutRequestId);
      setPaymentError("");

      const maxAttempts = 30;
      let attempts = 0;

      const pollPaymentStatus = async () => {
        try {
          const statusResponse = await fetch(
            `https://loyalty-1048592730476.europe-west4.run.app/public/payment`
          );
          const data = await statusResponse.json();
          const payments = data.data || [];
          const payment = payments.find(p => p.request_id === checkoutRequestId);

          if (payment?.status === "SUCCESS") {
            setPaymentInfo(payment);
            setModalType("success");
            setIsPaying(false);
            return;
          }
          if (payment?.status === "FAILED") {
            throw new Error(payment.status_desc || "Payment failed");
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollPaymentStatus, 3000);
          } else {
            throw new Error("Payment timeout. Please check your M-Pesa messages.");
          }
        } catch (err) {
          setPaymentError(err.message ?? "Failed to verify payment status");
          setModalType("failure");
          setPaymentInfo(null);
          setIsPaying(false);
        }
      };

      setTimeout(pollPaymentStatus, 5000);

    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError(err?.message || "Payment failed.");
      setModalType("failure");
      setPaymentInfo(null);
      setIsPaying(false);
    }
  };

  const closeAllModals = () => {
    setShowModal(false);
    setModalType(null);
    setPaymentError("");
    setIsPaying(false);
    setPaymentInfo(null);
  };

  const handleTopUpAgain = () => {
    closeAllModals();
    setCurrentStep(1);
    setAirtimeAmount("");
    setSelectedPackage("");
    setTotalCost(0);
    setPhoneNumber("");
    setAmountError("");
    setRequestId("");
  };

  const handleExit = () => {
    alert("Redirecting to dashboard...");
  };

  const PaymentProcessingModal = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Processing Payment
        </h2>
        <p className="text-center text-gray-600 mb-4">
          An STK push has been sent to your phone.
        </p>
        <p className="text-center text-gray-600 mb-4">
          Please check your phone and enter your M-Pesa PIN to complete the transaction.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-orange-400 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Please wait while we process your payment...
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-center text-3xl font-semibold mb-12">
        Top up your Airtime in 3 Easy Steps
      </h1>

      {!showGrowthForm && (
        <div className="flex items-center justify-center mb-12">
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

          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                currentStep >= 2 ? "bg-gray-500" : "bg-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-3 mr-5 text-gray-700">Enter Amount</span>
            <span className="mx-3 text-gray-400">&#10095;</span>
          </div>

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

      {currentStep === 1 && !showGrowthForm && (
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
            <div className="text-sm text-gray-600 mb-2 text-center">
              Run your first test reward for Free
            </div>

            <div className="text-4xl font-bold text-orange-400 mb-6">
              Free
            </div>

            <div className="text-sm text-gray-600 mb-2">
              Free airtime of KES 1000
            </div>
            <div className="text-sm text-gray-600 mb-8">10 Free SMS</div>

            <button 
              className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
              onClick={goToDashboard}
            >
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
            <div className="text-sm text-gray-600 mb-2 text-center">
              For small businesses just getting started with Rewards
            </div>

            <div className="flex items-baseline mb-6">
              <span className="text-gray-400 text-sm mr-2">From Ksh</span>
              <span className="text-4xl font-bold text-orange-400">10,000</span>
            </div>

            <div className="text-sm text-gray-600 mb-2 text-center">
              Disburse Airtime via Self Service Platform or API
            </div>
            <div className="text-sm text-gray-600 mb-8">500 Free SMS</div>

            <button 
              className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
              onClick={() => {
                setSelectedPackage("Starter");
                setCurrentStep(2);
              }}
            >
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
            <div className="flex text-center mb-2">
              <div className="text-sm text-gray-600">
                For growing businesses looking to increase customer loyalty
              </div>
            </div>

            <div className="flex items-baseline mb-6">
              <span className="text-gray-400 text-sm mr-2">From Ksh</span>
              <span className="text-4xl font-bold text-orange-400">
                100,000
              </span>
            </div>

            <div className="w-full mb-2 text-center">
              <div className="flex text-center mb-2">
                <div className="text-sm text-gray-600 text-center">
                  Disburse Airtime via Self Service Platform or API
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-8">2000 Free SMS</div>
            </div>

            <button 
              className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
              onClick={() => {
                setSelectedPackage("Growth");
                setCurrentStep(2);
              }}
            >
              Top up Now
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && !showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Enter Airtime Amount
          </h2>
          
          <p className="text-gray-600 mb-6">
            {selectedPackage === "Starter" 
              ? "Enter the amount you want to top up (KES 10,000 - 99,000)"
              : "Enter the amount you want to top up (KES 100,000 - 250,000)"}
          </p>
          
          <div className="mb-6">
            <label className="block text-gray-600 mb-2 font-semibold">
              Amount (KES)
            </label>
            <input
              type="number"
              value={airtimeAmount}
              onChange={(e) => {
                setAirtimeAmount(e.target.value);
                setAmountError("");
              }}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 text-lg leading-tight focus:outline-none focus:border-orange-400"
              placeholder={selectedPackage === "Starter" ? "10000" : "100000"}
            />
            {amountError && (
              <p className="text-red-500 text-sm mt-2">{amountError}</p>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-1">
              <strong>Minimum:</strong> KES {selectedPackage === "Starter" ? "10,000" : "100,000"}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Maximum:</strong> KES {selectedPackage === "Starter" ? "99,000" : "250,000"}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedPackage("");
                setAirtimeAmount("");
                setAmountError("");
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
            >
              Back
            </button>
            <button
              onClick={handleProceedFromAmount}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && !showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Review & Payment
          </h2>
          
          <p className="text-gray-600 mb-6">
            Please confirm your order details and enter your phone number to complete payment.
          </p>
          
          <div className="border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {selectedPackage} Package
            </h3>
            
            <h4 className="text-gray-600 mb-3">Airtime Details</h4>
            
            <div className="flex items-start mb-4">
              <img 
                src={selectedPackage === "Starter" ? "/images/starterpackage.png" : "/images/growth.png"}
                alt="Package icon" 
                className="mr-6"
              />
              <div className="flex-grow">
                <div className="flex justify-between mb-3">
                  <span>Airtime Top-up</span>
                  <span>KES {totalCost.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-3 mt-3 font-bold flex justify-between text-orange-500">
                  <span>Total</span>
                  <span>KES {totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-600 mb-2 font-semibold">
              Enter Phone Number
            </label>
            <p className="text-gray-500 text-sm mb-2">
              You will receive a payment prompt on your phone to complete the transaction
            </p>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPaymentError("");
              }}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400"
              placeholder="0712345678"
              disabled={isPaying}
            />
            {paymentError && !showModal && (
              <p className="text-red-500 text-sm mt-2">{paymentError}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCurrentStep(2);
                setTotalCost(0);
                setPaymentError("");
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
              disabled={isPaying}
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isPaying}
            >
              {isPaying ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      )}

      {showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Request Airtime: Growth Package
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

      {/* Payment Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => !isPaying && closeAllModals()} />
          <div className="relative z-10 w-full max-w-xl bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-medium text-gray-800">
                  {modalType === "processing" && "Processing Payment"}
                  {modalType === "success" && "Payment Successful!"}
                  {modalType === "failure" && "Payment Failed"}
                </h3>
                {modalType === "processing" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Amount: <span className="font-medium">KES {totalCost.toLocaleString()}</span>
                  </p>
                )}
              </div>
              {modalType !== "processing" && (
                <button
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                  onClick={closeAllModals}
                  disabled={isPaying}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="pt-6">
              {modalType === "processing" && <PaymentProcessingModal />}

              {modalType === "success" && (
                <div className="space-y-6 text-center">
                  <div className="flex flex-col items-center justify-center">
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
                    <p className="text-center text-gray-600 mb-4">
                      Your payment has been confirmed.
                    </p>
                    <p className="text-center text-gray-600 mb-4">
                      Your Airtime Top Up of <span className="font-semibold">KES {totalCost.toLocaleString()}</span> is Underway.
                    </p>
                    <p className="text-center text-gray-600 mb-12">
                      Please confirm within 5 Minutes
                    </p>

                    {paymentInfo?.id && (
                      <p className="text-sm text-gray-500 mb-4">
                        Payment ID: <span className="font-mono">{paymentInfo.id}</span>
                      </p>
                    )}

                    <hr className="w-full my-6" />

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
              )}

              {modalType === "failure" && (
                <div className="space-y-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-6">
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                      Payment Failed
                    </h2>
                    <p className="text-center text-gray-600 mb-4">
                      Payment failed. Please check your mobile number and try again.
                    </p>
                    {paymentError && (
                      <p className="text-sm text-red-600 mb-8">{paymentError}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <button
                        className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
                        onClick={closeAllModals}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
                        onClick={() => {
                          closeAllModals();
                          setPaymentError("");
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirtimeTopupPage;