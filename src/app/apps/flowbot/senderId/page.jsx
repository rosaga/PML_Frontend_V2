"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetSenderId, approveSenderID } from "@/app/api/actions/senderId/senderId";
import NewSenderID from "../../../../components/modal/newSenderID"
import { hasRole } from "../../../../utils/decodeToken"
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { set } from "date-fns";




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
  const [isApproved, setIsApproved] = useState(null);

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
  }, [isModalOpen,isApproved]);

  const columns = [
    { field: "service_id", headerName: "ID", flex: 1,  minWidth: 150, },
    { field: "telco", headerName: "Telco", flex: 1,  minWidth: 150, },
    { field: "sendername", headerName: "Sender ID", flex: 1,  minWidth: 150, },
    { field: "channel", headerName: "Channel", flex: 1, minWidth: 150, },
    {
      field: "service_state",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        return (
          params.value === "SVC202" ? <span style={{ color: "red" }}>INACTIVE</span> : <span style={{ color: "green" }}>ACTIVE</span>
         
        );
      },
    },
    
  ];
  if (hasRole(token, 'SuperAdmin')) {
      columns.push({
        field: "approve_action",
        headerName: "Approve",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          if (params.row.service_state === 'SVC202') {
            return <button className="bg-green-400 text-white border-1 text-sm rounded-[2px] px-2 shadow-sm outline-none" onClick={() => handleApprove(params.row.service_id)}>Approve</button>;
          }else{
            return <button className="bg-gray-100 text-gray-600 text-sm rounded-[2px] px-2 shadow-sm outline-none" >Approved</button>;
          }
          return null;
        },
      });
  }
  const handleApprove = async (id) => {
    const response = await approveSenderID(id);
    
    if (response.status === 200) {
      toast.success("APPROVE SUCCESS!!!");
      setTimeout(() => {
      setIsApproved(!isApproved);
      }, 1000);
    } else {
      toast.error("APPROVE FAILED");
    }

  
  };

  return (
  <>
   <ToastContainer />
  
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
  </>
    
  );
};

export default SenderId;
