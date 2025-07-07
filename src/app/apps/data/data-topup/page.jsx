"use client";

import React, { useState, useEffect, useRef } from "react";
import { getToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";

import {
  processFreeTrialRequest,
  processPaidPackageRequest,
  checkPaymentStatus,
  checkPreviousPayments
} from "@/app/api/actions/payments/payments";

const DataUnitsTopupPage = () => {
  let orgId = null;
  let token = null;
  if (typeof window !== "undefined") {
    orgId = localStorage.getItem("selectedAccountId");
    token = getToken();
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [bundleSize, setBundleSize] = useState("");
  const [units, setUnits] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  
  const [cart, setCart] = useState([]);
  
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState(false);
  const [trialError, setTrialError] = useState("");
  
  const [loadingPaid, setLoadingPaid] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const router = useRouter();

  const canAdd      = bundleSize && Number(units) > 0 &&
                      totalCost <= 250000;
  const canProceed  = 
                    totalCost >= 10000 &&
                    totalCost <= 250000;


  const ratePerMB = 0.20;

  const [isTrialEligible, setIsTrialEligible] = useState(false);
  const [checkingTrial,  setCheckingTrial]  = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const formRef = useRef();

  const handleProceed = () => {
    router.push("/apps/data/data-rewards?tab=Rewards");
  };

  const handleClose = () => {
    onClose();
    router.push("/apps/data/dashboard");
  };

    useEffect(() => {
    async function fetchEligibility() {
      if (!orgId) {
        setCheckingTrial(false);
        return;
      }
      try {
        const usedBefore = await checkPreviousPayments(orgId);
        setIsTrialEligible(!usedBefore);
      } catch (err) {
        console.error("Eligibility check failed:", err);
        setIsTrialEligible(false);
      } finally {
        setCheckingTrial(false);
      }
    }
    fetchEligibility();
  }, [orgId]);

  useEffect(() => {
    let calculatedCost = 0;
    cart.forEach(item => {
      const mbValue = parseInt(item.bundleSize);
      calculatedCost += ratePerMB * mbValue * item.units;
    });
    
    if (bundleSize && units) {
      const mbValue = parseInt(bundleSize);
      const unitsValue = parseInt(units);
      if (!isNaN(mbValue) && !isNaN(unitsValue)) {
        calculatedCost += ratePerMB * mbValue * unitsValue;
      }
    }
    
    setTotalCost(calculatedCost);
  }, [cart, bundleSize, units]);

  const addBundle = () => {
    if (!bundleSize || !units) return;
    
    const newItem = {
      id: Date.now(),
      bundleSize,
      units: parseInt(units),
    };
    setCart([...cart, newItem]);
    setBundleSize("");
    setUnits("");
  };

  const removeBundle = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleFreeTrial = async () => {
    if (!orgId) {
      setTrialError("Organisation not found. Please log in again.");
      return;
    }
    setLoadingTrial(true);
    setTrialError("");

    try {
      await processFreeTrialRequest(orgId, phoneNumber, "FREE TRIAL");
      setPaymentSuccess(true);
    } catch (err) {
      setTrialError(err.message ?? "Could not start free-trial.");
    } finally {
      setLoadingTrial(false);
    }
  };

  const handlePayment = async () => {
    if (!orgId) {
      setPaymentError("Organisation not found. Please log in again.");
      return;
    }
    setLoadingPaid(true);
    setPaymentError("");
    setShowPaymentModal(true);

    try {
      const allBundles = [...cart];
      
      if (bundleSize && units) {
        allBundles.push({
          id: Date.now(),
          bundleSize,
          units: parseInt(units)
        });
      }

      const bundles = allBundles.map(item => {
        const mbValue = parseInt(item.bundleSize, 10);
        const unitCost = ratePerMB * mbValue * item.units;

        return {
          bundle_type: mbValue.toString(),
          units:        item.units,
          amount:       unitCost
        };
      });

      const totalAmount = bundles.reduce((sum, b) => sum + b.amount, 0);

      const paymentResponse = await processPaidPackageRequest(
        orgId,
        phoneNumber,
        "Starter",
        bundles,
        totalAmount
      );

      if (paymentResponse.errors) {
        throw new Error(paymentResponse.errors._error);
      }
      const paymentId = paymentResponse.payment?.id;
      if (!paymentId) {
        throw new Error("Payment ID not received");
      }

      setPaymentError("");
      const maxAttempts = 30;
      let attempts = 0;

      const pollPaymentStatus = async () => {
        try {
          const payment = await checkPaymentStatus(orgId, paymentId);
          if (payment.status === "SUCCESS") {
            if (bundleSize && units) {
              setCart([...cart, {
                id: Date.now(),
                bundleSize,
                units: parseInt(units)
              }]);
            }
            setShowPaymentModal(false);
            setPaymentSuccess(true);
            return;
          }
          if (payment.status === "FAILED") {
            throw new Error(payment.status_desc || "Payment failed");
          }
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollPaymentStatus, 10000);
          } else {
            throw new Error("Payment timeout. Please check your M-Pesa messages.");
          }
        } catch (err) {
          setPaymentError(err.message ?? "Failed to verify payment status");
          setShowPaymentModal(false);
          setLoadingPaid(false);
        }
      };

      setTimeout(pollPaymentStatus, 5000);

    } catch (err) {
      setPaymentError(err.message ?? "Payment failed. Please try again.");
      setShowPaymentModal(false);
      setLoadingPaid(false);
    }
  };

  const handleTopUpAgain = () => {
    setPaymentSuccess(false);
    setCurrentStep(1);
    setCart([]);
    setPhoneNumber("+254");
  };

  const handleExit = () => {
    router.push("/apps/data/dashboard");
  };

  // Payment Processing Modal
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
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
    </div>
  );

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
  }, []);

  const handleSubmitGrowthForm = async (e) => {
    e.preventDefault();

    const templateParams = {
      from_email:    email,
      company_name:  companyName,
      industry,
      use_case:      useCase,
      to_email:      "support@peakmobile.co.ke",
    };

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );
      setFormSubmitted(true);
      setCompanyName("");
      setEmail("");
      setIndustry("");
      setUseCase("");
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Sorry—couldn’t submit the form. Please try again.");
    }
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
          <p className="text-center text-gray-600 mb-4">
            Your payment has been confirmed. You have received:
          </p>

          {/* List out each bundle + units */}
          <ul className="list-disc list-inside mb-12">
            {cart.map(item => {
              const mbValue = parseInt(item.bundleSize, 10);
              return (
                <li key={item.id} className="text-gray-700">
                  <span className="font-medium">{mbValue}MB</span> ×{" "}
                  <span className="font-medium">{item.units}</span>{" "}
                  unit{item.units > 1 ? "s" : ""}
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={handleProceed}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
            >
              Proceed to Campaigns
            </button>
            <button
              onClick={handleExit}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
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
      {showPaymentModal && <PaymentModal />}
      
      <h1 className="text-center text-3xl font-semibold mb-12">
        Top up your Data Units in 3 Easy Steps
      </h1>

      {/* Steps Navigation */}
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

      {currentStep === 1 && !showGrowthForm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trial Package */}
          <div
          className={`border rounded-lg p-6 flex flex-col items-center transition-opacity ${
            !checkingTrial && !isTrialEligible ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <img
            src="/images/freetrial.png"
            alt="Piggy Bank"
            className="mb-6"
          />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            FREE TRIAL
          </h2>
          <div className="text-sm text-gray-600 mb-8 text-center">
            Run your first test rewards for Free
          </div>
          <p className="text-gray-500 mb-4">Rate per MB: 0.00</p>
          <div className="text-4xl font-bold text-orange-400 mb-6">
            Free
          </div>
          <div className="text-sm text-gray-600 mb-2">
            5 Free units of 20MB
          </div>
          <button
            onClick={handleFreeTrial}
            disabled={!isTrialEligible || loadingTrial}
            className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer disabled:opacity-50"
          >
            {loadingTrial ? "Processing…" : "Request Now"}
          </button>
          {trialError && (
            <p className="mt-2 text-sm text-red-600 text-center">
              {trialError}
            </p>
          )}
          {!checkingTrial && !isTrialEligible && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              You’ve already used your free trial.
            </p>
          )}
        </div>

          {/* Starter Package */}
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <img
              src="/images/starterpackage.png"
              alt="Rocket"
              className="mb-6"
            />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              STARTER
            </h2>
            <div className="text-sm text-gray-600 mb-8 text-center">
              For small businesses just getting started with rewards
            </div>
            <p className="text-gray-500 mb-4">Rate per MB: 0.20</p>
            <div className="flex items-baseline mb-6">
              <span className="text-gray-400 text-sm mr-2">From Ksh</span>
              <span className="text-4xl font-bold text-orange-400">
                10,000
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">500 Free SMS</div>
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
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
              GROWTH
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
              <div className="text-sm text-gray-600 text-center">
                2000 Free SMS
              </div>
            </div>
            <button
              onClick={() => setShowGrowthForm(true)}
              className="bg-[#F58426] hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-full cursor-pointer"
            >
              Talk to Sales
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && !showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl relative">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-700">
              Request Data Units
            </h2>
            <span className="bg-gray-200 rounded py-2 px-4">
              Total Cost: Ksh {totalCost.toFixed(2)}
            </span>
          </div>

          <div className="mb-6 text-gray-500 space-y-1">
            <p>Please note:</p>
            <p>The minimum amount to top up is Ksh 10,000</p>
            <p>The maximum amount to top up is Ksh 250,000</p>
          </div>

          {cart.length > 0 && (
            <div className="mb-8 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="bg-green-100 rounded p-4 flex justify-between items-center">
                  <span>{item.units} units of {item.bundleSize}</span>
                  <button
                    onClick={() => removeBundle(item.id)}
                    className="text-red-500 font-bold text-xl"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <div>
              <label className="block text-gray-600 mb-2">Bundle Amount</label>
              <select
                value={bundleSize}
                onChange={e => setBundleSize(e.target.value)}
                className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400"
              >
                <option value="">Select Bundle</option>
                <option value="20">20 MB</option>
                <option value="50">50 MB</option>
                <option value="100">100 MB</option>
                <option value="200">200 MB</option>
                <option value="500">500 MB</option>
                <option value="1000">1 GB</option>
                <option value="5000">5 GB</option>
                <option value="10000">10 GB</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 mb-2">Number of Units</label>
              <input
                type="number"
                value={units}
                onChange={e => setUnits(e.target.value)}
                className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400"
                placeholder="200"
              />
            </div>

          {/* Add Bundle */}
          <div className="md:col-span-1 flex">
            <button
              onClick={addBundle}
              disabled={!canAdd}
              style={{ width: '190px' }}
              className="w-1/2 bg-gray-400 hover:bg-orange-500 text-white py-3 rounded disabled:opacity-50"
            >
              + Add Bundle
            </button>
          </div>

          </div>

          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded w-48"
            >
              Back
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceed}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded w-48 disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      )}


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
                    <span>{item.units} x {item.bundleSize}MB</span>
                    <span>Ksh {(ratePerMB * parseInt(item.bundleSize) * item.units).toFixed(0)}</span>
                  </div>
                ))}
                {/* Show current input values if they exist */}
                {bundleSize && units && (
                  <div className="flex justify-between mb-3">
                    <span>{units} x {bundleSize}MB</span>
                    <span>Ksh {(ratePerMB * parseInt(bundleSize) * parseInt(units)).toFixed(0)}</span>
                  </div>
                )}
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
              onChange={e => setPhoneNumber(e.target.value)}
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
              disabled={loadingPaid || totalCost < 10000 || totalCost > 250000}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded disabled:opacity-50"
            >
              {loadingPaid ? "Processing…" : "Pay"}
            </button>
          </div>
          {paymentError && <p className="mt-2 text-sm text-red-600">{paymentError}</p>}
        </div>
      )}

      {showGrowthForm && (
        <div className="border rounded-lg p-8 mb-12 mx-auto max-w-3xl">
          {formSubmitted ? (
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
                Email Sent!
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Thanks for reaching out. One of our sales specialists will contact you
                shortly.
              </p>

              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setShowGrowthForm(false);
                }}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
              >
                Back to Packages
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                Request Data Units: Growth Package
              </h2>
              <p className="text-gray-500 mb-6">
              Unlock Special pricing for Volume purchases. Minimum Spend 100,000
              </p>

              <form ref={formRef} onSubmit={handleSubmitGrowthForm}>
                {/* Company Name */}
                <div className="mb-6">
                  <label className="block text-gray-600 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400"
                    placeholder="Peak Mobile"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    name="from_email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400"
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                {/* Industry */}
                <div className="mb-6">
                  <label className="block text-gray-600 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400"
                    placeholder="ICT"
                    required
                  />
                </div>

                {/* Use Case */}
                <div className="mb-8">
                  <label className="block text-gray-600 mb-2">
                    What is your primary use case?
                  </label>
                  <textarea
                    name="use_case"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded py-3 px-4 focus:outline-none focus:border-orange-400 h-32"
                    placeholder="Describe here"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowGrowthForm(false)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default DataUnitsTopupPage;