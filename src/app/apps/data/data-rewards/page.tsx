"use client";
import React, { useState } from "react";
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-lg bg-[#F1F2F3]">
                <div
                  onClick={() => {
                    setActive("recipients");
                    setChildActive("recipients");
                  }}
                  className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:mr-2 ${
                    active === "recipients"
                      ? "bg-[#090A29] rounded-md cursor-pointer"
                      : "bg-white rounded-md cursor-pointer"
                  }`}
                >
                  <span
                    className={`${
                      active === "recipients"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "text-[#E88A17] py-2"
                    }`}
                  >
                    Recipients
                  </span>
                </div>
                <div
                  onClick={() => {
                    setActive("data-dispatch");
                    setChildActive("rewards");
                  }}
                  className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:ml-2 ${
                    active === "data-dispatch"
                      ? "bg-[#090A29] rounded-md cursor-pointer"
                      : "bg-white rounded-md cursor-pointer"
                  }`}
                >
                  <span
                    className={`${
                      active === "data-dispatch"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "text-[#E88A17] py-2"
                    }`}
                  >
                    Data Dispatch
                  </span>
                </div>
              </div>

              {active === "recipients" && (
                <>
                  <div className="flex flex-col sm:flex-row rounded-lg mt-2 border-[1.5px] mb-2">
                    <div className="m-2 flex-1">
                      <span
                        onClick={() => setChildActive("recipients")}
                        className={`flex-1 flex justify-center text-center ${
                          childActive === "recipients"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                        }`}
                      >
                        Recipients
                      </span>
                    </div>
                    <div className="m-2 flex-1">
                      <span
                        onClick={() => setChildActive("groups")}
                        className={`flex-1 flex justify-center text-center ${
                          childActive === "groups"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                        }`}
                      >
                        Groups
                      </span>
                    </div>
                  </div>

                  {childActive === "recipients" && (
                    <RecipientsTable />
                  )}

                  {childActive === "groups" && (
                    <GroupsTable />
                  )}
                </>
              )}

              {active === "data-dispatch" && (
                <>
                  <div className="flex flex-col sm:flex-row rounded-lg mt-2 border-[1.5px] mb-2">
                    <div className="m-2 flex-1">
                      <span
                        onClick={() => setChildActive("rewards")}
                        className={`${
                          childActive === "rewards"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                        }`}
                      >
                        Rewards
                      </span>
                    </div>
                    <div className="m-2 flex-1">
                      <span
                        onClick={() => setChildActive("campaigns")}
                        className={`${
                          childActive === "campaigns"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                        }`}
                      >
                        Campaigns
                      </span>
                    </div>
                    <div className="m-2 flex-1">
                      <span
                        onClick={() => setChildActive("vouchers")}
                        className={`${
                          childActive === "vouchers"
                            ? "text-[#E88A17] bg-white border-[1.5px] border-[#E88A17] py-1 px-4 sm:px-8 rounded cursor-pointer"
                            : "bg-[#F1F2F3] py-1 px-4 sm:px-8 rounded cursor-pointer"
                        }`}
                      >
                        Vouchers
                      </span>
                    </div>
                  </div>

                  {childActive === "rewards" && (
                    <RewardsTable />
                  )}

                  {childActive === "campaigns" && (
                    <CampaignsTable />
                  )}

                  {childActive === "vouchers" && (
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
