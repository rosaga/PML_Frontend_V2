"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { saveAs } from "file-saver";
import { attachContactToGroup, attachGroupToGroup } from "@/app/api/actions/contact/contact";
import { ToastContainer, toast } from "react-toastify";
import { fetchContacts } from "@/app/api/actions/contact/contact";
import NewContactModal from "./newContact";

const NewGroupContactModal = ({ closeModal, existingGroupId, groupName }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, , service] = pathname.split("/");

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  const [selectedContact, setSelectedContact] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [contactSelected, setContactSelected] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(0);
  const [duplicates, setDuplicates] = useState([]);
  const [invalidPhoneNumbers, setInvalidPhoneNumbers] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredContacts([]);
      setShowDropdown(false);
      return;
    }

    if (contactSelected && searchQuery.trim().length > 0) {
      setShowDropdown(false);
      return;
    }

    const fetchAndFilterContacts = async () => {
      try {
        const query = searchQuery.trim();
        
        const isPhoneNumber = /^[\d+\-\s()]+$/.test(query);
        
        if (!isPhoneNumber || query.length < 4) {
          setFilteredContacts([]);
          setShowDropdown(false);
          return;
        }

        let filterQuery = `like__mobile_no=${encodeURIComponent(query)}`;
        let contacts = await fetchContacts(filterQuery, org_id);

        if (contacts.length === 0) {
          const allContacts = await fetchContacts("", org_id);
          contacts = allContacts.filter((contact) => {
            const mobile = contact.mobile_no || "";
            return mobile.includes(query);
          });
        }

        setFilteredContacts(contacts);
        setShowDropdown(contacts.length > 0);
        setContactSelected(false);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
        
        try {
          const allContacts = await fetchContacts("", org_id);
          const filtered = allContacts.filter((contact) => {
            const mobile = contact.mobile_no || "";
            return mobile.includes(searchQuery.trim());
          });
          
          setFilteredContacts(filtered);
          setShowDropdown(filtered.length > 0);
        } catch (fallbackErr) {
          console.error("Fallback filtering also failed", fallbackErr);
          setFilteredContacts([]);
          setShowDropdown(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchAndFilterContacts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, org_id, contactSelected]);

  const handleSelect = (contact) => {
    setSelectedContact(contact);
    const displayName = `${contact.metadata?.FIRSTNAME || ""} ${contact.metadata?.LASTNAME || ""}`.trim() || contact.mobile_no;
    setSearchQuery(displayName);
    setShowDropdown(false);
    setContactSelected(true);
  };

  const handleInputFocus = () => {
    if (contactSelected) {
      setContactSelected(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { mobile: "0711223344", firstName: "John", lastName: "Doe" },
      { mobile: "0722334455", firstName: "Jane", lastName: "Smith" },
    ];
    
    const csvRows = [
      Object.keys(templateData[0]).join(","),
      ...templateData.map(row => Object.values(row).join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "contact_template.csv");
  };

  const validateCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const mobileIndex = headers.findIndex(header => 
          header.trim().toLowerCase() === 'mobile' || 
          header.trim().toLowerCase() === 'phone' ||
          header.trim().toLowerCase() === 'phonenumber'
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
          
          const values = lines[i].split(',');
          const phoneNumber = values[mobileIndex].trim();
          
          const digitsOnly = phoneNumber.replace(/\D/g, '');
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
            duplicates: Array.from(duplicatePhones)
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

  const handleCsvFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setErrorMessage("Please select a valid CSV file");
      setCsvFile(null);
      return;
    }

    setCsvFile(file);
    setErrorMessage("");
    setShowValidationErrors(false);
    setDuplicates([]);
    setInvalidPhoneNumbers([]);
    
  };

const handleAddContactToGroup = async (e) => {
  e.preventDefault();
  
  if (!selectedContact || !selectedContact.id) {
    setErrorMessage("Please select a contact");
    return;
  }

  if (!existingGroupId) {
    setErrorMessage("No group selected");
    return;
  }

  try {
    const payload = [{
      contact_id: selectedContact.id,
      group_id: existingGroupId
    }];

    const response = await attachContactToGroup(org_id, existingGroupId, payload);
    
    if (response.status === 200) {
      toast.success("Contact added to group successfully");
      setSuccessMessage(`Contact added to ${groupName} successfully`);
      setErrorMessage("");
    } else {
      toast.error("Failed to add contact to group");
      setErrorMessage("Failed to add contact to group. Please try again.");
    }
  } catch (error) {
    console.error("Error adding contact to group:", error);
    setErrorMessage("Failed to add contact to group. Please try again.");
  }
};

const handleCsvUpload = async (e) => {
  e.preventDefault();

  if (!csvFile) {
    setErrorMessage("Please select a CSV file");
    return;
  }

  if (!existingGroupId) {
    setErrorMessage("No group selected");
    return;
  }

  try {
    setIsProcessingCsv(true);
    
    await validateCsvFile(csvFile);

    const formData = new FormData();
    formData.append('contacts', csvFile);
    
    const response = await attachGroupToGroup(org_id, existingGroupId, formData);

    if (response.status === 201 || response.status === 200) {
      toast.success("CSV contacts uploaded successfully");
      setSuccessMessage(`Contacts from CSV added to ${groupName} successfully`);
      setErrorMessage("");
      setShowValidationErrors(false);
    } else {
      toast.error("Failed to upload CSV contacts");
      setErrorMessage("Failed to upload CSV contacts. Please try again.");
    }
  } catch (error) {
    if (error.invalidPhones || error.duplicates) {
      return;
    }
    
    if (error.response && error.response.status === 400) {
      setErrorMessage("Wrong file type selected. Please use CSV format.");
    } else {
      console.error("Error uploading CSV contacts:", error);
      setErrorMessage(typeof error === 'string' ? error : "Failed to upload CSV contacts. Please try again.");
    }
  } finally {
    setIsProcessingCsv(false);
  }
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

  const handleNewContactSuccess = (newContact) => {
    setShowNewContactModal(false);
    if (newContact) {
      setSelectedContact(newContact);
      const displayName = `${newContact.metadata?.FIRSTNAME || ""} ${newContact.metadata?.LASTNAME || ""}`.trim() || newContact.mobile_no;
      setSearchQuery(displayName);
      setContactSelected(true);
      toast.success("Contact created successfully. You can now add it to the group.");
    }
  };

  useEffect(() => {
    const onClick = e => {
      if (e.target.id === "authentication-modal") closeModal();
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [closeModal]);

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        isActive
          ? 'text-orange-600 border-orange-600 bg-orange-50'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div
        id="authentication-modal"
        tabIndex={-1}
        aria-hidden="true"
        className="fixed inset-0 z-50 flex items-center justify-center w-full h-screen bg-black bg-opacity-50"
      >
        <div className="relative w-full max-w-3xl p-4 max-h-full">
          <div className="bg-white rounded-lg shadow dark:bg-gray-700 max-h-[90vh] overflow-y-auto">
            {successMessage ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="mb-4 text-2xl font-semibold text-green-600">Success!</h2>
                <p className="mb-6 text-gray-900 dark:text-white">{successMessage}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setSuccessMessage(""); closeModal(); }}
                    className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={goToCampaign}
                    className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-colors"
                  >
                    Go to {service.charAt(0).toUpperCase() + service.slice(1)} Campaigns
                  </button>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className="mb-4 text-2xl font-semibold text-red-600">Oops!</h2>
                <p className="mb-6 text-gray-900 dark:text-white">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage("")}
                  className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add Contacts to {groupName}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="px-4 pt-4">
                  <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-600">
                    <TabButton
                      id="single"
                      label="Single Contact"
                      isActive={activeTab === "single"}
                      onClick={setActiveTab}
                    />
                    <TabButton
                      id="csv"
                      label="CSV Upload"
                      isActive={activeTab === "csv"}
                      onClick={setActiveTab}
                    />
                  </div>
                </div>

                <div className="p-6">
                  {/* Single Contact Tab */}
                  {activeTab === "single" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <label
                          htmlFor="mobile"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          Search Contact by Phone Number or{" "}
                          <span 
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                            onClick={() => setShowNewContactModal(true)}
                          >
                            Create a New Contact
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            id="mobile"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleInputFocus}
                            className={`bg-gray-50 border ${contactSelected ? 'border-green-500 bg-green-50' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10`}
                            placeholder="Enter at least 4 digits of phone number"
                          />
                          {contactSelected && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {showDropdown && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-56 overflow-y-auto shadow-lg">
                            {filteredContacts.length > 0 ? (
                              filteredContacts.map((contact) => (
                                <div
                                  key={contact.mobile_no}
                                  className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                  onClick={() => handleSelect(contact)}
                                >
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-orange-600 font-semibold text-sm">
                                        {(contact.metadata?.FIRSTNAME?.[0] || contact.mobile_no[0]).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {contact.metadata?.FIRSTNAME || ""} {contact.metadata?.LASTNAME || ""}
                                      </div>
                                      <div className="text-sm text-gray-500">{contact.mobile_no}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-gray-500 text-center">
                                <div className="mb-2">No contacts found</div>
                                <button
                                  onClick={() => setShowNewContactModal(true)}
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  Create a new contact instead
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="w-full px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddContactToGroup}
                          disabled={!contactSelected}
                          className={`w-full px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-4 transition-colors ${
                            contactSelected
                              ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-300'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Add Contact to Group
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CSV Upload Tab */}
                  {activeTab === "csv" && (
                    <div className="space-y-4">
                      {/* Download Template Section */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Upload CSV File</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Add multiple contacts to the group at once</p>
                        </div>
                        <button
                          onClick={handleDownloadTemplate}
                          className="text-orange-400 border border-orange-400 hover:bg-orange-50 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors"
                        >
                          Download CSV Template
                        </button>
                      </div>

                      {/* File Upload Section */}
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
                          onChange={handleCsvFileUpload}
                          accept=".csv"
                          required
                        />
                        
                        {csvFile && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <span className="text-sm font-medium text-green-800">{csvFile.name}</span>
                              <span className="ml-auto text-xs text-green-600">
                                {(csvFile.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Validation Errors */}
                      {showValidationErrors && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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

                      <div className="flex space-x-2 pt-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          disabled={isProcessingCsv}
                          className="w-full text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCsvUpload}
                          disabled={!csvFile || isProcessingCsv}
                          className={`w-full font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:ring-4 focus:outline-none transition-colors ${
                            csvFile && !isProcessingCsv
                              ? 'text-white bg-orange-400 hover:bg-orange-500 focus:ring-orange-300'
                              : 'text-white bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isProcessingCsv ? 'Uploading...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Contact Modal */}
      {showNewContactModal && (
        <NewContactModal 
          closeModal={() => setShowNewContactModal(false)}
          onSuccess={handleNewContactSuccess}
          hideGoToButton={true}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default NewGroupContactModal;