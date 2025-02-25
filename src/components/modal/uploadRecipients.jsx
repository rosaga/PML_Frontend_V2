"use client";
import React, { useEffect, useState } from "react";
import { contactsUploadBatch } from "../../../src/app/api/actions/contact/contact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Papa from "papaparse";
import { saveAs } from "file-saver";

const UploadRecipientsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [csvFile, setCsvFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [invalidPhoneNumbers, setInvalidPhoneNumbers] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  function handleDownloadTemplate() {
    const templateData = [
      {
        mobile: "0711223344",
        firstName: "John",
        lastName: "Doe",
      },
      {
        mobile: "0722334455",
        firstName: "Jane",
        lastName: "Smith",
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Ensure file is a CSV
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are allowed.");
      setErrorMessage("Only CSV files are allowed.");
      return;
    }

    setCsvFile(file);
    setShowValidationErrors(false);
    setDuplicates([]);
    setInvalidPhoneNumbers([]);
    setErrorMessage("");

    validateCsvFile(file);
  };

  const validateCsvFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, meta } = results;
        
        const headers = meta.fields;
        if (!headers.includes("mobile") || !headers.includes("firstName") || !headers.includes("lastName")) {
          toast.error("CSV file is missing required headers: 'mobile', 'firstName', 'lastName'.");
          setErrorMessage("CSV file is missing required headers.");
          return;
        }

        const duplicatePhones = [];
        const uniquePhones = new Set();
        const invalidPhones = [];
        
        data.forEach((row, index) => {
          const { mobile, firstName, lastName } = row;
          
          if (!mobile || !firstName || !lastName) {
            toast.error(`Row ${index + 1}: Missing required fields.`);
            return;
          }
          
          const digitsOnly = mobile.replace(/\D/g, '');
          if (digitsOnly.length < 9) {
            invalidPhones.push({ line: index + 1, phone: mobile });
          }
          
          if (uniquePhones.has(mobile)) {
            if (!duplicatePhones.includes(mobile)) {
              duplicatePhones.push(mobile);
            }
          } else {
            uniquePhones.add(mobile);
          }
        });
        
        if (invalidPhones.length > 0 || duplicatePhones.length > 0) {
          setInvalidPhoneNumbers(invalidPhones);
          setDuplicates(duplicatePhones);
          setShowValidationErrors(true);
        }
      },
      error: (error) => {
        toast.error("Error parsing CSV file: " + error.message);
        setErrorMessage("Error parsing CSV file: " + error.message);
      }
    });
  };

  const handleUploadContacts = (e) => {
    e.preventDefault();

    if (!csvFile) {
      toast.error("Please select a CSV file.");
      return;
    }

    if (invalidPhoneNumbers.length > 0 || duplicates.length > 0) {
      toast.error("Please fix the validation issues before uploading.");
      return;
    }

    setLoading(true);

    Papa.parse(csvFile, {
      complete: async (result) => {
        const csvData = result.data;
        const headers = csvData[0];

        if (!headers.includes("mobile") || !headers.includes("firstName") || !headers.includes("lastName")) {
          toast.error("CSV file is missing required headers: 'mobile', 'firstName', 'lastName'.");
          setErrorMessage("CSV file is missing required headers.");
          setLoading(false);
          return;
        }

        const contacts = csvData.slice(1)
          .filter(row => row.length >= 3 && row[0]?.trim())
          .map((row) => ({
            mobile: row[0]?.trim(),
            firstName: row[1]?.trim() || "",
            lastName: row[2]?.trim() || "",
          }));

        if (contacts.length === 0) {
          toast.error("No valid contacts found in the CSV.");
          setErrorMessage("No valid contacts found in the CSV.");
          setLoading(false);
          return;
        }

        const formValues = {
          org_id: org_id,
          contacts,
        };

        try {
          const res = await contactsUploadBatch(formValues);
          if (res.status === 201) {
            toast.success("Contacts Upload Successful");
            setSuccessMessage("Contacts Upload Successful");
          } else {
            toast.error("Contacts Upload Failed");
            setErrorMessage("Contacts Upload Failed.");
          }
        } catch (error) {
          if (error.response && error.response.status === 400) {
            toast.error("Invalid CSV file format.");
            setErrorMessage("Invalid CSV file format.");
          } else {
            toast.error("Contacts Upload Failed");
            setErrorMessage("Contacts Upload Failed.");
          }
        }

        setLoading(false);
      },
      header: true,
      skipEmptyLines: true,
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
    <>
      <ToastContainer />
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
                <div className="mb-4 text-2xl font-semibold text-green-500">Success!</div>
                <div className="mb-4 text-gray-900 dark:text-white">{successMessage}</div>
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
            ) : errorMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-red-500">Oops!</div>
                <div className="mb-4 text-gray-900 dark:text-white">{errorMessage}</div>
                <button
                  onClick={() => {
                    setErrorMessage("");
                  }}
                  className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="relative p-4 w-full max-w-2xl max-h-full">
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                  <div className="p-4 md:p-5">
                    <form className="space-y-2" action="#">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xl font-semibold text-gray-900 dark:text-white">Upload CSV File</label>
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
                        name="csvFile"
                        id="csvFile"
                        accept=".csv"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        onChange={handleFileChange}
                        required
                      />
                      
                      {/* validation errors */}
                      {showValidationErrors && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="text-red-600 font-medium mb-2">We found some issues with your file!</h4>
                          
                          {invalidPhoneNumbers.length > 0 && (
                            <div className="mb-2">
                              <p className="text-red-500 text-sm font-medium">Found {invalidPhoneNumbers.length} phone numbers with less than 9 digits:</p>
                              <ul className="list-disc list-inside text-xs text-red-500 ml-2">
                                {invalidPhoneNumbers.slice(0, 5).map((item, index) => (
                                  <li key={index}>Line {item.line}: {item.phone}</li>
                                ))}
                                {invalidPhoneNumbers.length > 5 && <li>...and {invalidPhoneNumbers.length - 5} more</li>}
                              </ul>
                            </div>
                          )}
                          
                          {duplicates.length > 0 && (
                            <div>
                              <p className="text-red-500 text-sm font-medium">Found {duplicates.length} duplicate phone numbers:</p>
                              <ul className="list-disc list-inside text-xs text-red-500 ml-2">
                                {duplicates.slice(0, 5).map((phone, index) => (
                                  <li key={index}>{phone}</li>
                                ))}
                                {duplicates.length > 5 && <li>...and {duplicates.length - 5} more</li>}
                              </ul>
                            </div>
                          )}
                          
                          <p className="text-sm text-red-500 mt-2">Please correct these issues before uploading.</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 mt-4">
                        <button 
                          type="button" 
                          className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800" 
                          onClick={closeModal}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800" 
                          onClick={handleUploadContacts} 
                          disabled={loading || showValidationErrors}
                        >
                          {loading ? "Uploading..." : "Submit"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadRecipientsModal;