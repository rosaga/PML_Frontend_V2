"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getToken } from "@/utils/auth";
import { appservicesAction } from "../../app/api/actions/appservices/appservicesAction";
import { GetGroups } from "../../components/../app/api/actions/group/group";
import { broadcastMessages } from "../../app/api/actions/messages/messagesAction";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import Switch from "@mui/material/Switch";
import MaterialUIPickers from "../../components/utils/timePicker";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

const SendBulkModal = ({ closeModal }) => {
  let org_id = null;
  let token = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
    token = getToken();
  }

  const randomUuid = uuidv4();

  const channels = ["SHORTCODE", "SENDERNAME"];

  const STOP_SUFFIX = " STOP*456*9*5#";
  const STOP_LEN = STOP_SUFFIX.length;

  const isPromotional = true;

  const currentDateTime = dayjs();
  const [value, setValue] = useState(currentDateTime);
  const handleDateTimeChange = (newValue) => setValue(newValue);

  const handleSwitchChange = (event) => {
    setSchedule(event.target.checked);
  };

  const initialState = {
    content: "",
    name: "",
    description: "",
    scheduled: "",
    channel: "",
  };

  const [state, setState] = React.useState(initialState);

  const [appservices, setAppservices] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [groups, setGroups] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  const [charCount, setCharCount] = useState(0);
  const [repeatInterval, setRepeatInterval] = useState("");
  const [repeatCount, setRepeatCount] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;

    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "content") {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (isButtonClicked) return;

  if (!org_id) return setErrorMessage("No organization selected.");
  if (!selectedChannel) return setErrorMessage("Please select a channel.");
  if (!selectedGroup) return setErrorMessage("Please select a group.");
  if (!selectedSenderId) return setErrorMessage("Please select a sender ID.");
  if (!state.name.trim()) return setErrorMessage("Please enter the campaign name.");
  if (!state.description.trim()) return setErrorMessage("Please enter the campaign description.");
  if (!state.content.trim()) return setErrorMessage("Please enter the message content.");

  setIsButtonClicked(true);
  setErrorMessage("");
  setSuccessMessage("");

  try {
    const originalContent = state.content;
    const formattedContent = originalContent.replace(/\n/g, "\\n");

    const newSms = {
      name: state.name,
      group_id: parseInt(selectedGroup),
      description: state.description,
      service_id: parseInt(selectedSenderId),
      requestid: randomUuid,
      content: formattedContent,
      scheduled: schedule ? value : null,
      channel: selectedChannel,
      organization_id: org_id,
      repeat_count: schedule ? repeatCount : 0,
      repeat_interval: schedule ? repeatInterval : "",
    };

    const res = await broadcastMessages({ selectedSenderId, newSms });

    if (res.status === 200) {
      setSuccessMessage("SMS campaign has been created successfully.");

      setState(initialState);
      setCharCount(0);
      setRepeatCount(0);
      setRepeatInterval("");
      setSchedule(false);
    } else {
      const backendError =
        res?.data?.error ||
        res?.data?.message ||
        res?.errors?._error ||
        "SEND SMS FAILED";

      const displayError =
        backendError.toLowerCase().includes("insufficient")
          ? "Insufficient units. Please top up to proceed."
          : backendError;

      setErrorMessage(displayError);
    }
  } catch (error) {
    console.error("Send bulk SMS error:", error);
    setErrorMessage("Failed to send SMS. Please try again.");
  } finally {
    setIsButtonClicked(false);
  }
};

  const getGroups = () => {
    GetGroups(org_id, page, limit, searchParams)
      .then((res) => {
        if (res.errors) {
          console.log("AN ERROR HAS OCCURED");
        } else {
          setGroups(res.data.data);
          setSelectedGroup(res.data[0]?.group_id || "");
        }
      })
      .catch((err) => console.log(err));
  };

  const getAppServices = () => {
    appservicesAction({ selectedChannel, org_id })
      .then((res) => {
        if (res.errors) {
          console.log("AN ERROR HAS OCCURED");
        } else {
          setAppservices(res.data);
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getGroups();
  }, [page, limit, org_id]);

  useEffect(() => {
    getAppServices();
  }, [org_id, selectedChannel]);

  const counterValue = charCount + (isPromotional ? STOP_LEN : 0);

  const maxTyped = isPromotional ? 480 - STOP_LEN : 480;

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
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Send Bulk SMS
              </h3>
              <button
                type="button"
                className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={closeModal}
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-4 md:p-5">
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
        onClick={() => setErrorMessage("")}
        className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        OK
      </button>
    </div>
  ) : (
              <form className="space-y-2" action="#">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Campaign Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Campaign A"
                      onChange={handleChange}
                      value={state.name}
                      required
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Campaign Description*
                    </label>
                    <input
                      type="text"
                      name="description"
                      id="description"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Marketing campaign for Product A"
                      onChange={handleChange}
                      value={state.description}
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Select Channel
                    </label>
                    <select
                      name="bundle"
                      id="bundle"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      required
                    >
                      <option value="">Select a channel</option>
                      {channels.map((channel) => (
                        <option key={channel} value={channel}>
                          {channel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Select Group
                    </label>
                    <select
                      name="group"
                      id="group"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Select Sender Id
                  </label>
                  <select
                    name="bundle"
                    id="bundle"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) => setSelectedSenderId(e.target.value)}
                    required
                  >
                    <option value="">Select sender id</option>
                    {appservices.map((appservice) => (
                      <option key={appservice.id} value={appservice.id}>
                        {appservice.sendername}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Type your message here
                  </label>

                  <span>
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                      onClick={() => {
                        const textarea = document.getElementById("content");
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = state.content;
                        const newText =
                          text.substring(0, start) + "{{.}}" + text.substring(end);
                        handleChange({ target: { name: "content", value: newText } });
                      }}
                    >
                      Insert Attribute
                    </button>

                    <span
                      className={`${
                        counterValue >= 460 ? "text-red-500 px-2 py-1" : "text-gray-500 px-2 py-1"
                      }`}
                    >
                      {counterValue}/480
                    </span>
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                  Promotional messages will automatically append{" "}
                  <span className="font-mono">{STOP_SUFFIX}</span>.
                </p>

                <textarea
                  name="content"
                  id="content"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Hello {{.}}!"
                  onChange={handleChange}
                  value={state.content}
                  maxLength={maxTyped}
                  rows="4"
                  required
                />

                <FormGroup>
                  <FormControlLabel
                    control={<Switch checked={schedule} onChange={handleSwitchChange} />}
                    label="*Turn on to send scheduled Message*"
                  />
                </FormGroup>

                {schedule && (
                  <div className="my-4">
                    <MaterialUIPickers value={value} onChange={handleDateTimeChange} />
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

                <div className="flex space-x-2 mt-4">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isButtonClicked}
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                  >
                    {isButtonClicked ? "SENDING..." : "SEND"}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendBulkModal;
