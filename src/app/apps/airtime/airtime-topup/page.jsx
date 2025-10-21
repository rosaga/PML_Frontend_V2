"use client";

import React, { useState } from "react";
import { initiateAirtimePayment, formatMSISDN, pollPaymentStatus } from "@/app/api/actions/payments/payments";

const AirtimeTopupPage = () => {

    const org_id =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedAccountId")
      : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
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

  const calculateDiscount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount)) return { discount: 0, percentage: 0, total: 0 };

    let percentage = 0;
    if (numAmount >= 1 && numAmount <= 10) {
      percentage = 3;
    } else if (numAmount >= 11 && numAmount <= 25) {
      percentage = 4;
    } else if (numAmount >= 25) {
      percentage = 5;
    }

    const discountAmount = (numAmount * percentage) / 100;
    const totalAmount = numAmount - discountAmount;

    return {
      discount: discountAmount,
      percentage: percentage,
      total: totalAmount
    };
  };

  const validateStarterAmount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || amount === "") {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numAmount < 1) {
      setAmountError("Minimum amount is KES 1");
      return false;
    }
    if (numAmount > 10) {
      setAmountError("Maximum amount is KES 10");
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
    if (numAmount < 11) {
      setAmountError("Minimum amount is KES 11");
      return false;
    }
    if (numAmount > 25) {
      setAmountError("Maximum amount is KES 25");
      return false;
    }
    setAmountError("");
    return true;
  };

  const validateEnterpriseAmount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || amount === "") {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numAmount < 251000) {
      setAmountError("Minimum amount is KES 251,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleProceedFromAmount = () => {
    let isValid = false;
    
    if (selectedPackage === "Starter") {
      isValid = validateStarterAmount(airtimeAmount);
    } else if (selectedPackage === "Growth") {
      isValid = validateGrowthAmount(airtimeAmount);
    } else if (selectedPackage === "Enterprise") {
      isValid = validateEnterpriseAmount(airtimeAmount);
    }

    if (isValid) {
      const { discount: discountAmount, percentage, total } = calculateDiscount(airtimeAmount);
      setDiscount(discountAmount);
      setDiscountPercentage(percentage);
      setTotalCost(total);
      setCurrentStep(3);
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

  const msisdn = formatMSISDN(phoneNumber);
  if (!/^2547\d{8}$/.test(msisdn)) {
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

    const result = await initiateAirtimePayment(org_id, totalCost, phoneNumber);
    if (!result.success) {
      setPaymentError(result.errors?._error || "Payment initiation failed");
      setModalType("failure");
      setIsPaying(false);
      return;
    }

    const checkoutRequestId = result.payment?.request_id;
    setRequestId(checkoutRequestId);

    const pollRes = await pollPaymentStatus(org_id, checkoutRequestId, 30, 3000);
    if (pollRes.success && pollRes.data?.status === "SUCCESS") {
      setPaymentInfo(pollRes.data);
      setModalType("success");
    } else {
      setPaymentError(pollRes.errors?._error || "Payment failed");
      setModalType("failure");
      setPaymentInfo(null);
    }
  } catch (err) {
    setPaymentError(err?.message || "Payment failed.");
    setModalType("failure");
    setPaymentInfo(null);
  } finally {
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
    setDiscount(0);
    setDiscountPercentage(0);
    setPhoneNumber("");
    setAmountError("");
    setRequestId("");
    setShowGrowthForm(false);
  };

  const handleExit = () => {
    closeAllModals();
  };

  const handleEnterpriseSubmit = () => {
    alert("Enterprise request submitted! Our team will contact you shortly.");
    setShowGrowthForm(false);
    setCurrentStep(1);
    setIndustry("");
    setUseCase("");
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
  <div className="mx-auto max-w-6xl px-4">
    {/* Responsive 1→2→3 column grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {/* Starter Package */}
      <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center gap-5 w-full min-h-[30rem]">
        <h2 className="text-lg font-semibold text-gray-800 text-center tracking-wide">
          STARTER PACKAGE
        </h2>

        <div className="text-orange-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>

        <p className="text-sm text-gray-600 text-center px-2 leading-relaxed">
          For small businesses just getting started with Rewards
        </p>

        <div className="text-center leading-relaxed">
          <p className="text-sm text-gray-500">From Ksh</p>
          <h3 className="text-3xl font-bold text-orange-400">1,000</h3>
          <p className="text-sm text-green-600 font-semibold mt-1">3% Discount</p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Disburse Airtime via Self Service Platform or API
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">500 Free SMS</p>
        </div>

        <button
          className="w-full py-2 text-sm rounded-md bg-orange-100 text-[#F58426] font-medium hover:opacity-90 transition-opacity mt-auto"
          onClick={() => {
            setSelectedPackage("Starter");
            setCurrentStep(2);
          }}
        >
          Top up Now
        </button>
      </div>

      {/* Growth Package */}
      <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center gap-5 w-full min-h-[30rem]">
        <h2 className="text-lg font-semibold text-gray-800 text-center tracking-wide">
          GROWTH PACKAGE
        </h2>

        <div className="text-orange-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>

        <p className="text-sm text-gray-600 text-center px-2 leading-relaxed">
          For growing businesses looking to increase customer loyalty
        </p>

        <div className="text-center leading-relaxed">
          <p className="text-sm text-gray-500">From Ksh</p>
          <h3 className="text-3xl font-bold text-orange-400">101,000</h3>
          <p className="text-sm text-green-600 font-semibold mt-1">4% Discount</p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Disburse Airtime via Self Service Platform or API
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">2,000 Free SMS</p>
        </div>

        <button
          className="w-full py-2 text-sm rounded-md bg-orange-100 text-[#F58426] font-medium hover:opacity-90 transition-opacity mt-auto"
          onClick={() => {
            setSelectedPackage("Growth");
            setCurrentStep(2);
          }}
        >
          Top up Now
        </button>
      </div>

      {/* Enterprise Package */}
      <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center gap-5 w-full min-h-[30rem]">
        <h2 className="text-lg font-semibold text-gray-800 text-center tracking-wide">
          ENTERPRISE PACKAGE
        </h2>

        <div className="text-orange-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>

        <p className="text-sm text-gray-600 text-center px-2 leading-relaxed">
          For large organizations with high-volume reward needs
        </p>

        <div className="text-center leading-relaxed">
          <p className="text-sm text-gray-500">From Ksh</p>
          <h3 className="text-3xl font-bold text-orange-400">251,000</h3>
          <p className="text-sm text-green-600 font-semibold mt-1">5% Discount</p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Custom solutions and dedicated support
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">5,000 Free SMS</p>
        </div>

        <button
          className="w-full py-2 text-sm rounded-md bg-orange-100 text-[#F58426] font-medium hover:opacity-90 transition-opacity mt-auto"
          onClick={() => {
            setSelectedPackage("Enterprise");
            setShowGrowthForm(true);
          }}
        >
          Request Quote
        </button>
      </div>
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
              ? "Enter the amount you want to top up (KES 1,000 - 100,000) - 3% discount applied"
              : "Enter the amount you want to top up (KES 101,000 - 250,000) - 4% discount applied"}
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
              placeholder={selectedPackage === "Starter" ? "1000" : "101000"}
            />
            {amountError && (
              <p className="text-red-500 text-sm mt-2">{amountError}</p>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-1">
              <strong>Minimum:</strong> KES {selectedPackage === "Starter" ? "1,000" : "101,000"}
            </p>
            <p className="text-gray-600 text-sm mb-1">
              <strong>Maximum:</strong> KES {selectedPackage === "Starter" ? "100,000" : "250,000"}
            </p>
            <p className="text-green-600 text-sm font-semibold">
              <strong>Discount:</strong> {selectedPackage === "Starter" ? "3%" : "4%"}
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
              <div className="text-orange-400 mr-6">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between mb-3">
                  <span>Airtime Top-up</span>
                  <span>KES {parseInt(airtimeAmount).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between mb-3 text-green-600">
                  <span>Discount ({discountPercentage}%)</span>
                  <span>- KES {discount.toLocaleString()}</span>
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
                setDiscount(0);
                setDiscountPercentage(0);
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
            Request Airtime: Enterprise Package
          </h2>
          <p className="text-gray-500 mb-6">
            Get 5% Discount From Ksh 251,000+
          </p>
          
          <div className="mb-6">
            <label className="block text-gray-600 mb-2 font-semibold">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400"
              placeholder="e.g., ICT, Finance, Retail"
            />
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-600 mb-2 font-semibold">
              What is your primary use case?
            </label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded py-3 px-4 leading-tight focus:outline-none focus:border-orange-400 h-32"
              placeholder="Describe your use case and expected monthly volume"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setShowGrowthForm(false);
                setSelectedPackage("");
                setIndustry("");
                setUseCase("");
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
            >
              Back
            </button>
            <button
              onClick={handleEnterpriseSubmit}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
            >
              Submit Request
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
                    <p className="text-center text-green-600 mb-4">
                      You saved <span className="font-semibold">KES {discount.toLocaleString()}</span> ({discountPercentage}% discount)
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