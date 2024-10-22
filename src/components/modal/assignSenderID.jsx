"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { saveAs } from "file-saver";
import { CreateSenderID, GetAllSenderId,GetSenderId, assignSenderID, } from "../../app/api/actions/senderId/senderId";
import { set } from "date-fns";

const AssignSenderID = ({ orgUnitId, closeModal, org_unit_name }) => {
 


  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [senderIDs, setSenderIDs] = useState([]);
  const [availableSenderIDs, setAvailableSenderIDs] = useState([]);
  const [selectedSenderID, setSelectedSenderID] = useState("");
  const [loading, setLoading] = useState(true);



  const handleAssignSenderID = (e) => {
    e.preventDefault();


    const formValues = {
      org_id: orgUnitId,
      sender_id: selectedSenderID,
    };

    assignSenderID(formValues)
      .then((res) => {
        if (res.status === 201) {
          setSuccessMessage(`Assignment of SenderID has been successful`);
          setErrorMessage("");
        } else {
          setErrorMessage("Failed to assign SenderID");
        }
      })
      .catch((error) => {
        console.log("Error:", error);
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

  const getSenderIds = async () => {
    try {
      const res = await GetSenderId(orgUnitId);
      if (res.errors) { 
        console.log("AN ERROR HAS OCCURRED");
        setLoading(true);
      } else {
        setSenderIDs(res.data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const getAllSenderIds = async () => {
    try {
      const res = await GetAllSenderId(orgUnitId);
      if (res.errors) { 
        console.log("AN ERROR HAS OCCURRED");
        setLoading(true);
      } else {
        setAvailableSenderIDs(res.data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getSenderIds();
      getAllSenderIds();
  }, [orgUnitId,]);


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
                className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Close
              </button>
            </div>
          ) : (
            <>
            {loading ? null : (
                <div className="relative p-4 w-full max-w-2xl max-h-full">
                      <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <div className="p-4 text-center">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Organization Unit: {org_unit_name}
                          </h2>
                        </div>
                        <div className="p-4 md:p-5">
                          {/* List of Sender IDs */}
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">Assigned Sender IDs:</h3>
                            <ul className="list-disc pl-5 space-y-2">
                              {senderIDs.map((sender, index) => (
                                <li key={index} className="text-gray-700 dark:text-white">
                                  {sender.sendername}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Dropdown for selecting a new Sender ID */}
                          <div className="mb-4">
                            <label
                              htmlFor="newSenderID"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Assign New Sender ID: 
                            </label>
                            <select
                              name="newSenderID"
                              id="newSenderID"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                              onChange={(e) => setSelectedSenderID(e.target.value)}
                              required
                            >
                              <option value="">Select Sender ID</option>
                              {availableSenderIDs
                            ?.filter(
                              (availableSender) =>
                                !senderIDs.some(
                                  (assignedSender) => assignedSender.sendername === availableSender.sendername
                                )
                            )
                            .map((sender, index) => (
                              <option key={index} value={sender.service_id}>
                                {sender.sendername}
                              </option>
                            ))}
                            </select>
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
                              onClick={handleAssignSenderID} // Implement this function to handle assignment
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignSenderID;
