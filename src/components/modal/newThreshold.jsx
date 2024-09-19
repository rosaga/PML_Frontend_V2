"use client";
import React, { useEffect, useState } from "react";
import { CreateThreshold } from '../../../src/app/api/actions/threshold/threshold'; 
import { GetBalance } from "@/app/api/actions/reward/reward";

const NewThreshold = ({ closeModal, threshold }) => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(threshold?.module || "");
  const [thresholdValue, setThresholdValue] = useState(threshold?.threshold || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function getBundles() {
    try {
      const balanceData = await GetBalance(org_id);
      if (balanceData) {
        setBundles(balanceData.data.data);
      }
    } catch (error) {
      console.log("Error fetching bundles:", error);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBundle || !thresholdValue) {
      setErrorMessage("Please select a bundle and enter a threshold value");
      return;
    }

    const formValues = {
      org_id: org_id,
      bundle_size: selectedBundle,
      threshold_value: thresholdValue
    };

    try {
      let res;
      if (threshold) {
        res = await CreateThreshold(formValues); 
      } else {
        res = await CreateThreshold(formValues);
      }

      if (res.status === 200) {
        setSuccessMessage(threshold ? "Threshold updated successfully" : "Threshold created successfully");
        setErrorMessage("");
      } else {
        setErrorMessage("Failed to save threshold. Please try again.");
      }
    } catch (error) {
      console.log("Error:", error);
      setErrorMessage("Error occurred while saving threshold.");
    }
  };

  useEffect(() => {
    getBundles();
   
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
                className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                OK
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {threshold ? "Edit Notification Threshold" : "Set Notification Threshold"}
                </h3>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-2" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="bundleSize"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Data Bundle
                    </label>
                    <select
                      name="bundleSize"
                      id="bundleSize"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={selectedBundle}
                      onChange={(e) => setSelectedBundle(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select a bundle</option>
                      {bundles.map((bundle, index) => (
                        <option key={index} value={bundle.module}>
                          {bundle.module}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="thresholdValue"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Enter Threshold Number of Units
                    </label>
                    <input
                      type="number"
                      name="thresholdValue"
                      id="thresholdValue"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(e.target.value)}
                      placeholder="Enter threshold value"
                      required
                    />
                  </div>

                  {errorMessage && (
                    <div className="text-red-500 text-sm mb-4">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    >
                      {threshold ? "Update" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewThreshold;
