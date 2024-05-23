// MyComponent.js
import React, { useState } from "react";
import Image from "next/image";
import Button from "@mui/material/Button";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";


const GroupsTable = () => {

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
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Pending",
    },
    {
      id: 2,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 3,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 4,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 5,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 6,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 7,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 8,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 9,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
    {
      id: 10,
      transId: "11111",
      start_date: "2024-01-21",
      end_date: "2024-05-21",
      bundle: "20",
      units: "100",
      status: "Approved",
    },
  ];

  const columns= [
    { field: "transId", headerName: "Transaction Reference", flex: 1 },
    { field: "start_date", headerName: "Start Date", flex: 1 },
    { field: "end_date", headerName: "End Date", flex: 1 },
    { field: "bundle", headerName: "Data Bundle", flex: 1 },
    { field: "units", headerName: "Units", flex: 1 },
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
        <p className="mt-4 font-medium text-lg">All Groups</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Request Data Units"
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

export default GroupsTable;
