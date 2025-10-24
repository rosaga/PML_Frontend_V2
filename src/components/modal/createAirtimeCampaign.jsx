"use client";
import React, { useEffect, useState } from "react";
import { getToken } from "../../utils/auth";
import { GetAllGroups } from "@/app/api/actions/group/group";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { CreateAirtimeCampaign } from "@/app/api/actions/campaigns/campaigns";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import MaterialUIPickers from "../utils/timePicker";
import Box from "@mui/material/Box";
import dayjs from "dayjs";

const CreateAirtimeCampaignModal = ({ closeModal }) => {
  let token = getToken();
  const [groups, setGroups] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [senderName, setSenderName] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
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
    fetchBalanceAndGroups();
  }, []);

  async function fetchBalanceAndGroups() {
    try {
      const balanceData = await GetBalance(org_id);
      if (balanceData) {
        setBundles(balanceData.data?.data || []);
      }
    } catch (e) {
      console.warn("Failed to load balance", e);
    }
    try {
      const groupData = await GetAllGroups(org_id);
      if (groupData) {
        setGroups(groupData.data?.data || []);
      }
    } catch (e) {
      console.warn("Failed to load groups", e);
    }
    try {
      const senderIdData = await GetActiveSenderId(org_id);
      if (senderIdData) {
        setSenderName(senderIdData.data || []);
      }
    } catch (e) {
      console.warn("Failed to load sender IDs", e);
    }
  }

  const handleSwitchChange = (event) => {
    setSchedule(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const orgId = org_id;
      const airtime_amount = Number(selectedAmount || 0);

      if (!airtime_amount || airtime_amount <= 0) {
        setErrorMessage("Please select a valid airtime amount.");
        setSubmitting(false);
        return;
      }

      const payload = {
        org_id: orgId,
        name: campaignName,
        group_id: parseInt(selectedGroup, 10),
        airtime_amount,
        description,
        content_message: message,
        sender_id: selectedSenderName ? parseInt(selectedSenderName, 10) : undefined,
      };

      if (schedule) {
        payload.scheduled = dayjs(value).toISOString();
        payload.repeat_count = repeatCount || 0;
        payload.repeat_interval = repeatInterval || "";
      }

      const res = await CreateAirtimeCampaign(payload);

      if (res && (res.status === 202 || res.status === 200)) {
        setSuccessMessage("Airtime campaign created.");
        setCampaignName("");
        setSelectedGroup("");
        setSelectedAmount("");
        setMessage("");
        setSchedule(false);
        setRepeatInterval("");
        setRepeatCount(0);
      } else {
        const msg =
          (res && (res.data?.errors || res.data?.error)) ||
          "Failed to create Airtime Campaign.";
        setErrorMessage(typeof msg === "string" ? msg : "Failed to create Airtime Campaign.");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                  Create Airtime Campaign
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
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Airtime Amount (KES)
                    </label>
                    <select
                      id="airtime_amount"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      required
                    >
                      <option value="">Select Amount</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="150">150</option>
                      <option value="200">200</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="sender_id"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Sender Name
                    </label>
                    <select
                      name="sender_id"
                      id="sender_id"
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

                  {/* <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={schedule}
                          onChange={handleSwitchChange}
                        />
                      }
                      label="*Turn on to send scheduled Campaign*"
                    />
                  </FormGroup> */}

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
                            <option value="monthly">Monthly</option>
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
                              const val = parseInt(e.target.value, 10) || 0;
                              if (repeatInterval === "daily" && val > 30) {
                                setErrorMessage("Daily repeats cannot exceed 30.");
                                return;
                              }
                              if (repeatInterval === "weekly" && val > 4) {
                                setErrorMessage("Weekly repeats cannot exceed 4.");
                                return;
                              }
                              setErrorMessage("");
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

export default CreateAirtimeCampaignModal;
