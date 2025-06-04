"use client";
import React, { useState } from "react";
import RecipientsTable from "../../../../components/flowbuilder/flowBuilderContacts";
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


             
                <>

                   
                    <RecipientsTable />
                  

                </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataRewards;