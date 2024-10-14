"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridValidRowModel, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetRecharges } from "@/app/api/actions/senderId/senderId";
import RequestSmsUnitsModal from "../../../../components/modal/requestSmsUnits"
import DeleteIcon from '@mui/icons-material/DeleteOutline';

const Recharges = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getRecharges = async () => {
    try {
      const res = await GetRecharges(org_id);
      if (res.errors) {
        setLoading
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setLoading(false);
        setRecharges(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getRecharges();
  }, [isModalOpen]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "package", headerName: "Package", flex: 1 },
    { field: "units", headerName: "Units", flex: 1 },
    { field: "expireson", headerName: "Expiry", flex: 1 },
   
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        return (
          <span style={{ color: "grey" }}>PENDING</span>
        );
      },
    },
    // { field: "Action", headerName: "Action", flex: 0, minwidth: 150, renderCell: (params) => <DeleteIcon /> },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">SMS Units</p>
              <div className="ml-auto flex space-x-4">
                <PeakButton
                  buttonText="Request Units"
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
                    rows={recharges}
                    columns={columns}
                    getRowId={(row) => row.id}
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
      {isModalOpen && <RequestSmsUnitsModal closeModal={closeModal} />}
    </div>
  );
};

export default Recharges;
