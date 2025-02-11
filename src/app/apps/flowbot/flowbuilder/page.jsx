"use client";
import React, { useState, useEffect } from "react";
import AllFlows from "../../../../components/flowbuilder/allFlowsTable";
import FlowBuilderUI from "../../../../components/flowbuilder/flowBuilderUI";

import ChannelTable from "../../../../components/flowbuilder/channelTable";

import {  useSearchParams } from 'next/navigation';

const Flowbuilder = () => {
  const [active, setActive] = useState("flows");
  const searchParams = useSearchParams();
  // const [childActive, setChildActive] = useState("recipients");
  let tab = searchParams.get('tab');

  useEffect(() => {
    if (tab === 'flowbot') {
      setActive('flowbot'); 
    } 
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
                    {active === "flows" && <AllFlows />}
                </>
              )}

              {active === "channels" && (
                <>
                    {active === "channels" && <ChannelTable />}
                </>
              )}
              {active === "flowbot" && (
                <>
                    {active === "flowbot" && <FlowBuilderUI />}
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
