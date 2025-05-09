"use client";
import React, { useState, useEffect } from "react";
import AllFlows from "../../../../components/flowbuilder/allFlowsTable";
import FlowBuilderUI from "../../../../components/flowbuilder/flowBuilderUI";
import AllResponses from "../../../../components/flowbuilder/allResponses";
import ChannelTable from "../../../../components/flowbuilder/channelTable";
import { useSearchParams, useRouter } from 'next/navigation';

const Flowbuilder = () => {
  const [active, setActive] = useState("flows");
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get URL parameters
  const tab = searchParams.get('tab');
  const flowId = searchParams.get('id');
  const flowName = searchParams.get('flowName');

  useEffect(() => {
    if (tab === 'flowbot') {
      setActive('flowbot');
    } else if (tab === 'responses') {
      setActive('responses');
    } else if (tab === 'channels') {
      setActive('channels');
    } else {
      setActive('flows');
    }
  }, [tab]);

  // Handle back button navigation for flowbot and responses tabs
  const handleBackToFlows = () => {
    // Navigate back to the flows view by updating the URL
    router.push('/apps/flowbot/flowbuilder');
    setActive('flows');
  };

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              {(active === 'flowbot' || active === 'responses') ? (
                // Back button for flowbot and responses views
                <div className="mb-4">
                  <button 
                    onClick={handleBackToFlows}
                    className="px-4 py-2 text-[#E88A17] border border-[#E88A17] rounded-lg flex items-center"
                  >
                    ← Back to Flows
                  </button>
                </div>
              ) : (
                // Tab navigation for main views
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-lg bg-[#F1F2F3]">
                  <div
                    onClick={() => {
                      setActive("flows");
                      router.push('/apps/flowbot/flowbuilder');
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
                      router.push('/apps/flowbot/flowbuilder?tab=channels');
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
              )}
              
              <br></br>
              
              {active === "flows" && <AllFlows />}
              {active === "channels" && <ChannelTable />}
              {active === "flowbot" && (
                <FlowBuilderUI 
                  flowId={flowId} 
                  flowName={flowName} 
                  onBack={handleBackToFlows}
                />
              )}
              {active === "responses" && (
                <AllResponses 
                  flowId={flowId} 
                  flowName={flowName}
                  onBack={handleBackToFlows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flowbuilder;