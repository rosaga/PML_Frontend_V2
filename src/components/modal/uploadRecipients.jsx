"use client";
import React, { useEffect } from "react";

const UploadRecipientsModal = ({ closeModal }) => {
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

      
  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="p-4 md:p-5">
            <form className="space-y-2" action="#">
              <div className="flex items-center justify-between mb-4">
                <label
                  htmlFor="email"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Upload CSV File
                </label>
                <button
                  type="button"
                  className="bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  onClick={handleDownloadTemplate}
                >
                  Download CSV Template
                </button>
              </div>
              <input
                type="file"
                name="file"
                id="file"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="robina"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  onClick={closeModal}
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

export default UploadRecipientsModal;
