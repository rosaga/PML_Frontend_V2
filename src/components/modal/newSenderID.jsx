"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { saveAs } from "file-saver";
import { CreateSenderID } from "../../app/api/actions/senderId/senderId";

const NewSenderID = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [senderName, setSenderName] = useState("");
  const [authLetterfile, setAuthLetterfile] = useState(null);
  const [businessFile, setBusinessfile] = useState(null);
  const [channel, setChannel] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleDownloadTemplate() {
    const fileUrl = "/pdf/Sender_ID_request_letter.pdf"; 
    saveAs(fileUrl, "Sender_ID_request_letter.pdf"); 
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

  const handleSenderIDCreate = (e) => {
    e.preventDefault();

    if (!authLetterfile || !businessFile || !senderName) {
      console.log("Please select a file and a sender ID name");
      return;
    }

    const formValues = {
      org_id: org_id,
      name: senderName,
      authorizationLetter: authLetterfile,
      businessCertificate: businessFile,
      channel: channel,
    };

    CreateSenderID(formValues)
      .then((res) => {
        if (res.status === 201) {
          setSuccessMessage(`Request for SenderID has been submitted`);
          setErrorMessage("");
        } else {
          setErrorMessage("Failed to create request. Please try again.");
        }
      })
      .catch((error) => {
        console.log("Error:", error);
      });
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
                className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Sender ID
                </h3>
                <button
                  type="button"
                  className="end-2.5 bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  onClick={handleDownloadTemplate}
                >
                  Download  Template
                </button>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-2" onSubmit={handleSenderIDCreate}>
                  <div>
                    <label
                      htmlFor="senderName"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Sender ID Name
                    </label>
                    <input
                      type="text"
                      name="senderName"
                      id="senderName"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Sender ID Name"
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="channel"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Channel
                    </label>
                    <select
                      name="channel"
                      id="channel"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setChannel(e.target.value)}
                      required
                    >
                      <option value="">Select Channel</option>
                      <option value="SENDERNAME">Sendername</option>
                      <option value="SHORTCODE">Shortcode</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="authLetterfile"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Authorization Letter
                    </label>
                    <input
                      type="file"
                      name="authLetterfile"
                      id="authLetterfile"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setAuthLetterfile(e.target.files[0])}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="businessfile"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Business Certificate
                    </label>
                    <input
                      type="file"
                      name="businessfile"
                      id="businessfile"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setBusinessfile(e.target.files[0])}
                      required
                    />
                  </div>
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
                      type="submit"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    >
                      Submit
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

export default NewSenderID;
