"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../../../../components/button/button";
import AddIcon from '@mui/icons-material/Add';
import PeakSearch from "../../../../components/search/search"
import InviteUserModal from "../../../../components/modal/inviteUser"

const Users = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const filterOptions = [
    { value: 'eq__external_id', label: 'Phone Number' },
    { value: 'ilike__first_name', label: 'Created By' },
    { value: 'ilike__last_name', label: 'Last Name' },
];

  const rows: GridRowsProp = [
    {
      id: 1,
      first_name: "Allan",
      last_name: "Oluoch",
      email: "allan@gmail.com",
    },
    {
      id: 2,
      first_name: "Richard",
      last_name: "Osaga",
      email: "osaga@gmail.com",
    },
    {
      id: 3,
      first_name: "Victor",
      last_name: "Siderra",
      email: "siderra@gmail.com",
    },
    {
      id: 3,
      first_name: "Ryan",
      last_name: "Ashiruma",
      email: "ashiruma@gmail.com",
    },
  ];

  const columns: GridColDef[] = [
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
  ];

  const data = [
    ["Allan", "Oluoch", "allan@gmail.com"],
    ["Richard", "Osaga", "osaga@gmail.com"],
    ["Victor", "Siderra", "siderra@gmail.com"],
    ["Ryan", "Ashiruma", "ashiruma@gmail.com"],
  ];

  const selectedFilter = "Email"
    const searchInput = "sid@gmail.com"

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Users</p>
              <div className="ml-auto flex space-x-4">
                <PeakSearch filterOptions={filterOptions} selectedFilter="" />
                <PeakButton
                  buttonText="Invite User"
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
              <div style={{ height: 350, width: "100%" }}>
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
          </div>
        </div>
      </div>
      {isModalOpen && <InviteUserModal closeModal={closeModal} />}
    </div>
  );
};

export default Users;
