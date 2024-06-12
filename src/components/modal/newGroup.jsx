"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";

const NewGroupModal = ({ closeModal }) => {
  const [groupName, setGroupName] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [description, setDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  let token = getToken();

  const handleRequest = async () => {
    try {
      const groupResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/group`,
        JSON.stringify({
          name: groupName,
          description: description,
          organization_id: process.env.NEXT_PUBLIC_ORG_ID,
        }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const groupId = groupResponse.data.id;

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("contacts", csvFile);
      formData.append("group_id", groupId);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/contact/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccessMessage(`The group ${groupName} has been created and CSV file uploaded successfully.`);
      setErrorMessage("");  // Clear any previous error messages
    } catch (error) {
      console.error("Error Creating Group or Uploading CSV File", error);
      setErrorMessage("Failed to create group or upload CSV file. Please try again.");
      setSuccessMessage("");  // Clear any previous success messages
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
                className="w-full text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                OK
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  New Group
                </h3>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-2" action="#">
                  <div>
                    <label
                      htmlFor="groupName"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Group Name
                    </label>
                    <input
                      type="text"
                      name="groupName"
                      id="groupName"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Group 1"
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="csvFile"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      name="csvFile"
                      id="csvFile"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setCsvFile(e.target.files[0])}
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
                      placeholder="Description for the Group"
                      onChange={(e) => setDescription(e.target.value)}
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
                      type="button"
                      className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      onClick={handleRequest}
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

export default NewGroupModal;
