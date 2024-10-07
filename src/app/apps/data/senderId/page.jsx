"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetSenderId } from "@/app/api/actions/senderId/senderId";
import NewSenderID from "../../../../components/modal/newSenderID"
import DeleteIcon from '@mui/icons-material/DeleteOutline';



const SenderId = () => {
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

  const getSenderIds = async () => {
    try {
      const res = await GetSenderId(org_id);
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
      getSenderIds();
  }, [isModalOpen]);

  const columns = [
    { field: "service_id", headerName: "ID", flex: 1 },
    { field: "telco", headerName: "Telco", flex: 1 },
    { field: "sendername", headerName: "Sender ID", flex: 1 },
    { field: "channel", headerName: "Channel", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        return (
          <span style={{ color: "green" }}>ACTIVE</span>
        );
      },
    },
    { field: "Action", headerName: "Action", flex: 0, minwidth: 150, renderCell: (params) => <DeleteIcon /> },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">All Sender IDs</p>
              <div className="ml-auto flex space-x-4">
                <PeakButton
                  buttonText="New Sender ID"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] p-2 shadow-sm outline-none"
                  onClick={openModal}
                />

              </div>
            </div>

            <div className="mt-4">
              <div style={{ width: "100%" }}>

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
                    getRowId={(row) => row.sendername} // Set the specific column as the id for the row
                  />
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <NewSenderID closeModal={closeModal} />}
    </div>
  );
};

export default SenderId;
