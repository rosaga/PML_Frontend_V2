"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetSenderId, approveSenderID } from "@/app/api/actions/senderId/senderId";
import AssignSenderID from "../../../../components/modal/assignSenderID"
import { hasRole } from "../../../../utils/decodeToken"
import EditIcon from '@mui/icons-material/Edit';
import { set } from "date-fns";



const ManageSenderId = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgUnitId, setOrgUnitId] = useState(null);
  const [org_unit_name, setOrg_unit_name] = useState(null);
  

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
    { field: "id", headerName: "Organisation unit ID", flex: 1,  minWidth: 150, },
    { field: "Name", headerName: "Name", flex: 1,  minWidth: 150, },
    { field: "Status", headerName: "Status", flex: 1,  minWidth: 150, },

    
  ];
  if (hasRole(token, 'SuperAdmin')) {
      columns.push({
        field: "approve_action",
        headerName: "Assign Sender Id",
        flex: 1,
        width: 10,
        renderCell: (params) => {
            return <EditIcon className="flex items-center" onClick={() => handleAssignment(params.row)}></EditIcon>;

        },
      });
  }
  const handleAssignment = (row) => {
    // const response = await approveSenderID(id);
    // console.log('response',response);
    // if (response.status === 202) {
    //   toast.success("APPROVE SUCCESS!!!");
    //   setIsApproved(true);
    // } else {
    //   toast.error("APPROVE FAILED");
    //   setIsApproved(true);
    // }
    setIsModalOpen(true);
    setOrgUnitId(row.id);
    setOrg_unit_name(row.name);

  
  };

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">All Organisation Units </p>
              <div className="ml-auto flex space-x-4">
                {/* <PeakButton
                  buttonText="New Sender ID"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] p-2 shadow-sm outline-none"
                  onClick={openModal}
                /> */}

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
      {isModalOpen && <AssignSenderID orgUnitId = {orgUnitId} closeModal={closeModal} org_unit_name={org_unit_name} />}
    </div>
  );
};

export default ManageSenderId;
