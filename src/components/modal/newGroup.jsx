"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { saveAs } from "file-saver";
import { contactsUpload } from '../../../src/app/api/actions/contact/contact';

const NewGroupModal = ({ closeModal }) => {

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [groupName, setGroupName] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [description, setDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleGroupCreate = (e) => {
    e.preventDefault();
  
    if (!csvFile) {
      console.log('Please select a file and a group');
      return;
    }
  
    const formValues = {
      org_id: org_id,
      description: description,
      name: groupName,
      contacts: csvFile,
    };
  
    const res = contactsUpload(formValues)
      .then((res) => {
        if (res.status === 201) {
          setSuccessMessage(`The group has been created`);
          setErrorMessage("");
        } else {
          setErrorMessage("Failed to create group. Please try again.");
        }
      })
      .catch((error) => {
        console.log("Error:", error);
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
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              New Group
            </h3>
            <button
              type="button"
              className="end-2.5 bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={handleDownloadTemplate}           
            >
              Download CSV Template
            </button>
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
                      onClick={handleGroupCreate}
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
