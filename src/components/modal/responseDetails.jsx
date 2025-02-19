"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { GetGroups, GetAllGroups } from "@/app/api/actions/group/group";
import { GetRecharges, GetBalance } from "@/app/api/actions/reward/reward";
import { format, parseISO } from "date-fns";
import { CreateCampaign } from "@/app/api/actions/campaigns/campaigns";
import { GetActiveSenderId } from "@/app/api/actions/senderId/senderId";


const ResponseDetailsModal = ({ closeModal, flowData }) => {
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

  // Static data for now - will be replaced with API data later
  const flowDetails = {
    name: "Kuza Talanta Flow Details",
    details: {
      date: "November 29, 2024 11:08PM",
      serviceCode: "*765*56#",
      phoneNumber: "+254 765 432 190",
      variable: "Age",
      duration: "8s",
      status: "Success"
    },
    responses: [
      {
        id: 1,
        startTime: "November 29, 2024 11:08PM",
        appResponse: "Hello there. Would you like to participate in a survey?",
        finalResponse: "Yes",
        variable: "Age",
        status: "Success"
      },
      {
        id: 2,
        startTime: "November 29, 2024 11:08PM",
        appResponse: "Hello there. Would you like to participate in a survey?",
        finalResponse: "Yes",
        status: "Success"
      }
    ]
  };

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="relative bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              {flowDetails.name}
            </h3>
          </div>
          
          <div className="p-4 md:p-5">
            {/* Flow Details Section */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#090A29] text-white">
                    <th className="py-3 px-4 text-left font-medium w-1/3">Item</th>
                    <th className="py-3 px-4 text-left font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(flowDetails.details).map(([key, value]) => (
                    <tr key={key} className={key % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-4 font-medium w-1/3">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2 px-4">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Responses Section */}
            {flowDetails.responses.map((response, index) => (
              <div key={response.id} className="mb-6">
                <div className="bg-[#090A29] text-white p-3 mb-4">
                  {index + 1}
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#090A29] text-white">
                      <th className="py-3 px-4 text-left font-medium w-1/3">Item</th>
                      <th className="py-3 px-4 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(response).filter(([key]) => key !== 'id').map(([key, value]) => (
                      <tr key={key} className={key % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 font-medium w-1/3">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                        <td className="py-2 px-4">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Done Button */}
            <div className="mt-6">
              <button
                onClick={closeModal}
                className="w-full text-white bg-orange-400 hover:bg-orange-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailsModal;