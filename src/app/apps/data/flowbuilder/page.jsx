"use client";
import React, { useState, useEffect } from "react";
import RecipientsTable from "../../../../components/rewards-tables/recipients";
import AllChatBots from "../../../../components/flowbuilder/allChatbots";
import GroupsTable from "../../../../components/rewards-tables/groups";
import RewardsTable from "../../../../components/rewards-tables/rewards";
import ChannelTable from "../../../../components/flowbuilder/channelTable";
import CampaignsTable from "../../../../components/rewards-tables/campaigns";
import VouchersTable from "../../../../components/rewards-tables/vouchers";
import {  useSearchParams } from 'next/navigation';

const Flowbuilder = () => {
  const [active, setActive] = useState("flows");
  const searchParams = useSearchParams();
  // const [childActive, setChildActive] = useState("recipients");
  let tab = searchParams.get('tab');

  useEffect(() => {
    // if (tab === 'Rewards') {
    //   setActive('data-dispatch'); 
    //   setChildActive('rewards');
    // } else if (tab === 'Campaign') {
    //   setActive('data-dispatch');
    //   setChildActive('campaigns');
    // }
  }, [tab]);

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-lg bg-[#F1F2F3]">
                <div
                  onClick={() => {
                    setActive("flows");
                    // setChildActive("recipients");
                  }}
                  className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:mr-2 ${
                    active === "flows"
                      ? "bg-[#090A29] rounded-md cursor-pointer"
                      : "bg-white rounded-md cursor-pointer"
                  }`}
                >
                  <span
                    className={`${
                      active === "flows"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "text-[#E88A17] py-2"
                    }`}
                  >
                    Flows
                  </span>
                </div>
                <div
                  onClick={() => {
                    setActive("channels");
                    // setChildActive("rewards");
                  }}
                  className={`flex-1 flex justify-center text-center mb-2 sm:mb-0 sm:ml-2 ${
                    active === "channels"
                      ? "bg-[#090A29] rounded-md cursor-pointer"
                      : "bg-white rounded-md cursor-pointer"
                  }`}
                >
                  <span
                    className={`${
                      active === "channels"
                        ? "text-white bg-[#090A29] py-2 rounded"
                        : "text-[#E88A17] py-2"
                    }`}
                  >
                    Channels
                  </span>
                </div>
              </div>
                <br></br>
              {active === "flows" && (
                <>
                  {/* <div className="flex flex-col sm:flex-row rounded-lg mt-2 border-[1.5px] mb-2">
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
                  </div> */}

                  {/* <Suspense fallback={<div>Loading Recipients...</div>}> */}
                    {active === "flows" && <AllChatBots />}
                    {/* {active === "channels" && <GroupsTable />} */}
                  {/* </Suspense> */}
                </>
              )}

              {active === "channels" && (
                <>
                  {/* <div className="flex flex-col sm:flex-row rounded-lg mt-2 border-[1.5px] mb-2">
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
                  </div> */}

                  {/* <Suspense fallback={<div>Loading Data Dispatch...</div>}> */}
                    {active === "channels" && <ChannelTable />}
                    {/* {childActive === "campaigns" && <CampaignsTable />}
                    {childActive === "vouchers" && <VouchersTable />} */}
                  {/* </Suspense> */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flowbuilder;
