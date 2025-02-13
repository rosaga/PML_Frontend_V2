"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { batchReward } from "@/app/api/actions/reward/reward";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";


const SendBatchRewardsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [message, setMessage] = useState("");
  const [contactsFile, setContactsFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSenderName, setSelectedSenderName] = useState("");
  const [senderName, setSenderName] = useState([]);



  const handleSubmit = (e) => {
    e.preventDefault();

    if (!contactsFile) {
      console.log('Please select a file and a group');
      return;
    }

    const newReward = {
      contacts: contactsFile,
      bundle: selectedBundle,
      message : message,
      sender_id: parseInt(selectedSenderName),
      slogan : "5",
      postpay: true
    };

    console.log("New Reward Payload:", newReward);


    const res = batchReward({org_id,newReward}).then((res) => {
      if (res.status === 200) {
        setSuccessMessage(`The data has been sent`);
        setErrorMessage(""); 
      } else {
        setErrorMessage("Failed to send data. Please try again.");
      }
    });

    return res;
  };

  function handleDownloadTemplate() {
    const templateData = [
      {
        mobile: "0711223344",
        firstName: "John",
        lastName: "Doe" 
      },
      {
        mobile: "0722334455",
        firstName: "Jane",
        lastName: "Smith"
      },
    ];

    const csvData = convertToCsv(templateData);

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "contact_template.csv");
  }
  function convertToCsv(data) {
    const csvRows = [];
    const headers = Object.keys(data[0]);

    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => row[header]);
      csvRows.push(values.join(","));
    }
    return csvRows.join("\n");
  }

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

  useEffect(() => {
    async function fetchBalance() {
      const balanceData = await GetBalance(org_id);
      if (balanceData) {
        setBundles(balanceData.data.data);
      }
      const senderIdData = await GetActiveSenderId(org_id);
        if (senderIdData) {
          setSenderName(senderIdData.data);
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
              Send Batch Rewards
            </h3>
            <button
                  type="button"
                  className="bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  onClick={handleDownloadTemplate}
                >
                  Download CSV Template
                </button>
          </div>
          <div className="p-4 md:p-5">
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
            ) :(
            <form className="space-y-2" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="bundle"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Bundle Amount
                </label>
                <select
                  name="bundle"
                  id="bundle"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={selectedBundle}
                  onChange={(e) => setSelectedBundle(e.target.value)}
                  required
                >
                  <option value="">Select Bundle</option>
                  {bundles.map((bundle) => (
                    <option key={bundle.package} value={bundle.package}>
                      {bundle.module}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contacts"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Choose File
                </label>
                <input
                  type="file"
                  name="contacts"
                  id="contacts"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  onChange={(e) => setContactsFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="mb-4">
                      <label
                        htmlFor="bundle"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Select Sender Name
                      </label>
                      <select
                        name="bundle"
                        id="bundle"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={selectedSenderName}
                        onChange={(e) => setSelectedSenderName(e.target.value)}
                      >
                        <option value="">Select SenderName</option>
                        {/* <option value="1">PeakSMS</option> */}
                        {senderName?.map((senderid) => (
                          <option key={senderid.service_id} value={senderid.service_id}>
                            {senderid.sendername}
                          </option>
                        ))}
                      </select>
                </div>
                {
                      selectedSenderName ? 
                      <div className="mb-4">
                      <label
                        htmlFor="content"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Message to Customers
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Enter Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)} />
                    </div> : null

                    }
                  {errorMessage && (
                    <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
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
                      type="button"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      onClick={handleSubmit}
                    >
                      Submit
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

export default SendBatchRewardsModal;
