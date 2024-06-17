"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search"
import InviteUserModal from "../../../../components/modal/inviteUser"
import { getToken } from "@/utils/auth";

const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [loading, setLoading] = useState(true);
  let token = getToken();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filterOptions = [
    { value: '', label: 'All Categories' },
    { value: 'ilike__first_name', label: 'First Name' },
    { value: 'ilike__last_name', label: 'Last Name' },
    { value: 'ilike__email', label: 'Email' },
    
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/user/list`, {        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const users = usersResponse.data.map((user: any) => ({
        id: user.user_id, 
        first_name: user.firstname,
        last_name: user.lastname,
        email: user.email
      }));

      setRows(users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users data:", error);
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
  ];

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
              </div>
            </div>

            <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>

                {loading ? (
                  <p>Loading...</p>
                ) : (
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
                )}

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
