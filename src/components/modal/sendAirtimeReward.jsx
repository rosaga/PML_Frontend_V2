"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchContacts } from "@/app/api/actions/contact/contact";
import { sendAirtimeReward } from "@/app/api/actions/airtimeReward/airtimeReward";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";
import { useActiveOrganization } from "@/lib/airtime/useOrganizationQuery";
import { getActiveOrganizationId } from "@/lib/airtime/organization";
import { airtimePayload, interpretAirtimeResult } from "@/lib/airtime/result";
import { sendSms } from "../../app/api/actions/messages/messagesAction";
import InsufficientBalanceModal from "./insufficientBalance";
import RequestAirtimeModal from "./requestAirtime";
import RequestSmsUnitsModal from "./requestSmsUnits";
import { isInsufficientBalanceError } from "@/utils/apiErrors";

const SendAirtimeRewardModal = (props) => {
  const orgId = useActiveOrganization();
  return orgId ? <OrganizationSendAirtime key={orgId} {...props} org_id={orgId} /> : <p>Select an organization first.</p>;
};

const OrganizationSendAirtime = ({ closeModal, org_id }) => {
  const mounted = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const isCurrent = useCallback(() => mounted.current && getActiveOrganizationId() === org_id, [org_id]);

  const [selectedContact, setSelectedContact] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [senderName, setSenderName] = useState([]);
  const [selectedSenderName, setSelectedSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contactSelected, setContactSelected] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [showRequestUnitsModal, setShowRequestUnitsModal] = useState(false);
  const [showInsufficientSmsBalanceModal, setShowInsufficientSmsBalanceModal] = useState(false);
  const [showRequestSmsUnitsModal, setShowRequestSmsUnitsModal] = useState(false);

  const { v4: uuidv4 } = require("uuid");

  useEffect(() => {
    let cancelled = false;
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

        if (cancelled || !isCurrent()) return;
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
          
          if (cancelled || !isCurrent()) return;
          setFilteredContacts(filtered);
          setShowDropdown(filtered.length > 0);
        } catch (fallbackErr) {
          console.error("Fallback filtering also failed", fallbackErr);
          if (cancelled || !isCurrent()) return;
          setFilteredContacts([]);
          setShowDropdown(false);
        }
      }
    };

    fetchAndFilterContacts();
    return () => { cancelled = true; };
  }, [searchQuery, org_id, contactSelected, isCurrent]);

  const handleSelect = (contact) => {
    setSelectedContact(contact.mobile_no);
    const displayName = `${contact.metadata?.FIRSTNAME || ""} ${contact.metadata?.LASTNAME || ""}`.trim() || contact.mobile_no;
    setSearchQuery(displayName);
    setShowDropdown(false);
    setContactSelected(true); // Mark that a contact has been properly selected
  };

  // When user focuses on the input, if they haven't modified it, allow searching again
  const handleInputFocus = () => {
    if (contactSelected) {
      // Keep the current query but enable the dropdown to appear
      setContactSelected(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (inFlight.current || !isCurrent()) return;
    let newReward;
    try {
      newReward = airtimePayload({
        request_id: uuidv4(), airtime_amount: selectedBundle, msisdn: selectedContact || searchQuery,
        ...(selectedSenderName ? { sender_id: Number(selectedSenderName) } : {}), message, postpay: true,
      });
    } catch (error) {
      setErrorMessage(error.message);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setErrorMessage("");
    try {
      const response = await sendAirtimeReward({ org_id, newReward });
      if (!isCurrent()) return;
      const result = interpretAirtimeResult(response);
      if (result.outcome !== "success") {
        setSuccessMessage("");
        setErrorMessage(result.message);
        setShowInsufficientBalanceModal(result.topUp);
        return;
      }
      setSuccessMessage(result.message);
      if (newReward.sender_id) {
        try {
          const smsRes = await sendSms({
            selectedSenderId: newReward.sender_id,
            newSms: {
              destination: newReward.msisdn, content: message, requestid: newReward.request_id,
              scheduled: new Date().toISOString(), channel: "SENDERNAME", organization_id: org_id,
            },
          });
          if (isCurrent() && isInsufficientBalanceError(smsRes)) setShowInsufficientSmsBalanceModal(true);
        } catch {
          if (isCurrent()) setSuccessMessage(result.message + " The notification SMS could not be confirmed.");
        }
      }
    } catch (error) {
      if (isCurrent()) setErrorMessage(error.message || "Delivery is unconfirmed. Review history before sending again.");
    } finally {
      inFlight.current = false;
      if (isCurrent()) setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal" && !inFlight.current) {
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal]);

  useEffect(() => {
    let cancelled = false;
    GetActiveSenderId(org_id).then((response) => {
      if (!cancelled && isCurrent()) setSenderName(Array.isArray(response?.data) ? response.data : []);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [org_id, isCurrent]);

  if (showRequestUnitsModal) {
    return (
      <RequestAirtimeModal
        closeModal={closeModal}
        onCancel={() => setShowRequestUnitsModal(false)}
      />
    );
  }

  if (showRequestSmsUnitsModal) {
    return (
      <RequestSmsUnitsModal
        closeModal={closeModal}
        onCancel={() => setShowRequestSmsUnitsModal(false)}
      />
    );
  }

  if (showInsufficientSmsBalanceModal) {
    return (
      <InsufficientBalanceModal
        service="SMS"
        description="The airtime was sent successfully, but the notification SMS could not be sent because your SMS balance is too low. Request more SMS units for future notifications."
        onClose={() => setShowInsufficientSmsBalanceModal(false)}
        onRequestUnits={() => {
          setShowInsufficientSmsBalanceModal(false);
          setShowRequestSmsUnitsModal(true);
        }}
      />
    );
  }

  if (showInsufficientBalanceModal) {
    return (
      <InsufficientBalanceModal
        service="AIRTIME"
        description={errorMessage}
        onClose={() => setShowInsufficientBalanceModal(false)}
        onRequestUnits={() => {
          setShowInsufficientBalanceModal(false);
          setShowRequestUnitsModal(true);
        }}
      />
    );
  }

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black/50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Send Airtime Reward
            </h3>
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
              <form className="space-y-2" onSubmit={handleSend}>
                <fieldset disabled={submitting} className="space-y-2">
                <div className="relative">
                  <label
                    htmlFor="mobile"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Recipient phone number
                  </label>
                  <input
                    id="mobile"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedContact(""); setContactSelected(false); }}
                    onFocus={handleInputFocus}
                    className={`bg-gray-50 border ${contactSelected ? 'border-green-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                    placeholder="Search by phone number"
                  />
                  {showDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-56 overflow-y-auto shadow-lg">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.mobile_no}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => handleSelect(contact)}
                          >
                            {contact.metadata?.FIRSTNAME || ""} {contact.metadata?.LASTNAME || ""} ({contact.mobile_no})
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">No contacts found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="airtime"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Airtime Amount
                  </label>
                  <input id="airtime" type="number" min="0.01" step="0.01" required
                    placeholder="Enter amount in KES"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                    value={selectedBundle} onChange={(e) => setSelectedBundle(e.target.value)} />
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
                      <option key={senderid.service_id} value={senderid.service_id}>
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
                  <div role="alert" className="text-red-500 text-sm mb-4">{errorMessage}</div>
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
                    type="submit"
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    disabled={submitting || !(selectedContact || searchQuery.trim()) || !selectedBundle}
                  >
                    {submitting ? "Sending…" : "Submit"}
                  </button>
                </div>
                </fieldset>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendAirtimeRewardModal;
