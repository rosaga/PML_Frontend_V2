"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { saveAs } from 'file-saver';

const CreateChannelModal = ({ closeModal }) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("");
  const [shortcode, setShortcode] = useState("");
  const [businessCertificate, setBusinessCertificate] = useState(null);
  const [authorizationLetter, setAuthorizationLetter] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Save organization ID from localStorage
  let organization_id = null;
  if (typeof window !== 'undefined') {
    organization_id = localStorage.getItem('selectedAccountId');
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

  const handleDownloadTemplate = (filename) => {
    const fileUrl = `/pdf/${filename}`;
    saveAs(fileUrl, filename);
  };

  const handleFileChange = (event, setFile) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare payload based on selected channel type
    const payload = {
      type: channelType,
      shortcode: shortcode,
      organization_id: organization_id,
      // name: channelName
    };

    try {
      const token = getToken();
      const response = await axios.post(
        "https://flowbot-1048592730476.europe-west4.run.app/api/v2/channels",
        payload,
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        setSuccessMessage("Channel created successfully.");
        setErrorMessage("");
        setTimeout(() => {
          closeModal();
        }, 2000);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error.response?.data?.message || "Failed to create channel. Please try again.";
      setErrorMessage(errorMsg);
    }
  };

  // Get appropriate label and placeholder based on channel type
  const getInputDetails = () => {
    switch (channelType) {
      case "SHORTCODE":
      case "USSD":
        return {
          label: "Shortcode",
          placeholder: "Enter Shortcode (e.g., 23434)",
          required: true
        };
      case "WHATSAPP":
        return {
          label: "Phone Number",
          placeholder: "Enter WhatsApp Phone Number (e.g., +254712345678)",
          required: true
        };
      case "SMS":
        return {
          label: "SMS ID",
          placeholder: "Enter SMS ID",
          required: true
        };
      default:
        return {
          label: "Channel ID",
          placeholder: "Enter Channel ID",
          required: false
        };
    }
  };

  // Show input field if channel type is selected
  const showInputField = channelType !== "";
  const inputDetails = getInputDetails();

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button
            onClick={() => handleDownloadTemplate("Sender_ID_request_letter.docx")}
            className="absolute top-4 right-4 bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Template</span>
          </button>

          {successMessage ? (
            <div className="p-4 text-center">
              <div className="mb-4 text-2xl font-semibold text-green-500">
                Success!
              </div>
              <div className="mb-4 text-gray-900 dark:text-white">
                {successMessage}
              </div>
              <button
                onClick={closeModal}
                className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="p-4 md:p-5">
              {/* Orange Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center">
                  <i className="text-white text-lg font-bold">i</i>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Create Channel
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="channel_name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Channel Name
                  </label>
                  <input
                    type="text"
                    id="channel_name"
                    name="channel_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Enter Channel Name"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="channel_type"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Channel Type
                  </label>
                  <select
                    id="channel_type"
                    name="channel_type"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose a type
                    </option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SHORTCODE">Shortcode</option>
                    <option value="USSD">USSD</option>
                  </select>
                </div>
                
                {showInputField && (
                  <div className="mb-4">
                    <label
                      htmlFor="shortcode"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {inputDetails.label}
                    </label>
                    <input
                      type="text"
                      id="shortcode"
                      name="shortcode"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder={inputDetails.placeholder}
                      value={shortcode}
                      onChange={(e) => setShortcode(e.target.value)}
                      required={inputDetails.required}
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label
                    htmlFor="business_certificate"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Business Certificate
                  </label>
                  <input
                    type="file"
                    id="business_certificate"
                    name="business_certificate"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                    onChange={(e) => handleFileChange(e, setBusinessCertificate)}
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="authorization_letter"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Authorization Letter
                  </label>
                  <input
                    type="file"
                    id="authorization_letter"
                    name="authorization_letter"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                    onChange={(e) => handleFileChange(e, setAuthorizationLetter)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Submit
                  </button>
                </div>
                {errorMessage && (
                  <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;