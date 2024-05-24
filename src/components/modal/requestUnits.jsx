import React, { useEffect, useState } from "react";
import axios from "axios";

const RequestUnitsModal = ({ closeModal }) => {
  const [bundleAmount, setBundleAmount] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");

  const handleRequest = async () => {
    try {
      const authResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/token`, {
        username: process.env.NEXT_PUBLIC_USERNAME,
        password: process.env.NEXT_PUBLIC_PASSWORD,
      });

      const fetchedToken = authResponse.data.token;
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/recharge`,
          {
            package: bundleAmount.toString(), 
            units: parseInt(numberOfUnits),
          },
          {
            headers: {
              Authorization: `Bearer ${fetchedToken}`,
            },
          }
        );

        closeModal(); 
      } catch (error) {
        console.error("Error requesting data units:", error);
      }
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") {
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal]);

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
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={closeModal}
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-4 md:p-5">
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label
                  htmlFor="bundleAmount"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Bundle Amount
                </label>
                <input
                  type="text"
                  id="bundleAmount"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="10MB or 2GB"
                  value={bundleAmount}
                  onChange={(e) => setBundleAmount(e.target.value)}
                  required
                />
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
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="200"
                  value={numberOfUnits}
                  onChange={(e) => setNumberOfUnits(e.target.value)}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequest}
                  className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestUnitsModal;