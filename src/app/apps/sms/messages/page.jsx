"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import InviteUserModal from "../../../../components/modal/inviteUser";
import SingleSmsTable from "../../../../components/sms-tables/singleSms";
import SmsCampaignsTable from "../../../../components/sms-tables/campaigns";
import SendSmsModal from "../../../../components/modal/sendSms";
import SendBulkModal from "../../../../components/modal/sendBulkSms";
import { useRouter, useSearchParams } from 'next/navigation';
import CircularProgress from "@mui/material/CircularProgress";
import { messagesAction } from "../../../api/actions/messages/messagesAction";
import { getToken } from "@/utils/auth";

const Messages = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
    token = getToken();
  }

  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [active, setActive] = useState("single-sms");
  const [childActive, setChildActive] = useState("all-campaigns");
  let tab = searchParams.get('tab');
  

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  useEffect(() => {
    if (tab === 'campaigns') {
      setActive('campaigns');
    } else {
      setActive('single-sms');
    }
  }, [tab]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const openSendSingle = () => {
    setIsSingleModalOpen(true);
  };

  const openSendBulk = () => {
    setIsBulkModalOpen(true);
  };

  const closeModal = () => {
    setIsSingleModalOpen(false);
    setIsBulkModalOpen(false);
  };

  const filterOptions = [
    { value: "ilike__firstName", label: "First Name" },
    { value: "ilike__lastName", label: "Last Name" },
    { value: "ilike__email", label: "Email" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const handleCampaignTabChange = (tabType) => {
    setChildActive(tabType);
  };

  const getCampaignType = () => {
    switch (childActive) {
      case "scheduled-campaigns":
        return "scheduled";
      case "completed-campaigns":
        return "completed";
      default:
        return "all";
    }
  };


  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">

        {loading ? (
          <Box className="flex justify-center items-center h-full">
            <CircularProgress style={{ color: "#E88A17" }} />
          </Box>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex flex-col">
              <div className="p-4">
                {/* Main Tab Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-lg bg-[#F1F2F3] mb-4">
                  <div
                    onClick={() => setActive("single-sms")}
                    className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:mr-2 ${
                      active === "single-sms"
                        ? "bg-[#090A29] rounded-md cursor-pointer"
                        : "bg-white rounded-md cursor-pointer"
                    }`}
                  >
                    <span
                      className={`${
                        active === "single-sms"
                          ? "text-white bg-[#090A29] py-2 rounded"
                          : "text-[#E88A17] py-2"
                      }`}
                    >
                      Messages
                    </span>
                  </div>
                  <div
                    onClick={() => {
                      setActive("campaigns");
                      setChildActive("all-campaigns");
                    }}
                    className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:ml-2 ${
                      active === "campaigns"
                        ? "bg-[#090A29] rounded-md cursor-pointer"
                        : "bg-white rounded-md cursor-pointer"
                    }`}
                  >
                    <span
                      className={`${
                        active === "campaigns"
                          ? "text-white bg-[#090A29] py-2 rounded"
                          : "text-[#E88A17] py-2"
                      }`}
                    >
                      Campaigns
                    </span>
                  </div>
                </div>

                {/* Single SMS Tab Content */}
                {active === "single-sms" && (
                  <div className="mt-4">
                    <SingleSmsTable />
                  </div>
                )}

                {/* Sub-tabs */}
                {active === "campaigns" && (
                  <>
                    <div className="flex flex-col sm:flex-row rounded-lg mt-2 border-[1.5px] mb-2">
                      <div className="m-2 flex-1">
                        <span
                          onClick={() => handleCampaignTabChange("all-campaigns")}
                          className={`flex-1 flex justify-center text-center ${
                            childActive === "all-campaigns"
                              ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                              : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                          }`}
                        >
                          All Campaigns
                        </span>
                      </div>
                      <div className="m-2 flex-1">
                        <span
                          onClick={() => handleCampaignTabChange("scheduled-campaigns")}
                          className={`flex-1 flex justify-center text-center ${
                            childActive === "scheduled-campaigns"
                              ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                              : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                          }`}
                        >
                          Scheduled Campaigns
                        </span>
                      </div>
                      <div className="m-2 flex-1">
                        <span
                          onClick={() => handleCampaignTabChange("completed-campaigns")}
                          className={`flex-1 flex justify-center text-center ${
                            childActive === "completed-campaigns"
                              ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                              : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                          }`}
                        >
                          Completed Campaigns
                        </span>
                      </div>
                    </div>

                    {/* Campaign Table */}
                    <div className="mt-4">
                      <SmsCampaignsTable 
                        campaignType={getCampaignType()}
                        key={childActive}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      
      {/* Modals */}
      {isSingleModalOpen && <SendSmsModal closeModal={closeModal} />}
      {isBulkModalOpen && <SendBulkModal closeModal={closeModal} />}
    </div>
  );
};

export default Messages;