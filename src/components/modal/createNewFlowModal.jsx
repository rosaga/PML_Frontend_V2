"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CreateNewFlowModal = ({ closeModal }) => {
  const [name, setName] = useState("");
  const [channel_id, setChannel_id] = useState("");
  const [type, setType] = useState("WhatsApp");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  let organization_id = null;
  if (typeof window !== 'undefined') {
    organization_id = localStorage.getItem('selectedAccountId');
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

  const handleTypeChange = (event) => {
    setType(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const flowData = {
        name,
        organization_id,
        type,
        channel_id: channel_id || undefined
      };
      
      const response = await fetch('https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create flow');
      }
      
      // If successful, redirect to the flow builder page
      router.push("/apps/flowbot/flowbuilder?tab=flowbot"); 
    } catch (error) {
      setErrorMessage(error.message);
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
          <div className="p-4 md:p-5">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center">
                <i className="text-white text-lg font-bold">i</i>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Create New Flow
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="flow_name"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Enter Flow Name
                </label>
                <input
                  type="text"
                  id="flow_name"
                  name="flow_name"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="e.g Marketing Survey"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select Flow Type
                </label>
                <div className="flex space-x-4">
                  {["WhatsApp", "SMS", "Shortcode"].map((typeOption) => (
                    <label key={typeOption} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="flow_type"
                        value={typeOption}
                        checked={type === typeOption}
                        onChange={handleTypeChange}
                        className="w-4 h-4 text-orange-400 focus:ring-orange-400"
                      />
                      <span className="text-gray-900 dark:text-white">{typeOption}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label 
                  htmlFor="channel_id" 
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Select Channel (Optional)
                </label>
                <select
                  id="channel_id"
                  name="channel_id"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={channel_id}
                  onChange={(e) => setChannel_id(e.target.value)}
                >
                  <option value="">Select a channel</option>
                  <option value="1">WhatsApp</option>
                  <option value="2">WhatsApp Business</option>
                  <option value="3">SMS</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Submit
                </button>
              </div>
              {errorMessage && <div className="mt-4 text-sm text-red-600">{errorMessage}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewFlowModal;