"use client";
import React, { useEffect, useState } from "react";
import { getToken } from "../../utils/auth";
import { GetGroups, GetAllGroups } from "@/app/api/actions/group/group";
import { GetRecharges, GetBalance } from "@/app/api/actions/reward/reward";
import { CreateCampaign } from "@/app/api/actions/campaigns/campaigns";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import MaterialUIPickers from "../../components/utils/timePicker";
import Box from "@mui/material/Box";
import dayjs from "dayjs";

const CreateCampaignModal = ({ closeModal }) => {
  let token = getToken();
  const [groups, setGroups] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [senderName, setSenderName] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("");
  const [selectedSenderName, setSelectedSenderName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState("");
  const [repeatCount, setRepeatCount] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

   const currentDateTime = dayjs();
    const [value, setValue] = useState(currentDateTime);
    const handleDateTimeChange = (newValue) => {
      setValue(newValue);
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

  useEffect(() => {
    fetchBalanceandGroups();
  }, []);

  async function fetchBalanceandGroups() {
    const balanceData = await GetBalance(org_id);
    if (balanceData) {
      setBundles(balanceData.data.data);
    }
    const groupData = await GetAllGroups(org_id);
    if (groupData) {
      setGroups(groupData.data.data);
    }
    const senderIdData = await GetActiveSenderId(org_id);
    if (senderIdData) {
      setSenderName(senderIdData.data);
    }
  }

   const handleSwitchChange = (event) => {
    setSchedule(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const formData = {
      org_id: org_id,
      name: campaignName,
      group_id: parseInt(selectedGroup),
      bundle: selectedBundle,
      description: description,
      scheduled: value,
      content_message: message,
      sender_id: parseInt(selectedSenderName),
      slogan: "5",
      repeat_count: schedule ? repeatCount : 0,
      repeat_interval: schedule ? repeatInterval : ""
    };
    const res = await CreateCampaign(formData)
      .then((res) => {
        if (res.status === 202) {
          setSuccessMessage(`Data has been dispatched successfully under campaign`);
          setErrorMessage("");
        } else {
          setErrorMessage("Failed to create Campaign. Please try again.");
          setCampaignName("");
          setSelectedGroup("");
          setSelectedBundle("");
          setMessage("");
        }
      })
      .catch((error) => {
        console.log("Error:", error);
        setErrorMessage("Failed to create Campaign. Please try again.");
        if (error.response && error.response.status === 400) {
          console.log("Error:", error);
          setErrorMessage("Sorry, you have insufficient units");
          setCampaignName("");
          setSelectedGroup("");
          setSelectedBundle("");
          setMessage("");
        } else {
          setErrorMessage(`Failed to send reward: ${error.message}`);
        }
      })
      .finally(() => {
        setSubmitting(false);
      });

    return res;
  };

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
          ) : submitting ? (
            <Box className="flex justify-center items-center h-60">
              <CircularProgress style={{ color: "#F58426" }} />
            </Box>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Campaign
                </h3>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-2" onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Campaign Name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Campaign Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      id="description"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Enter Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="group"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Group
                    </label>
                    <select
                      name="group"
                      id="group"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.contact_count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="bundle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Bundle
                    </label>
                    <select
                      name="bundle"
                      id="bundle"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={selectedBundle}
                      onChange={(e) => setSelectedBundle(e.target.value)}
                    >
                      <option value="">Select Bundle</option>
                      {bundles.map((bundle) => (
                        <option key={bundle.module} value={bundle.module}>
                          {bundle.module} MB
                        </option>
                      ))}
                    </select>
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
                      <option value="">Select SenderName</option>
                      {senderName?.map((senderid) => (
                        <option key={senderid.service_id} value={senderid.service_id}>
                          {senderid.sendername}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSenderName ? (
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
                  ) : null}

                  <FormGroup>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={schedule}
                                          onChange={handleSwitchChange}
                                        />
                                      }
                                      label="*Turn on to send scheduled Campaign*"
                                    />
                                  </FormGroup>
                  
                                  {schedule && (
                                    <div className="my-4">
                                      <MaterialUIPickers
                                        value={value}
                                        onChange={handleDateTimeChange}
                                      />
                                    </div>
                                  )}
                  
                                  {schedule && (
                                    <>
                                      <div className="flex space-x-4 mt-4">
                                        <div className="flex-1">
                                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Repeat Interval
                                          </label>
                                          <select
                                            value={repeatInterval}
                                            onChange={(e) => setRepeatInterval(e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                          >
                                            <option value="">Select Interval</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                          </select>
                                        </div>
                  
                                        <div className="flex-1">
                                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Repeat Count
                                          </label>
                                          <input
                                            type="number"
                                            value={repeatCount}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                  
                                              if (repeatInterval === "daily" && val > 30) {
                                                toast.error("Daily repeats cannot exceed 30");
                                                return;
                                              }
                                              if (repeatInterval === "weekly" && val > 4) {
                                                toast.error("Weekly repeats cannot exceed 4");
                                                return;
                                              }
                  
                                              setRepeatCount(val);
                                            }}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                            min="0"
                                          />
                                        </div>
                                      </div>
                                    </>
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

export default CreateCampaignModal;
