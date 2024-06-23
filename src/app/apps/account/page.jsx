"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../components/button/button";
import apiUrl from "../../api/utils/apiUtils/apiUrl";
import { getToken } from "@/utils/auth";
import { GetAccounts } from "@/app/api/actions/accounts/accounts";

const Accounts = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getAccounts = async () => {
    try {
      const res = await GetAccounts();
      if (res.errors) {
        setLoading
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setLoading(false);
        setRows(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getAccounts();
  }, []);

  const columns = [
    { field: "id", headerName: "ACCOUNT ID", flex: 1 },
    { field: "name", headerName: "ACCOUNT NAME", flex: 1 },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Accounts</p>
              <div className="ml-auto flex space-x-4">
                <PeakButton
                  buttonText="Add Account"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] p-2 shadow-sm outline-none"
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
      {/* {isModalOpen && <InviteUserModal closeModal={closeModal} />} */}
    </div>
  );
};

export default Accounts;
