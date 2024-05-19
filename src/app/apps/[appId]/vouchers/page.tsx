"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../../../../components/button/button";
import AddIcon from '@mui/icons-material/Add';
import SearchVouchers from "../../../../components/search/searchVouchers"
import InviteUserModal from "../../../../components/modal/inviteUser"

const Vouchers = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    // setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const filterOptions = [
    { value: 'eq__external_id', label: 'Phone Number' },
    { value: 'ilike__first_name', label: 'First Name' },
    { value: 'ilike__last_name', label: 'Last Name' },
];

  const rows: GridRowsProp = [
    {
      id: 1,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Ida Rasanga",
      no_of_units: "20",
    },
    {
      id: 2,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Marianne Mwangi",
      no_of_units: "20",
    },
    {
      id: 3,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Linet Atieno",
      no_of_units: "20",
    },
    {
      id: 4,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Robina Rasanga",
      no_of_units: "20",
    },
    {
      id: 5,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Ida Rasanga",
      no_of_units: "20",
    },
    {
      id: 6,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Marianne Mwangi",
      no_of_units: "20",
    },
    {
      id: 7,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Linet Atieno",
      no_of_units: "20",
    },
    {
      id: 8,
      voucher_id: "001",
      date_created: "2024-05-19",
      bundle_type: "10MB",
      created_by: "Robina Rasanga",
      no_of_units: "20",
    },
  ];

  const columns: GridColDef[] = [
    { field: "voucher_id", headerName: "Voucher ID", flex: 1 },
    { field: "date_created", headerName: "Date Created", flex: 1 },
    { field: "created_by", headerName: "Created by", flex: 1 },
    { field: "no_of_units", headerName: "No of Units", flex: 1 },
    { field: "bundle_type", headerName: "Bundle Type", flex: 1 },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">All Vouchers</p>
              <div className="ml-auto flex space-x-4">
                <SearchVouchers filterOptions={filterOptions} selectedFilter="" />
                <PeakButton
                  buttonText="Generate Voucher"
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
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <InviteUserModal closeModal={closeModal} />}
    </div>
  );
};

export default Vouchers;
