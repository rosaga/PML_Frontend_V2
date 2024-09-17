"use client";
import React, { useState } from "react";
import RecipientsTable from "../../../../components/rewards-tables/recipients";
import GroupsTable from "../../../../components/rewards-tables/groups";

const DataRewards = () => {
  const [active, setActive] = useState("contacts");
  const [childActive, setChildActive] = useState("recipients");

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">


              {active === "contacts" && (
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
                        Contacts
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataRewards;