import React, { useState } from "react";
import { requestUnits } from "@/app/api/actions/reward/reward";

const RequestAirtimeModal = ({ closeModal, onCancel }) => {
  const handleCancel = onCancel || closeModal;

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [numberOfUnitsError, setNumberOfUnitsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (submitting) return;

    if (!org_id) {
      setErrorMessage("No organization selected. Please select an account and try again.");
      return;
    }

    const units = Number(airtimeAmount);
    if (!Number.isInteger(units) || units <= 0) {
      setNumberOfUnitsError(true);
      return;
    }
    const newRequest = {
      units,
      service: "AIRTIME",
    };
  
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await requestUnits({ org_id, newRequest });
      if (res.status === 201 || res.status === 200) {
        setSuccessMessage("Your Airtime Request is under Review");
      } else {
        setErrorMessage("Failed to request airtime units. Please try again.");
      }
    } catch (error) {
      console.error("Failed to request airtime units:", error);
      setErrorMessage("Failed to request airtime units. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <div
      id="request-airtime-units-modal"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-airtime-units-title"
      onClick={(event) => {
        event.stopPropagation();
        if (
          event.target === event.currentTarget &&
          !submitting &&
          !successMessage
        ) {
          handleCancel();
        }
      }}
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3
              id="request-airtime-units-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Request for Airtime
            </h3>
          </div>
          <div className="p-4 md:p-5 space-y-4">
            {successMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-green-500">
                  Success!
                </div>
                <div className="mb-4 text-gray-900 dark:text-white">
                  {successMessage}
                </div>
                <button
                  onClick={() => {
                    setSuccessMessage("");
                    closeModal();
                  }}
                  className="w-full text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label
                    htmlFor="airtimeAmount"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Airtime Amount
                  </label>
                  <input
                    type="number"
                    id="airtimeAmount"
                    className={`bg-gray-50 border ${numberOfUnitsError ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white`}
                    placeholder="100"
                    value={airtimeAmount}
                    disabled={submitting}
                    onChange={(e) => {
                      setAirtimeAmount(e.target.value);
                      setNumberOfUnitsError(false);
                    }}
                    required
                  />
                </div>
                {errorMessage && (
                  <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={submitting}
                    className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-800"
                  >
                    {submitting ? "Requesting..." : "Request"}
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

export default RequestAirtimeModal;
