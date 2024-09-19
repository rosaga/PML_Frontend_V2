"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getToken } from "@/utils/auth";
import { appservicesAction } from "../../app/api/actions/appservices/appservicesAction";
import { GetGroups } from "../../components/../app/api/actions/group/group"
import { sendSms } from "../../app/api/actions/messages/messagesAction";
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

  const channels = ["WHATSAPP", "SHORTCODE", "SENDERNAME"];

  const currentDateTime = dayjs();
  const [value, setValue] = useState(currentDateTime);
  // console.log("NEW VALUE!!!!!!!!", value);
  const handleDateTimeChange = (newValue) => {
    setValue(newValue);
  };

  const handleSwitchChange = (event) => {
    setSchedule(event.target.checked);
  };

  const initialState = {
    content: "",
    name: "",
    description: "",
    scheduled: "",
    channel: ""
  };

  const [state, setState] = React.useState(initialState);

  const [appservices, setAppservices] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [groups, setGroups] = useState([]);
  const [searchParams, setSearchParams] = useState({});

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  const handleChange = (e) => {
    const value = e.target.value;
    setState({
      ...state,
      [e.target.name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsButtonClicked(true);

    const originalContent = state.content
    const formattedContent = originalContent.replace(/\n/g, '\\n');

    const newSms = {
      name: state.name,
      group_id: selectedGroup,
      description: state.description,
      service_id: selectedSenderId,
      requestid: randomUuid,
      content: formattedContent,
      scheduled: value,
      channel: selectedChannel,
      organization_id: app_id
  };

    const res = broadcastMessages({selectedSenderId,newSms}).then((res) => {
      setIsButtonClicked(false);
      if (res.status === 200) {
        toast.success("SMS SENT SUCCESSFULLY!!!");
      } else {
        toast.error("SEND SMS FAILED");
      }
      setState(initialState);
    });

    return res;
  };

  const getGroups = () => {
    GetGroups( org_id, page, limit, searchParams )
      .then((res) => {
        if (res.errors) {
          console.log("AN ERROR HAS OCCURED");
        } else {
          setGroups(res.data.data);
          setSelectedGroup(res.data[0]?.group_id || "");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getAppServices = () => {
    appservicesAction({ selectedChannel, org_id })
      .then((res) => {
        if (res.errors) {
          console.log("AN ERROR HAS OCCURED");
        } else {
          setAppservices(res.data);
          setSelectedSenderId(res.data[0]?.service_id || "");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getGroups();
  }, [page, limit, org_id]);

  useEffect(() => {
    getAppServices();
  }, [org_id, selectedChannel]);

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
              <form className="space-y-2" action="#">
              <div className="flex space-x-4">
                  <div className="flex-1">
                    <label
                      htmlFor="bundle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
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
                    <label
                      htmlFor="bundle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
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
                    <label
                      htmlFor="bundle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
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
                    <label
                      htmlFor="bundle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Group
                    </label>
                    <select
                      name="bundle"
                      id="bundle"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      onChange={(e) => setSelectedSenderId(e.target.value)}
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option
                          key={group.group_id}
                          value={group.group_id}
                        >
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bundle"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
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
                      <option
                        key={appservice.service_id}
                        value={appservice.service_id}
                      >
                        {appservice.sendername}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="content"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Type your message here (Max 140 characters)
                  </label>
                  <textarea
                    name="content"
                    id="content"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Hello ^FIRSTNAME^ ^LASTNAME^ from the county of ^COUNTY^. Receive this sms to your mobile number - ^PHONENUMBER^."
                    onChange={handleChange}
                    value={state.content}
                    maxLength="140"
                    rows="4"
                    required
                  />
                </div>

                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={schedule}
                        onChange={handleSwitchChange}
                      />
                    }
                    label="*Turn on to send scheduled Message*"
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
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    onClick={(e) => {
                      handleSubmit(e);
                      setIsButtonClicked(true);
                    }}
                  >
                    {isButtonClicked ? "SENDING..." : "SEND"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendBulkModal;
