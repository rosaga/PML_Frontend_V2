"use client";
import React, { useEffect, useState } from "react";
import { CreateAirtimeVouchers } from "@/app/api/actions/vouchers/vouchers";
import * as XLSX from "xlsx";
import InsufficientBalanceModal from "./insufficientBalance";
import RequestAirtimeModal from "./requestAirtime";
import { isInsufficientBalanceError } from "@/utils/apiErrors";

const GenerateAirtimeVoucherModal = ({ closeModal }) => {
  const [selectedBundle, setSelectedBundle] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const { v4: uuidv4 } = require("uuid");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [showRequestUnitsModal, setShowRequestUnitsModal] = useState(false);

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") closeModal();
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [closeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!org_id) return setErrorMessage("No organization selected.");
    if (!selectedBundle) return setErrorMessage("Please select an airtime amount.");
    if (!voucherNumber || Number(voucherNumber) <= 0)
      return setErrorMessage("Please enter a valid number of vouchers.");

    setSubmitting(true);
    setErrorMessage("");

    const payload = {
      org_id,
      total: parseInt(voucherNumber, 10),
      request_id: uuidv4(),
      bundle_size: String(selectedBundle),
      service: "AIRTIME",
    };

    try {
      const res = await CreateAirtimeVouchers(payload);
      if (res?.status === 201) {
        setSuccessMessage("The Airtime Vouchers have been created and downloaded successfully.");
        exportToExcel(res.data);
      } else if (isInsufficientBalanceError(res)) {
        setShowInsufficientBalanceModal(true);
      } else if (res?.errors?._error) {
        setErrorMessage(res.errors._error);
      } else {
        setErrorMessage("Failed to create vouchers. Please try again.");
      }
    } catch (error) {
      if (isInsufficientBalanceError(error)) {
        setShowInsufficientBalanceModal(true);
      } else {
        setErrorMessage(`Failed to create vouchers. Please try again. ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportToExcel = (voucherData) => {
    const worksheet = XLSX.utils.json_to_sheet(
      voucherData.map((v) => ({
        Voucher_Code: v.voucher_code,
        Message: `To Redeem send this voucher code ${v.voucher_code} to 24995`,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers");
    XLSX.writeFile(workbook, "vouchers_" + new Date().toISOString() + ".xlsx");
  };

  if (showRequestUnitsModal) {
    return (
      <RequestAirtimeModal
        closeModal={closeModal}
        onCancel={() => setShowRequestUnitsModal(false)}
      />
    );
  }

  if (showInsufficientBalanceModal) {
    return (
      <InsufficientBalanceModal
        service="AIRTIME"
        onClose={() => setShowInsufficientBalanceModal(false)}
        onRequestUnits={() => {
          setShowInsufficientBalanceModal(false);
          setShowRequestUnitsModal(true);
        }}
      />
    );
  }

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generate Airtime Voucher
            </h3>
          </div>
          <div className="p-4 md:p-5">
            {successMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-green-500">Success!</div>
                <div className="mb-4 text-gray-900 dark:text-white">{successMessage}</div>
                <button
                  onClick={() => {
                    setSuccessMessage("");
                    closeModal();
                  }}
                  className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : errorMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-red-500">Oops!</div>
                <div className="mb-4 text-gray-900 dark:text-white">{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage("")}
                  className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : (
              <form className="space-y-2" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="voucherNumber"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Number of vouchers to generate
                  </label>
                  <input
                    type="number"
                    id="voucherNumber"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="200"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="bundle"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Airtime Amount
                  </label>
                  <select
                    id="bundle"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={selectedBundle}
                    onChange={(e) => setSelectedBundle(e.target.value)}
                    required
                  >
                    <option value="">Selected Airtime Amount</option>
                    <option value="20">20 Ksh</option>
                    <option value="50">50 Ksh</option>
                    <option value="100">100 Ksh</option>
                    <option value="200">200 Ksh</option>
                    <option value="500">500 Ksh</option>
                    <option value="1000">1000 Ksh</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAirtimeVoucherModal;
