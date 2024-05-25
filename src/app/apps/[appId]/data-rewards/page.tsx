"use client";
import Sidebar from "@/components/sidebar/sidebar";
import React, { useState } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../../../../components/button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../../../../components/search/search";
import RequestUnitsModal from "../../../../components/modal/requestUnits";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import RecipientsTable from "../../../../components/rewards-tables/recipients";
import GroupsTable from "../../../../components/rewards-tables/groups";
import RewardsTable from "../../../../components/rewards-tables/rewards";
import CampaignsTable from "../../../../components/rewards-tables/campaigns";
import VouchersTable from "../../../../components/rewards-tables/vouchers";

const DataRewards = () => {

  const [active, setActive] = useState("recipients");
  const [childActive, setChildActive] = useState("recipients");

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between w-full rounded-lg bg-[#F1F2F3]">
                <div 
                    onClick={() => { setActive("recipients");
                    setChildActive("recipients");
                    }} className={active === "recipients" ? "flex-1 flex justify-center text-center bg-[#090A29] m-2 rounded-md cursor-pointer": "flex-1 flex justify-center text-center bg-white m-2 cursor-pointer rounded-md"}>
                  <span                  
                    className={
                      active === "recipients"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "rounded text-[#E88A17] py-2"
                    }
                  >
                    Recipients
                  </span>
                </div>
                <div    
                      onClick={() => {
                      setActive("data-dispatch");
                      setChildActive("rewards");
                    }} className={active === "data-dispatch" ? "flex-1 flex justify-center text-center bg-[#090A29] m-2 rounded-md cursor-pointer ": "flex-1 flex justify-center text-center bg-white m-2 rounded-md cursor-pointer"}>
                  <span
                    className={
                      active === "data-dispatch"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "rounded text-[#E88A17] py-2"
                    }
                  >
                    Data Dispatch
                  </span>
                </div>
              </div>

              {active === "recipients" && (
                <>
                  <div className="flex rounded-lg mt-2 border-[1.5px] mb-2">
                    <div className="m-2 flex">
                      <span
                        onClick={() => setChildActive("recipients")}
                        className={
                          childActive === "recipients"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-16 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-16 rounded cursor-pointer"
                        }
                      >
                        Recipients
                      </span>
                    </div>
                    <div className="flex m-2">
                      <span
                        onClick={() => setChildActive("groups")}
                        className={
                          childActive === "groups"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-16 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-16 rounded cursor-pointer"
                        }
                      >
                        Groups
                      </span>
                    </div>
                  </div>

                  {childActive === "recipients" && ( // Check if the child "Recipients" tab is selected
                    <RecipientsTable />
                  )}

                  {childActive === "groups" && ( // Check if the child "Groups" tab is selected
                    <GroupsTable />
                  )}
                </>
              )}

              {active === "data-dispatch" && ( // Check if the "Dispatch Data" tab is selected
                <>
                  <div className="flex rounded-lg mt-2 border-[1.5px] mb-2">
                    <div className="m-2 flex">
                      <span
                        onClick={() => setChildActive("rewards")}
                        className={
                          childActive === "rewards"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-16 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-16 rounded cursor-pointer"
                        }
                      >
                        Rewards
                      </span>
                    </div>
                    <div className="m-2 flex">
                      <span
                        onClick={() => setChildActive("campaigns")}
                        className={
                          childActive === "campaigns"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-16 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-16 rounded cursor-pointer"
                        }
                      >
                        Campaigns
                      </span>
                    </div>
                    <div className="m-2 flex">
                      <span
                        onClick={() => setChildActive("vouchers")}
                        className={
                          childActive === "vouchers"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-16 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-16 rounded cursor-pointer"
                        }
                      >
                        Vouchers
                      </span>
                    </div>
                  </div>

                  {childActive === "rewards" && ( // Check if the child "Recipients" tab is selected
                    <RewardsTable />
                  )}

                  {childActive === "campaigns" && ( // Check if the child "Groups" tab is selected
                    <CampaignsTable />
                  )}

                  {childActive === "vouchers" && ( // Check if the child "Groups" tab is selected
                    <VouchersTable />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataRewards;
