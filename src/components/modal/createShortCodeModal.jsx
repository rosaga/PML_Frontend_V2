"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";

const CreateShortCodeModal = ({ closeModal }) => {
  const [shortCodeName, setShortCodeName] = useState("");
  const [selectType, setSelectType] = useState("");
  const [businessCertificate, setBusinessCertificate] = useState(null);
  const [authorizationLetter, setAuthorizationLetter] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleFileChange = (event, setFile) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("short_code_name", shortCodeName);
    formData.append("select_type", selectType);
    formData.append("business_certificate", businessCertificate);
    formData.append("authorization_letter", authorizationLetter);

    try {
      const token = getToken();
      const response = await axios.post(
        "/api/short-code", // Adjust this endpoint as needed
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setSuccessMessage("Short code created successfully.");
        setErrorMessage("");
        closeModal();
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to create short code. Please try again.");
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
                className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                Create Short Code
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="select_type"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Type
                  </label>
                  <select
                    id="select_type"
                    name="select_type"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={selectType}
                    onChange={(e) => setSelectType(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose a type
                    </option>
                    <option value="Type 1">Type 1</option>
                    <option value="Type 2">Type 2</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="short_code_name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Short Code Name
                  </label>
                  <input
                    type="text"
                    id="short_code_name"
                    name="short_code_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Enter Short Code Name"
                    value={shortCodeName}
                    onChange={(e) => setShortCodeName(e.target.value)}
                    required
                  />
                </div>
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
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) =>
                      handleFileChange(e, setBusinessCertificate)
                    }
                    required
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
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) =>
                      handleFileChange(e, setAuthorizationLetter)
                    }
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
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

export default CreateShortCodeModal;
