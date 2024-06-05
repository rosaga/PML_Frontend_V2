"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";

const SendBatchRewardsModal = ({ closeModal }) => {
  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [message, setMessage] = useState("");
  const [contactsFile, setContactsFile] = useState(null);
  let token = getToken();

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
    fetchBundles();
  }, []);
  const fetchBundles = async () => {
    if (!token) return;
    try {

      const bundlesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBundles(bundlesResponse.data);
    } catch (error) {
      console.error("Error fetching contacts or bundles:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("bundle", selectedBundle);
    formData.append("message", message);
    formData.append("contacts", contactsFile);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/batchreward`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      closeModal(); // Close the modal after successful submission
    } catch (error) {
      console.error("Error submitting form:", error);
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
              Send Batch Rewards
            </h3>
          </div>
          <div className="p-4 md:p-5">
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
                      {bundle.package}
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
              <div>
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Enter Message to Customer"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                  type="submit"
                  className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
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

export default SendBatchRewardsModal;
