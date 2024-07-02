"use client";
import React, { useEffect, useState } from "react";
import { createAccount } from "@/app/api/actions/accounts/accounts";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const NewAccountModal = ({ closeModal }) => {

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();

    const newAccount = {
      name: orgName,
      attributes: {
        emails: [email],
        description: [description]
    }
    };

    const res = createAccount({org_id,newAccount}).then((res) => {
      if (res.status === 200) {
        toast.success("CREATE ACCOUNT SUCCESS")
      } else {
        toast.error("CREATE ACCOUNT FAILED")
      }
    });

    return res;
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


            <>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Account
                </h3>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-2" action="#">
                  <div className="mb-4">
                    <label
                      htmlFor="orgname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="orgname"
                      id="orgname"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="PEAK TEST ACC"
                      maxLength="30"
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="firstname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Email
                    </label>
                    <input
                      type="text"
                      name="email"
                      id="email"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="peaktest@gmail.com"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                  <label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows="5"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="This is a test account for peak"
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      onClick={handleCreate}
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </>
        </div>
      </div>
    </div>
  );
};

export default NewAccountModal;
