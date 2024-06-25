"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { GetGroups } from "@/app/api/actions/group/group";
import { GetRecharges, GetBalance } from "@/app/api/actions/reward/reward";
import { format, parseISO } from "date-fns";
import { CreateCampaign } from "@/app/api/actions/campaigns/campaigns";


const CreateCampaignModal = ({ closeModal }) => {
  let token = getToken();
  const [groups, setGroups] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

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
    const groupData = await GetGroups(org_id);
    if (groupData) {
      setGroups(groupData.data.data);
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = {
      org_id: org_id,
      name: campaignName,
      group_id: parseInt(selectedGroup),
      bundle: selectedBundle,
      // description: description,
      // content: message,
    };
    const res = CreateCampaign(formData)
    .then((res) => {
      if (res.status === 201) {
        setSuccessMessage(`The campaign has been created`);
        setErrorMessage("");
      } else {
        setErrorMessage("Failed to create Campaign. Please try again.");
      }
    })
    .catch((error) => {
      console.log("Error:", error);
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
          ) : (
          <><div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Campaign
                </h3>
                <button
                  type="button"
                  className="end-2.5 bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  + Schedule Campaign
                </button>
                <button
                  type="button"
                  className="end-2.5 bg-transparent text-orange-400 border-[1.5px] border-orange-400 rounded-lg text-sm w-52 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  + New Campaign
                </button>
              </div><div className="p-4 md:p-5">
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
                        placeholder="robina"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        required />
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
                        htmlFor="description"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Enter Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="content"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Message
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Enter Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)} />
                    </div>

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
