"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetThreshold } from "@/app/api/actions/threshold/threshold";
import NewThreshold from "../../../../components/modal/newThreshold";
import EditIcon from '@mui/icons-material/Edit';

const Threshold = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editThreshold, setEditThreshold] = useState(null);

  const openModal = (threshold = null) => {
    setEditThreshold(threshold);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditThreshold(null); 
  };

  const getthresholds = async () => {
    try {
      const res = await GetThreshold(org_id);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setLoading(false);
        setRows(res.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getthresholds();
  }, [isModalOpen]);

  const columns = [
    { field: "module", headerName: "Data Bundle", flex: 1, minWidth: 150 },
    { field: "threshold", headerName: "No. of Units", flex: 1, minWidth: 150 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: "green" }}>ACTIVE</span>
      ),
    },
    {
      field: "Action",
      headerName: "Action",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => (
        <EditIcon onClick={() => openModal(params.row)} /> 
      ),
    },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Notification Threshold</p>
              <div className="ml-auto flex space-x-4">
                <PeakButton
                  buttonText="Set Notification Threshold"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] p-2 shadow-sm outline-none"
                  onClick={() => openModal()} // Open modal with no data
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
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <NewThreshold
          closeModal={closeModal}
          threshold={editThreshold} 
        />
      )}
    </div>
  );
};

export default Threshold;
