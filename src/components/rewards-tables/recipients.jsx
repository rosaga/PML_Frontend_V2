// MyComponent.js
import React, { useState } from "react";
import Image from "next/image";
import Button from "@mui/material/Button";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";

const RecipientsTable = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];

  const rows= [
    {
        id: 1,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 2,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 3,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 4,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 5,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 6,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 7,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 8,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
        id: 9,
        date: "2024-05-21",
        phone: "0711438911",
        status: "Approved",
      },
    {
      id: 10,
      date: "2024-05-21",
      phone: "0711438911",
      status: "Approved",
    },
  ];

  const columns= [
    { field: "date", headerName: "Date of Onboarding", flex: 1 },
    { field: "phone", headerName: "Phone Number", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "Approved":
              return "green";
            case "Pending":
              return "orange";
            default:
              return "black"; // Default color if needed
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
  ];

  return (
    <>
    {isModalOpen && <RequestUnitsModal closeModal={closeModal} />}
      <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Contacts</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Upload CSV File"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="New Contact"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
          />
        </div>
      </div>

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#F1F2F3",
              },
              "&.MuiDataGrid-root": {
                border: "none",
              },
            }}
          />
        </div>
      </div>
    </>
  );
};

export default RecipientsTable;
