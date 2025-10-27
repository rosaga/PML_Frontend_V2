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
  const [totalCost, setTotalCost] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountError, setAmountError] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [requestId, setRequestId] = useState("");

  const validateAmount = (amount) => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || amount === "") {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numAmount < 1) {
      setAmountError("Minimum amount is KES 1");
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
    let isValid = validateAmount(airtimeAmount);

    if (isValid) {
      setTotalCost(airtimeAmount);
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
    setTotalCost(0);
    setPhoneNumber("");
    setAmountError("");
    setRequestId("");
  };

  const handleExit = () => {
    closeAllModals();
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

      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              currentStep >= 1 ? "bg-gray-500" : "bg-gray-300"
            }`}
          >
            1
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

      {currentStep === 1 && (
        <div className="mx-auto max-w-6xl px-4">
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
              placeholder="Enter amount (KES 1 - 250,000)"
            />
            {amountError && (
              <p className="text-red-500 text-sm mt-2">{amountError}</p>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-1">
              <strong>Minimum:</strong> KES 1
            </p>
            <p className="text-gray-600 text-sm mb-1">
              <strong>Maximum:</strong> KES 250,000
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCurrentStep(1);
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

      {currentStep === 3 && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Review & Payment
          </h2>

          <div className="border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Airtime Details</h3>

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
