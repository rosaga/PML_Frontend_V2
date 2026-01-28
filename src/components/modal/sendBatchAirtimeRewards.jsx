"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { sendAirtimeReward } from "@/app/api/actions/airtimeReward/airtimeReward";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { sendSms } from "../../app/api/actions/messages/messagesAction";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CSV_CHECKER_URL =
  process.env.NEXT_PUBLIC_CSV_CHECKER_URL || "https://csv-checker.netlify.app/";

const CSV_CHECKER_ORIGIN = new URL(CSV_CHECKER_URL).origin;

const SendAirtimeBatchRewardsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [message, setMessage] = useState("");
  const [contactsFile, setContactsFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSenderName, setSelectedSenderName] = useState("");
  const [senderName, setSenderName] = useState([]);

  const [isCsvCheckerOpen, setIsCsvCheckerOpen] = useState(false);
  const [isSendingToChecker, setIsSendingToChecker] = useState(false);

  const checkerIframeRef = useRef(null);
  const contactsFileRef = useRef(null);
  const readyTimeoutRef = useRef(null);

  useEffect(() => {
    contactsFileRef.current = contactsFile;
  }, [contactsFile]);

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
    if (!contactsFileRef.current) {
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

        const file = contactsFileRef.current;
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
            data.name || contactsFileRef.current?.name || "contacts.cleaned.csv";

          const safeName = rawName.toLowerCase().endsWith(".csv")
            ? rawName
            : `${rawName}.csv`;

          const cleanedFile = new File([data.buffer], safeName, {
            type: "text/csv",
          });

          setContactsFile(cleanedFile);
          setErrorMessage("");

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

  function handleDownloadTemplate() {
    const templateData = [
      { mobile: "0711223344", firstName: "John", lastName: "Doe" },
      { mobile: "0722334455", firstName: "Jane", lastName: "Smith" },
    ];
    const csvData = convertToCsv(templateData);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "contact_template.csv");
  }

  const parseCsvFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split("\n").filter((line) => line.trim() !== "");
        if (rows.length < 2) {
          return reject(
            new Error("CSV file must have a header and at least one row.")
          );
        }
        const contacts = rows.slice(1).map((row) => {
          const columns = row.split(",");
          return {
            mobile: columns[0]?.trim(),
            firstName: columns[1]?.trim(),
            lastName: columns[2]?.trim(),
          };
        });
        resolve(contacts);
      };
      reader.onerror = () => reject(new Error("Failed to read the file"));
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactsFile) {
      setErrorMessage("Please select a valid file.");
      return;
    }

    try {
      const parsedContacts = await parseCsvFile(contactsFile);

      if (parsedContacts.length === 0) {
        setErrorMessage("CSV file is empty or improperly formatted.");
        return;
      }

      for (const contact of parsedContacts) {
        const rewardPayload = {
          request_id: uuidv4(),
          airtime_amount: String(selectedBundle),
          msisdn: String(contact.mobile).trim().startsWith("0")
            ? String(contact.mobile).trim()
            : `0${String(contact.mobile).trim()}`,
          sender_id: parseInt(selectedSenderName),
          message: message,
          postpay: true,
        };

        console.log(
          "Sending reward payload:",
          JSON.stringify(rewardPayload, null, 2)
        );
        const res = await sendAirtimeReward({
          org_id,
          newReward: rewardPayload,
        });
        console.log("Response for", contact.mobile, ":", res.data);

        if (res.status === 200 && rewardPayload.sender_id) {
          const smsPayload = {
            destination: rewardPayload.msisdn,
            content: message,
            requestid: rewardPayload.request_id,
            scheduled: new Date().toISOString(),
            channel: "SENDERNAME",
            organization_id: org_id,
          };

          const smsRes = await sendSms({
            selectedSenderId: rewardPayload.sender_id,
            newSms: smsPayload,
          });
          console.log("SMS Response for", contact.mobile, ":", smsRes.data);
        }
      }

      setSuccessMessage("The batch airtime rewards have been sent successfully.");
      setErrorMessage("");
    } catch (error) {
      console.error("Batch reward error:", error);
      setErrorMessage("An error occurred while processing batch rewards.");
    }
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

  useEffect(() => {
    async function fetchBalance() {
      const balanceData = await GetBalance(org_id);
      if (balanceData) {
        setBundles(balanceData.data.data);
      }
      const senderIdData = await GetActiveSenderId(org_id);
      if (senderIdData) {
        setSenderName(senderIdData.data);
      }
    }
    fetchBalance();
  }, [org_id]);

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Send Batch Airtime
            </h3>
            <button
              type="button"
              className="bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={handleDownloadTemplate}
            >
              Download CSV Template
            </button>
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
              <form className="space-y-2" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="airtime"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Airtime Amount
                  </label>
                  <select
                    id="airtime"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={selectedBundle}
                    onChange={(e) => setSelectedBundle(e.target.value)}
                  >
                    <option value="">Select airtime amount</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
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
                    onChange={(e) =>
                      setContactsFile(e.target.files ? e.target.files[0] : null)
                    }
                    accept=".csv"
                    required
                  />

                  {/* CSV Checker */}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      You can validate & clean your CSV before sending.
                    </p>

                    <button
                      type="button"
                      onClick={handleProceedToCsvChecker}
                      disabled={!contactsFile}
                      className={`inline-flex items-center gap-2 text-sm font-medium
                        ${
                          contactsFile
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

                <div className="mb-4">
                  <label
                    htmlFor="bundle"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Sender Name
                  </label>
                  <select
                    name="bundle"
                    id="bundle"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={selectedSenderName}
                    onChange={(e) => setSelectedSenderName(e.target.value)}
                  >
                    <option value="">Select Sender Name</option>
                    {senderName?.map((senderid) => (
                      <option
                        key={senderid.service_id}
                        value={senderid.service_id}
                      >
                        {senderid.sendername}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSenderName && (
                  <div className="mb-4">
                    <label
                      htmlFor="content"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Message to Customers
                    </label>
                    <textarea
                      name="content"
                      id="content"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Enter Message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                )}

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
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </form>
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
    </div>
  );
};

export default SendAirtimeBatchRewardsModal;
