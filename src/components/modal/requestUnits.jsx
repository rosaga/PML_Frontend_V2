import React, { useState } from "react";
import { requestUnits } from "@/app/api/actions/reward/reward";

const RequestUnitsModal = ({ closeModal, onCancel }) => {
  const handleCancel = onCancel || closeModal;

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [bundleAmount, setBundleAmount] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [requests, setRequests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [bundleAmountError, setBundleAmountError] = useState(false);
  const [numberOfUnitsError, setNumberOfUnitsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (submitting) return;

    if (!org_id) {
      setErrorMessage("No organization selected. Please select an account and try again.");
      return;
    }

    const hasCurrentRequest = Boolean(bundleAmount || numberOfUnits);
    const currentUnits = Number(numberOfUnits);

    if ((requests.length === 0 || hasCurrentRequest) && !bundleAmount) {
      setBundleAmountError(true);
      return;
    }
    if (
      (requests.length === 0 || hasCurrentRequest) &&
      (!Number.isInteger(currentUnits) || currentUnits <= 0)
    ) {
      setNumberOfUnitsError(true);
      return;
    }

    const currentRequest = bundleAmount && numberOfUnits ? {
      bundleAmount,
      numberOfUnits
    } : null;
  
    const allRequests = currentRequest ? [...requests, currentRequest] : requests;
  
    setSubmitting(true);
    setErrorMessage("");

    try {
      const failedRequests = [];

      for (const request of allRequests) {
        const newRequest = {
          package: request.bundleAmount,
          units: Number(request.numberOfUnits),
          service: "DATA",
        };

        try {
          const res = await requestUnits({ org_id, newRequest });
          if (res.status !== 201 && res.status !== 200) {
            failedRequests.push(request);
          }
        } catch (error) {
          console.error("Failed to submit a data-unit request:", error);
          failedRequests.push(request);
        }
      }

      setBundleAmount("");
      setNumberOfUnits("");
      setRequests(failedRequests);

      if (failedRequests.length === 0) {
        setSuccessMessage(`Your Data Units Request is under Review`);
      } else {
        setErrorMessage(
          "Some requests could not be submitted. Please retry the remaining requests."
        );
      }
    } catch (error) {
      console.error("Failed to request data units:", error);
      setErrorMessage("Failed to request data units. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  

  const handleAddRequest = () => {
    if (submitting) return;

    if (bundleAmount === "") {
      setBundleAmountError(true);
      return;
    }
    const units = Number(numberOfUnits);
    if (!Number.isInteger(units) || units <= 0) {
      setNumberOfUnitsError(true);
      return;
    }

    const newRequest = {
      bundleAmount,
      numberOfUnits
    };

    setRequests([...requests, newRequest]);
    setBundleAmount("");
    setNumberOfUnits("");
    setBundleAmountError(false);
    setNumberOfUnitsError(false);
  };

  const handleRemoveRequest = (index) => {
    if (submitting) return;

    const newRequests = [...requests];
    newRequests.splice(index, 1);
    setRequests(newRequests);
  };

  const calculateTotalCost = () => {
    const currentRequestCost = bundleAmount && numberOfUnits ? 
      parseFloat(bundleAmount) * parseFloat(numberOfUnits) * 0.22 : 0;

    const totalCost = requests.reduce((total, request) => {
      const bundleAmount = parseFloat(request.bundleAmount);
      const numberOfUnits = parseFloat(request.numberOfUnits);
      if (!isNaN(bundleAmount) && !isNaN(numberOfUnits)) {
        return total + (bundleAmount * numberOfUnits * 0.22);
      }
      return total;
    }, 0);

    return (totalCost + currentRequestCost).toFixed(2);
  };

  return (
    <div
      id="request-data-units-modal"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-data-units-title"
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
              id="request-data-units-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Request Data Units
            </h3>
            <div className="flex space-x-4">
              <div className="px-2 py-2 bg-gray-400 text-gray-900 rounded-md border border-gray-400">
                Total Cost: Ksh. {calculateTotalCost()}
              </div>
              {!successMessage ? (
                <button
                onClick={handleAddRequest}
                disabled={submitting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-orange-800"
                style={{ backgroundColor: "#F58426" }}
              >
                + New
              </button>
                ):(
                  ''
                )}
              
            </div>
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
              <>
                {requests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-100 rounded">
                    <span>
                      {request.numberOfUnits} units of {request.bundleAmount}MB
                    </span>
                    <button
                      onClick={() => handleRemoveRequest(index)}
                      disabled={submitting}
                      aria-label={`Remove ${request.numberOfUnits} unit request`}
                      className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      X
                    </button>
                  </div>
                ))}
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label
                      htmlFor="bundleAmount"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Bundle Amount
                    </label>
                    <select
                      id="bundleAmount"
                      className={`bg-gray-50 border ${bundleAmountError ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white`}
                      value={bundleAmount}
                      onChange={(e) => { setBundleAmount(e.target.value); setBundleAmountError(false); }}
                      disabled={submitting}
                      required
                    >
                      <option value="">Select Bundle</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="150">150</option>
                      <option value="200">200</option>
                      <option value="250">250</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
                      <option value="2000">2000</option>
                      <option value="3000">3000</option>
                      <option value="5000">5000</option>
                      <option value="10000">10000</option>
                      
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="numberOfUnits"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Number of Units
                    </label>
                    <input
                      type="number"
                      id="numberOfUnits"
                      className={`bg-gray-50 border ${numberOfUnitsError ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white`}
                      placeholder="200"
                      value={numberOfUnits}
                      onChange={(e) => { setNumberOfUnits(e.target.value); setNumberOfUnitsError(false); }}
                      disabled={submitting}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestUnitsModal;
