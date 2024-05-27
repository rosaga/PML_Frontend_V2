"use client";
import React, { useEffect } from "react";

const GenerateVoucherModal = ({ closeModal }) => {

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
              Generate Voucher
            </h3>

          </div>
          <div className="p-4 md:p-5">
            <form className="space-y-2" action="#">
            <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Number of vouchers to generate
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="200"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Bundle Amount
                </label>
                <input
                  type="text"
                  name="vouchers"
                  id="vouchers"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="10MB"
                  required
                />
              </div>
              
              <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    onClick={closeModal}
                  >
                    Submit
                  </button>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateVoucherModal;
