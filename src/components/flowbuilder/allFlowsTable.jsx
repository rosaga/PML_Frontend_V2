"use client";
import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import CreateNewFlowModal from "../modal/createNewFlowModal";
import { useRouter } from "next/navigation";


const AllFlows = () => {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const router = useRouter();
 
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const rows = [
    { id: 1, flow: "Kuza Talanta", status: "Active", lastEdited: "14/08/24", icon: <WhatsAppIcon style={{ color: "#25D366" }} /> },
    { id: 2, flow: "Kuza Talanta", status: "Draft", lastEdited: "14/08/24", icon: <WhatsAppIcon style={{ color: "#25D366" }} /> },
    { id: 3, flow: "New Mums Campaign", status: "Active", lastEdited: "7 Mins Ago", icon: <ReceiptIcon style={{ color: "#090A29" }} /> },
    { id: 4, flow: "Credit Management", status: "Active", lastEdited: "14/08/24", icon: <CodeIcon style={{ color: "#090A29" }} /> },
    { id: 5, flow: "Make Payments Campaign", status: "Active", lastEdited: "14/08/24", icon: <DialpadIcon style={{ color: "#090A29" }} /> },
  ];

  const handleRowClick = (row) => {
    
    router.push("/apps/flowbot/flowbuilder?tab=responses");


  };

  const filterOptions = [
    { value: "ilike__flow", label: "Flow" },
    { value: "ilike__status", label: "Status" },
  ];

  const handleSearch = (filter, value) => {
    console.log("Search Filter:", filter, "Value:", value);
  };

  const handleClearSearch = () => {
    console.log("Search Cleared");
  };

  return (
    <>
      {isModalOpen && <CreateNewFlowModal closeModal={closeModal} />}

      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Chatbots</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
          <PeakButton
            buttonText="Create New Flow"
            icon={AddIcon}
            className="bg-[#E88A17] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={() => openModal()} 
          />
        </div>
      </div>

      <div className="mt-4">
        <table className="min-w-full bg-white">
          <thead className="bg-[#F1F2F3]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Flow</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Edited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr 
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {row.icon}
                    <span className="ml-2 text-sm text-gray-700">{row.flow}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span 
                    className={`text-sm ${
                      row.status === 'Active' ? 'text-green-600' :
                      row.status === 'Draft' ? 'text-gray-600' :
                      'text-black'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.lastEdited}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AllFlows;