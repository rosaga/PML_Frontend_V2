import React, { useEffect, useState } from "react";
import { requestUnits } from "@/app/api/actions/reward/reward";
import { GetBalance } from "@/app/api/actions/reward/reward";

const RequestUnitsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [bundleAmount, setBundleAmount] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [requests, setRequests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [bundles, setBundles] = useState([]);
  const [bundleAmountError, setBundleAmountError] = useState(false);
  const [numberOfUnitsError, setNumberOfUnitsError] = useState(false);

  const handleRequest = async () => {
    const currentRequest = bundleAmount && numberOfUnits ? {
      bundleAmount,
      numberOfUnits
    } : null;

    const allRequests = currentRequest ? [...requests, currentRequest] : requests;

    const results = await Promise.all(allRequests.map(async (request) => {
      const newRequest = {
        package: request.bundleAmount,
        units: parseInt(request.numberOfUnits),
      };

      const res = await requestUnits({ org_id, newRequest });
      return res.status === 201;
    }));

    if (results.every(result => result)) {
      setSuccessMessage(`Your Data Units Request is under Review`);
      setErrorMessage("");
    } else {
      setErrorMessage("Failed to send data. Please try again.");
    }
  };

  const handleAddRequest = () => {
    if (bundleAmount === "") {
      setBundleAmountError(true);
      return;
    }
    if (numberOfUnits === "") {
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

  useEffect(() => {
    async function fetchBalance() {
      const balanceData = await GetBalance(org_id);
      if (balanceData) {
        setBundles(balanceData.data.data);
      }
    }
    fetchBalance();
  }, []);

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
              Request Data Units
            </h3>
            <div className="flex space-x-4">
              <div className="px-2 py-2 bg-gray-400 text-gray-900 rounded-md border border-gray-400">
                Total Cost: Ksh. {calculateTotalCost()}
              </div>
              {!successMessage ? (
                <button
                onClick={handleAddRequest}
                className="flex items-center px-4 py-2 text-sm font-medium text-white  rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-800"
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
                      className="text-red-500 hover:text-red-700"
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
                      required
                    >
                      <option value="">Select Bundle</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="500">500</option>
                      <option value="1024">1024</option>
                      <option value="3072">3072</option>
                      <option value="AIRTIME">AIRTIME</option>
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
                      required
                    />
                  </div>
                  {errorMessage && (
                    <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRequest}
                      className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-800"
                    >
                      Request
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
