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
              <div className="bg-dx ml-1 mt-6 h-14 flex bg-mm  rounded-lg">
                <div className="mr-48 pl-10 text-center mt-4 ml-4 ">
                  <span
                    onClick={() => setActive("recipients")}
                    className={
                      active === "recipients"
                        ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                        : "rounded cursor-pointer px-24"
                    }
                  >
                    Recipients
                  </span>
                </div>
                <div className="mr-48 text-center mt-4 ml-4 ">
                  <span
                    onClick={() => {
                      setActive("data-dispatch");
                      setChildActive("rewards");
                    }}
                    className={
                      active === "data-dispatch"
                        ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                        : "ounded cursor-pointer px-24"
                    }
                  >
                    Data Dispatch
                  </span>
                </div>
              </div>

              {active === "recipients" && ( // Check if the "Recipients" tab is selected
                <>
                  <div className="bg-dx ml-1 mt-6 h-14 flex bg-mm  rounded-lg">
                    <div className="mr-48 pl-10 text-center mt-4 ml-4 ">
                      <span
                        onClick={() => setChildActive("recipients")}
                        className={
                          childActive === "recipients"
                            ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                            : "rounded cursor-pointer px-24"
                        }
                      >
                        Recipients
                      </span>
                    </div>
                    <div className="mr-48 text-center mt-4 ml-4 ">
                      <span
                        onClick={() => setChildActive("groups")}
                        className={
                          childActive === "groups"
                            ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                            : "ounded cursor-pointer px-24"
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
                  <div className="bg-dx ml-1 mt-6 h-14 flex bg-mm  rounded-lg">
                    <div className="mr-48 pl-10 text-center mt-4 ml-4 ">
                      <span
                        onClick={() => setChildActive("rewards")}
                        className={
                          childActive === "rewards"
                            ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                            : "rounded cursor-pointer px-24"
                        }
                      >
                        Rewards
                      </span>
                    </div>
                    <div className="mr-48 text-center mt-4 ml-4 ">
                      <span
                        onClick={() => setChildActive("campaigns")}
                        className={
                          childActive === "campaigns"
                            ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                            : "ounded cursor-pointer px-24"
                        }
                      >
                        Campaigns
                      </span>
                    </div>
                    <div className="mr-48 text-center mt-4 ml-4 ">
                      <span
                        onClick={() => setChildActive("vouchers")}
                        className={
                          childActive === "vouchers"
                            ? "text-[#F58426] bg-white px-24 py-2 rounded cursor-pointer"
                            : "ounded cursor-pointer px-24"
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
