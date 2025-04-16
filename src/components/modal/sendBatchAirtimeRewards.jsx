"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { sendAirtimeReward } from "@/app/api/actions/airtimeReward/airtimeReward";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { sendSms } from "../../app/api/actions/messages/messagesAction";


const SendAirtimeBatchRewardsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [message, setMessage] = useState("");
  const [contactsFile, setContactsFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSenderName, setSelectedSenderName] = useState("");
  const [senderName, setSenderName] = useState([]);

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

  function handleDownloadTemplate() {
    const templateData = [
      { mobile: "0711223344", firstName: "John", lastName: "Doe" },
      { mobile: "0722334455", firstName: "Jane", lastName: "Smith" },
    ];
    const csvData = convertToCsv(templateData);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "contact_template.csv");
  }

  const parseCsvFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split("\n").filter((line) => line.trim() !== "");
        if (rows.length < 2) {
          return reject(new Error("CSV file must have a header and at least one row."));
        }
        const contacts = rows.slice(1).map((row) => {
          const columns = row.split(",");
          return {
            mobile: columns[0]?.trim(),
            firstName: columns[1]?.trim(),
            lastName: columns[2]?.trim(),
          };
        });
        resolve(contacts);
      };
      reader.onerror = () => reject(new Error("Failed to read the file"));
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactsFile) {
      setErrorMessage("Please select a valid file.");
      return;
    }

    try {
      const parsedContacts = await parseCsvFile(contactsFile);

      if (parsedContacts.length === 0) {
        setErrorMessage("CSV file is empty or improperly formatted.");
        return;
      }

      for (const contact of parsedContacts) {
        const rewardPayload = {
          request_id: uuidv4(),
          airtime_amount: String(selectedBundle),
          msisdn: String(contact.mobile).trim().startsWith("0")
            ? String(contact.mobile).trim()
            : `0${String(contact.mobile).trim()}`,
          sender_id: parseInt(selectedSenderName),
          message: message,
          postpay: true,
        };

        console.log("Sending reward payload:", JSON.stringify(rewardPayload, null, 2));
        const res = await sendAirtimeReward({ org_id, newReward: rewardPayload });
        console.log("Response for", contact.mobile, ":", res.data);

        if (res.status === 200 && rewardPayload.sender_id) {
          const smsPayload = {
            destination: rewardPayload.msisdn,
            content: message,
            requestid: rewardPayload.request_id,
            scheduled: new Date().toISOString(),
            channel: "SENDERNAME",
            organization_id: org_id,
          };

          const smsRes = await sendSms({
            selectedSenderId: rewardPayload.sender_id,
            newSms: smsPayload,
          });
          console.log("SMS Response for", contact.mobile, ":", smsRes.data);
        }
      }

      setSuccessMessage("The batch airtime rewards have been sent successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Batch reward error:", error);
      setErrorMessage("An error occurred while processing batch rewards.");
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
  }, [org_id]);

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
              Send Batch Airtime
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
            ) : (
              <form className="space-y-2" onSubmit={handleSubmit}>
 <div>
                    <label
                      htmlFor="airtime"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Airtime Amount
                    </label>
                    <select
                      id="airtime"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      value={selectedBundle}
                      onChange={(e) => setSelectedBundle(e.target.value)}
                    >
                      <option value="">Select airtime amount</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="250">250</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
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
                    onChange={(e) =>
                      setContactsFile(e.target.files ? e.target.files[0] : null)
                    }
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
                    <option value="">Select Sender Name</option>
                    {senderName?.map((senderid) => (
                      <option key={senderid.service_id} value={senderid.service_id}>
                        {senderid.sendername}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSenderName && (
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
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                )}
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

export default SendAirtimeBatchRewardsModal;
