"use client";
import React, { useState } from "react";

const SMSPricing = () => {
  const [activeTab, setActiveTab] = useState("packages");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [smsUnits, setSmsUnits] = useState(1);
  const [rate, setRate] = useState(1.06);
  const [cost, setCost] = useState(1.06);
  const [unitsError, setUnitsError] = useState("");

  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const pricingPackages = [
    {
      id: 1,
      title: "Basic",
      range: "25,000 - 125,000 Units",
      price: "1.06 ksh per SMS",
      buttonText: "Select Package",
      buttonAction: "select",
      rate: 1.06,
      minUnits: 25000,
      maxUnits: 125000,
    },
    {
      id: 2,
      title: "Plus",
      range: "125,001 - 524,999 Units",
      price: "0.85 ksh per SMS",
      buttonText: "Select Package",
      buttonAction: "select",
      rate: 0.85,
      minUnits: 125001,
      maxUnits: 524999,
    },
    {
      id: 3,
      title: "Premium",
      range: "525,000+",
      price: "Custom",
      buttonText: "Contact Sales",
      buttonAction: "contact",
      rate: null,
      minUnits: null,
      maxUnits: null,
    },
  ];

  const handleTabChange = (tab) => setActiveTab(tab);

  const openBuyModalForPackage = (pkg) => {
    setSelectedPackage(pkg);
    const r = pkg.rate ?? rate;
    setRate(r);
    const startUnits = pkg.minUnits ?? 1;
    setSmsUnits(startUnits);
    setCost(startUnits * r);
    setUnitsError("");
    setModalType("buy");
    setShowModal(true);
  };

  const openContactModalForPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalType("contact");
    setShowModal(true);
  };

  const handleButtonClick = (action, packageId) => {
    const selectedPkg = pricingPackages.find((p) => p.id === packageId);
    if (!selectedPkg) return;

    if (action === "select") {
      openBuyModalForPackage(selectedPkg);
    } else if (action === "contact") {
      openContactModalForPackage(selectedPkg);
    }
  };

  const validateUnits = (pkg, units) => {
    if (!pkg?.minUnits && !pkg?.maxUnits) return { valid: true, reason: "" };
    if (pkg?.minUnits && units < pkg.minUnits) return { valid: false, reason: "min" };
    if (pkg?.maxUnits && units > pkg.maxUnits) return { valid: false, reason: "max" };
    return { valid: true, reason: "" };
  };

  const handleSmsUnitsChange = (e) => {
    const raw = e.target.value;
    const units = Math.max(0, parseInt(raw || "0", 10));
    setSmsUnits(units);

    const { valid, reason } = validateUnits(selectedPackage, units);
    setUnitsError(valid ? "" : reason);

    if (valid) {
      setCost(units * (rate || 0));
    } else {
      setCost(0);
    }
  };

  const goToPayment = () => {
    const { valid } = validateUnits(selectedPackage, smsUnits);
    if (!valid || smsUnits <= 0) return;

    setPaymentPhone("");
    setPaymentError("");
    setModalType("payment");
  };

  const isValidPhone = (phone) => {
    const digits = (phone || "").replace(/[^\d]/g, "");
    return digits.length >= 10 && digits.length <= 12;
  };

  const handlePay = async () => {
    setPaymentError("");

    if (!isValidPhone(paymentPhone)) {
      setPaymentError("Please enter a valid mobile number.");
      return;
    }
    if (cost <= 0) {
      setPaymentError("Amount is invalid. Please review your units.");
      return;
    }

    try {
      setIsPaying(true);
      const simulatedSuccess = true;
      setIsPaying(false);
      setModalType(simulatedSuccess ? "success" : "failure");
    } catch (err) {
      setIsPaying(false);
      setModalType("failure");
    }
  };

  const closeAllModals = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedPackage(null);
    setUnitsError("");
    setPaymentError("");
    setIsPaying(false);
  };

  const handleContactSubmit = (payload) => {
    console.log("Contact sales form submitted:", payload);
    setShowModal(false);
  };

  function ContactForm({ contextTitle = "Request Custom Quote", onSubmit }) {
    const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      company: "",
      estimatedVolume: "",
      message: "",
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((f) => ({ ...f, [name]: value }));
    };

    const submit = (e) => {
      e.preventDefault();
      onSubmit?.(form);
    };

    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Company</label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Acme Ltd."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="+254 700 000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Estimated Monthly SMS Volume</label>
          <input
            type="number"
            name="estimatedVolume"
            value={form.estimatedVolume}
            onChange={handleChange}
            min="0"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="e.g. 600,000"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder={`Tell us more about your use case${contextTitle ? ` — ${contextTitle}` : ""}`}
          />
        </div>

        <div className="flex space-x-4 pt-2">
          <button
            type="button"
            className="w-1/2 bg-gray-100 text-gray-800 py-3 rounded-md hover:bg-gray-200 transition-colors"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors"
          >
            Submit
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-medium text-gray-700 mb-6">SMS Pricing</h2>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex">
          <button
            className={`px-6 py-2 rounded-full ${
              activeTab === "packages" ? "bg-orange-400 text-white" : "bg-white text-gray-700"
            } font-medium transition-colors duration-200`}
            onClick={() => handleTabChange("packages")}
          >
            Packages
          </button>
          <button
            className={`px-6 py-2 rounded-full ml-4 ${
              activeTab === "custom" ? "bg-orange-400 text-white" : "bg-white text-gray-700"
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
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ marginLeft: "100px" }}
          >
            {pricingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col items-center"
              >
                {/* Package Title */}
                <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                  {pkg.title}
                </h2>

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

                {/* Package Details */}
                <h3 className="text-base font-medium text-gray-700 mb-1 text-center">
                  {pkg.range}
                </h3>
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
            <h3 className="text-xl font-medium text-gray-700">Request Custom Quote</h3>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <div className="bg-gray-200 px-4 py-2 rounded-md">
                <span className="text-gray-700">Custom Rate</span>
              </div>
            </div>
          </div>

          <ContactForm
            contextTitle="Custom"
            onSubmit={(payload) => {
              handleContactSubmit({ ...payload, source: "Custom Tab" });
            }}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
          <div className="relative z-10 w-full max-w-xl bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-medium text-gray-800">
                  {modalType === "buy" && `Buy ${selectedPackage?.title} Package`}
                  {modalType === "payment" && `Payment — ${selectedPackage?.title} Package`}
                  {modalType === "contact" &&
                    `Contact Sales — ${selectedPackage?.title || "Custom"}`}
                  {modalType === "success" && "Payment Successful"}
                  {modalType === "failure" && "Payment Failed"}
                </h3>
                {modalType === "buy" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Rate: <span className="font-medium">{rate} ksh per SMS</span>
                    {selectedPackage?.minUnits != null && selectedPackage?.maxUnits != null && (
                      <>
                        {" · "}
                        Allowed:{" "}
                        <span className="font-medium">
                          {selectedPackage.minUnits.toLocaleString()} to{" "}
                          {selectedPackage.maxUnits.toLocaleString()} units
                        </span>
                      </>
                    )}
                  </p>
                )}
                {modalType === "payment" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Units:{" "}
                    <span className="font-medium">
                      {smsUnits.toLocaleString()}
                    </span>{" "}
                    · Rate: <span className="font-medium">{rate} ksh</span> · Amount:{" "}
                    <span className="font-medium">{cost.toFixed(2)} ksh</span>
                  </p>
                )}
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
                onClick={closeAllModals}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="pt-6">
              {modalType === "buy" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Number of SMS Units</label>
                    <input
                      type="number"
                      value={smsUnits}
                      min={selectedPackage?.minUnits || 0}
                      max={selectedPackage?.maxUnits || undefined}
                      onChange={handleSmsUnitsChange}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                        unitsError
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                      placeholder="Enter number of SMS units"
                    />
                    {unitsError === "min" && (
                      <p className="text-red-600 text-sm mt-2">
                        Minimum not allowed: enter at least{" "}
                        {selectedPackage?.minUnits?.toLocaleString()} units for the{" "}
                        {selectedPackage?.title} package.
                      </p>
                    )}
                    {unitsError === "max" && (
                      <p className="text-red-600 text-sm mt-2">
                        Maximum exceeded: enter no more than{" "}
                        {selectedPackage?.maxUnits?.toLocaleString()} units for the{" "}
                        {selectedPackage?.title} package.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Total Cost</label>
                    <input
                      type="text"
                      value={Number.isFinite(cost) ? `${cost.toFixed(2)}` : "0.00"}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      className="w-1/2 bg-gray-100 text-gray-800 py-3 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={closeAllModals}
                    >
                      Cancel
                    </button>
                    <button
                      className="w-1/2 bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors disabled:opacity-50"
                      onClick={goToPayment}
                      disabled={
                        !!unitsError ||
                        smsUnits <= 0 ||
                        !Number.isFinite(cost) ||
                        cost <= 0
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {modalType === "payment" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                        paymentError
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                      placeholder="+254 7XX XXX XXX"
                    />
                    {paymentError && (
                      <p className="text-red-600 text-sm mt-2">{paymentError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Amount</label>
                    <input
                      type="text"
                      value={`${cost.toFixed(2)} ksh`}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      className="w-1/2 bg-gray-100 text-gray-800 py-3 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={() => setModalType("buy")}
                      disabled={isPaying}
                    >
                      Back
                    </button>
                    <button
                      className="w-1/2 bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors disabled:opacity-50"
                      onClick={handlePay}
                      disabled={isPaying}
                    >
                      {isPaying ? "Processing..." : "Pay"}
                    </button>
                  </div>
                </div>
              )}

              {modalType === "contact" && (
                <ContactForm
                  contextTitle={selectedPackage?.title || "Custom"}
                  onSubmit={(payload) =>
                    handleContactSubmit({
                      ...payload,
                      source: `Modal — ${selectedPackage?.title || "Custom"}`,
                    })
                  }
                />
              )}

              {modalType === "success" && (
                <div className="space-y-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-2xl">✓</span>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    Payment successful! You purchased{" "}
                    <span className="font-medium">
                      {smsUnits.toLocaleString()} units
                    </span>{" "}
                    on the <span className="font-medium">{selectedPackage?.title}</span> plan for{" "}
                    <span className="font-medium">{cost.toFixed(2)} ksh</span>.
                  </p>
                  <button
                    className="w-full bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors"
                    onClick={closeAllModals}
                  >
                    Done
                  </button>
                </div>
              )}

              {modalType === "failure" && (
                <div className="space-y-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 text-2xl">!</span>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    Payment failed. Please check your mobile number and try again.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      className="w-1/2 bg-gray-100 text-gray-800 py-3 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={closeAllModals}
                    >
                      Cancel
                    </button>
                    <button
                      className="w-1/2 bg-orange-400 text-white py-3 rounded-md hover:bg-orange-500 transition-colors"
                      onClick={() => setModalType("payment")}
                    >
                      Try Again
                    </button>
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

export default SMSPricing;
