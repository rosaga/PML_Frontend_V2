"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search"
import InviteUserModal from "../../../../components/modal/inviteUser"
import apiUrl from "../../../api/utils/apiUtils/apiUrl";
import { getToken } from "@/utils/auth";

const Users = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filterOptions = [
    { value: "ilike__firstName", label: "First Name" },
    { value: "ilike__lastName", label: "Last Name" },
    { value: "ilike__email", label: "Email" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  useEffect(() => {
    fetchUsers();
  }, [isModalOpen, searchParams]);

  const fetchUsers = async () => {

    let usersUrl = `${apiUrl.USERS}/${org_id}/users?page=1&size=20&orderby=id DESC`;

    if (searchParams) {
      const searchParamsString = new URLSearchParams(searchParams).toString();
      usersUrl += `&${searchParamsString}`;
    }

    try {
      const usersResponse = await axios.get(usersUrl, {headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
        }
      });
      const users = usersResponse.data.data.map((user) => ({
        id: user.id, 
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        verified: user.emailVerified
      }));

      setRows(users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users data:", error);
      setLoading(false);
    }
  };

  const columns = [
    { field: "first_name", headerName: "First Name", flex: 1, minWidth: 150 },
    { field: "last_name", headerName: "Last Name", flex: 1, minWidth: 150 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "verified", headerName: "Verified", flex: 1, minWidth: 150 },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Users</p>
              <div className="ml-auto flex space-x-4">
              <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
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
                    slots={{ toolbar: GridToolbar }}
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
