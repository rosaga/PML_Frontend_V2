"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { contactsUploadBatch } from "../../../src/app/api/actions/contact/contact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveAs } from "file-saver";

const CSV_CHECKER_URL =
  process.env.NEXT_PUBLIC_CSV_CHECKER_URL || "https://csv-checker.netlify.app/";

const CSV_CHECKER_ORIGIN = new URL(CSV_CHECKER_URL).origin;

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

  const [isCsvCheckerOpen, setIsCsvCheckerOpen] = useState(false);
  const [isSendingToChecker, setIsSendingToChecker] = useState(false);

  const checkerIframeRef = useRef(null);
  const csvFileRef = useRef(null);
  const readyTimeoutRef = useRef(null);

  useEffect(() => {
    csvFileRef.current = csvFile;
  }, [csvFile]);

  const clearReadyTimeout = useCallback(() => {
    if (readyTimeoutRef.current) {
      window.clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }, []);

  const closeCsvChecker = useCallback(() => {
    clearReadyTimeout();
    setIsSendingToChecker(false);
    setIsCsvCheckerOpen(false);
  }, [clearReadyTimeout]);

  const handleProceedToCsvChecker = () => {
    if (!csvFileRef.current) {
      toast.error("Please select a CSV file first.");
      return;
    }

    setIsCsvCheckerOpen(true);
    clearReadyTimeout();

    readyTimeoutRef.current = window.setTimeout(() => {
      toast.error("CSV Checker didn’t respond. Please try again.");
      readyTimeoutRef.current = null;
    }, 12000);

    window.setTimeout(() => {
      try {
        const iframeWin = checkerIframeRef.current?.contentWindow;
        if (!iframeWin) return;

        iframeWin.postMessage(
          { type: "CSV_PARENT_INIT", parentOrigin: window.location.origin },
          CSV_CHECKER_ORIGIN
        );
      } catch (_) {}
    }, 50);
  };

  useEffect(() => {
    const onMessage = async (event) => {
      if (event.origin !== CSV_CHECKER_ORIGIN) return;

      const iframeWin = checkerIframeRef.current?.contentWindow;
      if (!iframeWin) return;
      if (event.source !== iframeWin) return;

      const data = event.data;
      if (!data?.type) return;

      if (data.type === "CSV_CHECKER_READY") {
        clearReadyTimeout();

        const file = csvFileRef.current;
        if (!file) return;

        try {
          setIsSendingToChecker(true);
          const buffer = await file.arrayBuffer();

          iframeWin.postMessage(
            {
              type: "CSV_FILE_BUFFER",
              name: file.name,
              mime: "text/csv",
              buffer,
              parentOrigin: window.location.origin,
            },
            CSV_CHECKER_ORIGIN,
            [buffer]
          );
        } catch (e) {
          toast.error("Failed to send file to CSV Checker.");
        } finally {
          setIsSendingToChecker(false);
        }
      }

      if (data.type === "CSV_CHECKER_FINISH" && data.buffer) {
        try {
          const rawName =
            data.name || csvFileRef.current?.name || "contacts.cleaned.csv";

          const safeName = rawName.toLowerCase().endsWith(".csv")
            ? rawName
            : `${rawName}.csv`;

          const cleanedFile = new File([data.buffer], safeName, {
            type: "text/csv",
          });

          setCsvFile(cleanedFile);
          setShowValidationErrors(false);
          setDuplicates([]);
          setInvalidPhoneNumbers([]);

          toast.success("CSV updated from Checker. You can now click Submit.");
          closeCsvChecker();
        } catch (e) {
          toast.error("Failed to receive cleaned CSV from Checker.");
        } finally {
          setIsSendingToChecker(false);
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [clearReadyTimeout, closeCsvChecker]);

  function handleDownloadTemplate() {
    const templateData = [
      { mobile: "0711223344", firstName: "John", lastName: "Doe" },
      { mobile: "0722334455", firstName: "Jane", lastName: "Smith" },
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

  const validateCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split("\n");
        const headers = lines[0].split(",");

        const mobileIndex = headers.findIndex(
          (header) =>
            header.trim().toLowerCase() === "mobile" ||
            header.trim().toLowerCase() === "phone" ||
            header.trim().toLowerCase() === "phonenumber"
        );

        if (mobileIndex === -1) {
          reject("CSV file must have a 'mobile' column");
          return;
        }

        const duplicatePhones = new Set();
        const uniquePhones = new Set();
        const invalidPhones = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",");
          const phoneNumber = values[mobileIndex].trim();

          const digitsOnly = phoneNumber.replace(/\D/g, "");
          if (digitsOnly.length < 9) {
            invalidPhones.push({ line: i + 1, phone: phoneNumber });
            continue;
          }

          if (uniquePhones.has(phoneNumber)) {
            duplicatePhones.add(phoneNumber);
          } else {
            uniquePhones.add(phoneNumber);
          }
        }

        if (invalidPhones.length > 0 || duplicatePhones.size > 0) {
          setInvalidPhoneNumbers(invalidPhones);
          setDuplicates(Array.from(duplicatePhones));
          setShowValidationErrors(true);
          reject({
            invalidPhones,
            duplicates: Array.from(duplicatePhones),
          });
        } else {
          resolve(file);
        }
      };

      reader.onerror = () => {
        reject("Error reading the CSV file");
      };

      reader.readAsText(file);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Please select a CSV file");
      setCsvFile(null);
      return;
    }

    const normalized = new File([file], file.name, { type: "text/csv" });

    setCsvFile(normalized);
    setErrorMessage("");
    setShowValidationErrors(false);
    setDuplicates([]);
    setInvalidPhoneNumbers([]);
  };

  const handleUploadContacts = (e) => {
    e.preventDefault();

    if (!csvFile) {
      setErrorMessage("Please select a file");
      return;
    }

    setLoading(true);

    validateCsvFile(csvFile)
      .then((validatedFile) => {
        const formValues = {
          org_id: org_id,
          contacts: validatedFile,
        };

        return contactsUploadBatch(formValues);
      })
      .then((res) => {
        if (res.status === 201) {
          toast.success("CONTACTS UPLOAD SUCCESS");
          setSuccessMessage("Contacts Upload Successful");
          setErrorMessage("");
          setShowValidationErrors(false);
        } else {
          toast.error("CONTACTS UPLOAD FAILED");
          setErrorMessage("Contacts upload failed. Please try again.");
        }
      })
      .catch((error) => {
        if (error?.invalidPhones || error?.duplicates) {
          return;
        }

        if (error?.response && error.response.status === 400) {
          setErrorMessage("Wrong file type selected. Please use CSV format.");
        } else {
          console.log("Error:", error);
          setErrorMessage("Contacts upload failed. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") {
        closeCsvChecker();
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal, closeCsvChecker]);

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
            ) : errorMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-red-500">
                  Oops!
                </div>
                <div className="mb-4 text-gray-900 dark:text-white">
                  {errorMessage}
                </div>
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
                  <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Upload Recipients
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
                          onChange={handleFileChange}
                          accept=".csv"
                          required
                        />

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            You can validate & clean your CSV before uploading.
                          </p>

                          <button
                            type="button"
                            onClick={handleProceedToCsvChecker}
                            disabled={!csvFile || loading}
                            className={`inline-flex items-center gap-2 text-sm font-medium
                              ${
                                csvFile && !loading
                                  ? "text-orange-500 hover:text-orange-600"
                                  : "text-gray-300 cursor-not-allowed"
                              }
                            `}
                          >
                            <span className="underline underline-offset-4">
                              Proceed to CSV Checker
                            </span>

                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                              BETA
                            </span>

                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* the validation errors */}
                      {showValidationErrors && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="text-red-600 font-medium mb-2">
                            We found some issues with your file!
                          </h4>

                          {invalidPhoneNumbers.length > 0 && (
                            <div className="mb-2">
                              <p className="text-red-500 text-sm font-medium">
                                Found {invalidPhoneNumbers.length} phone numbers
                                with less than 9 digits:
                              </p>
                              <ul className="list-disc list-inside text-xs text-red-500 ml-2">
                                {invalidPhoneNumbers
                                  .slice(0, 5)
                                  .map((item, index) => (
                                    <li key={index}>
                                      Line {item.line}: {item.phone}
                                    </li>
                                  ))}
                                {invalidPhoneNumbers.length > 5 && (
                                  <li>
                                    ...and {invalidPhoneNumbers.length - 5} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {duplicates.length > 0 && (
                            <div>
                              <p className="text-red-500 text-sm font-medium">
                                Found {duplicates.length} duplicate phone
                                numbers:
                              </p>
                              <ul className="list-disc list-inside text-xs text-red-500 ml-2">
                                {duplicates.slice(0, 5).map((phone, index) => (
                                  <li key={index}>{phone}</li>
                                ))}
                                {duplicates.length > 5 && (
                                  <li>...and {duplicates.length - 5} more</li>
                                )}
                              </ul>
                            </div>
                          )}

                          <p className="text-sm text-red-500 mt-2">
                            Please correct these issues before uploading.
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-4">
                        <button
                          type="button"
                          className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                          onClick={() => {
                            closeCsvChecker();
                            closeModal();
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                          onClick={handleUploadContacts}
                          disabled={loading}
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

      {/* CSV Checker Modal */}
      {isCsvCheckerOpen && (
        <div
          id="csv-checker-modal-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center w-full h-screen bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target.id === "csv-checker-modal-overlay") closeCsvChecker();
          }}
        >
          <div className="relative w-full max-w-5xl max-h-full">
            <div className="bg-white rounded-lg shadow dark:bg-gray-700 overflow-hidden relative">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    CSV Checker
                  </h3>

                  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                    BETA
                  </span>

                  {isSendingToChecker && (
                    <span className="ml-3 inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-200">
                      <svg
                        className="h-4 w-4 animate-spin text-orange-500"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Sending file to checker…
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={closeCsvChecker}
                  className="px-4 py-1 text-sm font-medium text-orange-400 border border-orange-400 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  Close
                </button>
              </div>

              <div className="h-[75vh]">
                <iframe
                  ref={checkerIframeRef}
                  src={CSV_CHECKER_URL}
                  className="h-full w-full"
                  title="CSV Checker"
                  onLoad={() => {
                    try {
                      checkerIframeRef.current?.contentWindow?.postMessage(
                        {
                          type: "CSV_PARENT_INIT",
                          parentOrigin: window.location.origin,
                        },
                        CSV_CHECKER_ORIGIN
                      );
                    } catch (_) {}
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadRecipientsModal;
