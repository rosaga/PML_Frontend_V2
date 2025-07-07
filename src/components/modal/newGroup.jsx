"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { saveAs } from "file-saver";
import { contactsUpload } from "@/app/api/actions/contact/contact";
import { ToastContainer, toast } from "react-toastify";

const NewGroupModal = ({ closeModal }) => {
  const router   = useRouter();
  const pathname = usePathname();
  const [, , service] = pathname.split("/");

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }
  const [groupName, setGroupName]               = useState("");
  const [csvFile, setCsvFile]                   = useState(null);
  const [description, setDescription]           = useState("");
  const [successMessage, setSuccessMessage]     = useState("");
  const [errorMessage, setErrorMessage]         = useState("");
  const [duplicates, setDuplicates]             = useState([]);
  const [invalidPhoneNumbers, setInvalidPhoneNumbers] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleDownloadTemplate = () => {
    const templateData = [
      { mobile: "0711223344", firstName: "John",  lastName: "Doe"   },
      { mobile: "0722334455", firstName: "Jane",  lastName: "Smith" },
    ];
    const csvRows = [
      Object.keys(templateData[0]).join(","),
      ...templateData.map(row => Object.values(row).join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "contact_template.csv");
  };

  const validateCsvFile = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const lines = event.target.result.split("\n");
      const headers = lines[0].split(",");
      const mobileIndex = headers.findIndex(h =>
        ["mobile","phone","phonenumber"].includes(h.trim().toLowerCase())
      );
      if (mobileIndex === -1) {
        reject("CSV file must have a 'mobile' column");
        return;
      }
      const dupSet = new Set(), uniqSet = new Set(), invalids = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const phone = lines[i].split(",")[mobileIndex].trim();
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 9) {
          invalids.push({ line: i+1, phone });
        } else if (uniqSet.has(phone)) {
          dupSet.add(phone);
        } else {
          uniqSet.add(phone);
        }
      }
      if (invalids.length || dupSet.size) {
        setInvalidPhoneNumbers(invalids);
        setDuplicates([...dupSet]);
        setShowValidationErrors(true);
        reject({ invalidPhones: invalids, duplicates: [...dupSet] });
      } else {
        resolve(file);
      }
    };
    reader.onerror = () => reject("Error reading the CSV file");
    reader.readAsText(file);
  });

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setErrorMessage("Please select a CSV file");
      setCsvFile(null);
      return;
    }
    setCsvFile(file);
    setErrorMessage("");
    setShowValidationErrors(false);
    setDuplicates([]);
    setInvalidPhoneNumbers([]);
  };

  const handleGroupCreate = e => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMessage("Please enter a group name");
      return;
    }
    if (!csvFile) {
      setErrorMessage("Please select a file");
      return;
    }
    validateCsvFile(csvFile)
      .then(() => {
        const formValues = { org_id, name: groupName, description, contacts: csvFile };
        return contactsUpload(formValues);
      })
      .then(res => {
        if (res.status === 201) {
          toast.success("CONTACTS UPLOAD SUCCESS");
          setSuccessMessage("Contacts upload successful");
          setErrorMessage("");
          setShowValidationErrors(false);
        } else {
          toast.error("CONTACTS UPLOAD FAILED");
          setErrorMessage("Contacts upload failed. Please try again.");
        }
      })
      .catch(err => {
        if (err.invalidPhones || err.duplicates) return;
        if (err.response?.status === 400) {
          setErrorMessage("Wrong file type selected. Please use CSV format.");
        } else {
          setErrorMessage("Contacts upload failed. Please try again.");
        }
      });
  };

  const goToCampaign = () => {
    closeModal();
    let target = "";
    switch (service) {
      case "data":
        target = `/apps/data/data-rewards?tab=Campaign`;
        break;
      case "airtime":
        target = `/apps/airtime/airtime-rewards?tab=Campaign`;
        break;
      case "sms":
        target = `/apps/sms/messages`;
        break;
      case "flowbot":
        target = `/apps/flowbot/flowbuilder`;
        break;
      default:
        target = `/apps/${service}?tab=Campaign`;
    }
    router.push(target);
  };

  useEffect(() => {
    const onClick = e => {
      if (e.target.id === "authentication-modal") closeModal();
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [closeModal]);

  return (
    <div
      id="authentication-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative w-full max-w-2xl p-4 max-h-full">
        <div className="bg-white rounded-lg shadow dark:bg-gray-700">
          {successMessage ? (
            <div className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-green-500">Success!</h2>
              <p className="mb-6 text-gray-900 dark:text-white">{successMessage}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setSuccessMessage(""); closeModal(); }}
                  className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={goToCampaign}
                  className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-400 rounded-lg hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-300"
                >
                  Go to {service.charAt(0).toUpperCase() + service.slice(1)} Campaigns
                </button>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-red-500">Oops!</h2>
              <p className="mb-6 text-gray-900 dark:text-white">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage("")}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-400 rounded-lg hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-300"
              >
                OK
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  New Group
                </h3>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-1 text-sm font-medium text-orange-400 border border-orange-400 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  Download CSV Template
                </button>
              </div>
              <div className="p-6">
                <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label htmlFor="groupName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Group Name
                    </label>
                    <input
                      type="text"
                      id="groupName"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Group 1"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="csvFile" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      id="csvFile"
                      accept=".csv"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleFileChange}
                      required
                    />
                  </div>

                  {showValidationErrors && (
                    <div className="p-4 mt-2 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="mb-2 text-sm font-medium text-red-600">
                        Please fix these before uploading:
                      </h4>
                      {invalidPhoneNumbers.length > 0 && (
                        <div className="mb-2 text-xs text-red-500">
                          <p>Invalid phone numbers (less than 9 digits):</p>
                          <ul className="list-disc list-inside ml-4">
                            {invalidPhoneNumbers.slice(0, 5).map((item, i) => (
                              <li key={i}>Line {item.line}: {item.phone}</li>
                            ))}
                            {invalidPhoneNumbers.length > 5 && (
                              <li>...and {invalidPhoneNumbers.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {duplicates.length > 0 && (
                        <div className="text-xs text-red-500">
                          <p>Duplicate phone numbers:</p>
                          <ul className="list-disc list-inside ml-4">
                            {duplicates.slice(0, 5).map((phone, i) => (
                              <li key={i}>{phone}</li>
                            ))}
                            {duplicates.length > 5 && (
                              <li>...and {duplicates.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows="4"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description for the group"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGroupCreate}
                      className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-400 rounded-lg hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-300"
                    >
                      Submit
                    </button>
                  </div>
                </form>
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
