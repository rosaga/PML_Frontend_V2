"use client";
import React, { useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import CreateNewFlowModal from "../modal/createNewFlowModal";


const AllFlows = () => {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
 
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

  const columns = [
    {
      field: "flow",
      headerName: "Flow",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {params.row.icon}
          <span style={{ marginLeft: 8 }}>{params.row.flow}</span>
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "Active":
              return "green";
            case "Draft":
              return "gray";
            default:
              return "black";
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    { field: "lastEdited", headerName: "Last Edited", flex: 1, minWidth: 150 },
  ];

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
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#F1F2F3",
              },
              "&.MuiDataGrid-root": {
                border: "none",
              },
            }}
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </div>
    </>
  );
};

export default AllFlows;
