"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";

const SendDataRewardModal = ({ closeModal }) => {
  const [contacts, setContacts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  let token = getToken();

  const { v4: uuidv4 } = require('uuid');

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
    fetchContactsAndBundles();
  }, []);

  const fetchContactsAndBundles = async () => {
    if (!token) return;

    try {
      const contactsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/contact/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setContacts(contactsResponse.data);

      const bundlesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBundles(bundlesResponse.data);
    } catch (error) {
      console.error("Error fetching contacts or bundles:", error);
    }
  };

  const handleRequest = async () => {
    if (!selectedContact || !selectedBundle) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/reward`,
        {
          mobile_no: selectedContact,
          bundle_amount: selectedBundle,
          request_id: uuidv4()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccessMessage("Data reward sent successfully.");
      setErrorMessage(""); // Clear any previous error messages
    } catch (error) {
      console.error("Error sending data reward:", error);
      setErrorMessage("Failed to send data reward. Please try again.");
      setSuccessMessage(""); // Clear any previous success messages
    }
  };

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
              Send Data Rewards
            </h3>
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
              <>
                <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Mobile Number
                    </label>
                    <select
                      name="mobile"
                      id="mobile"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setSelectedContact(e.target.value)}
                      required
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.mobile_no} value={contact.mobile_no}>
                          {contact.firstname} {contact.lastname} ({contact.mobile_no})
                        </option>
                      ))}
                    </select>
                  </div>
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
                      onChange={(e) => setSelectedBundle(e.target.value)}
                      required
                    >
                      <option value="">Select a bundle</option>
                      {bundles.map((bundle) => (
                        <option key={bundle.package} value={bundle.package}>
                          {bundle.package}
                        </option>
                      ))}
                    </select>
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
                      type="button"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      onClick={handleRequest}
                    >
                      Submit
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

export default SendDataRewardModal;
