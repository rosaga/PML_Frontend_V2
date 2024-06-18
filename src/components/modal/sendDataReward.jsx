"use client";
import React, { useEffect, useState } from "react";
import { fetchContacts } from "@/app/api/actions/contact/contact";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { sendReward } from "@/app/api/actions/reward/reward";

const SendDataRewardModal = ({ closeModal }) => {

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [selectedContact, setSelectedContact] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { v4: uuidv4 } = require('uuid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState('');

  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchAndSetContacts = async () => {
        const contacts = await fetchContacts(searchQuery, org_id);
        setFilteredContacts(contacts);
        setShowDropdown(true);
      };
      fetchAndSetContacts();
    } else {
      setFilteredContacts([]);
      setShowDropdown(false);
    }
  }, [searchQuery, org_id]);

  const handleSelect = (contact) => {
    setSelectedContact(contact.mobile_no);
    setSearchQuery(contact.mobile_no);
    setShowDropdown(false);
  };

  const handleSend = (e) => {
    e.preventDefault();

    const newReward = {
      request_id: uuidv4(),
      bundle_amount: selectedBundle,
      msisdn : selectedContact,
    };

    const res = sendReward({org_id,newReward}).then((res) => {
      if (res.status === 200) {
        setSuccessMessage(`The data has been sent`);
        setErrorMessage(""); 
      } else {
        setErrorMessage("Failed to send data. Please try again.");
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
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Search for a contact"
                    />
                    {showDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1">
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map((contact) => (
                            <div
                              key={contact.mobile_no}
                              className="p-2 cursor-pointer hover:bg-gray-200"
                              onClick={() => handleSelect(contact)}
                            >
                              {contact.metadata.FIRSTNAME} {contact.metadata.LASTNAME} ({contact.mobile_no})
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">No contacts found</div>
                        )}
                      </div>
                    )}
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
                        <option key={bundle.id} value={bundle.module}>
                          {bundle.module}
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
                      onClick={handleSend}
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
