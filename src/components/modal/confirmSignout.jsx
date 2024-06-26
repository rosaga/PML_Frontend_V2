import React, { useEffect, useState } from "react";
import { requestUnits } from "@/app/api/actions/reward/reward";
import { GetBalance } from "@/app/api/actions/reward/reward";


const ConfirmSignOutModal = ({ onClose, onConfirm }) => {

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
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
          <div className="text-center p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl text-center font-semibold text-gray-900 dark:text-white">
            Confirm Logout
            </h3>

          </div>
          <div className="p-4 md:p-5">
            <form className="space-y-2" action="#">
            <h5 className="text-lg text-center text-gray-900 dark:text-white mb-8">
            Are you sure you want to Logout ?
            </h5>
              
              <div className="flex space-x-2">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full text-white bg-red-500 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    onClick={onConfirm}                  
                  >
                    Logout
                  </button>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSignOutModal;
