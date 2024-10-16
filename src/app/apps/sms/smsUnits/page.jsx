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
import { hasRole } from "../../../../utils/decodeToken"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Material-UI approve icon
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { grey, green } from "@mui/material/colors";
import apiUrl from "../../../api/utils/apiUtils/apiUrl";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

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
  const [isApproved, setIsApproved] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleApprove = async (id) => {
    const approvalUrl = `${apiUrl.APPROVE_SMS_UNITS}/${id}`;
    try {
      const response = await axios.put(approvalUrl, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      if (response.status === 202) {
        toast.success("APPROVE SUCCESS!!!");
        setIsApproved(true);
      } else {
        toast.error("APPROVE FAILED");
        setIsApproved(true);
      }
    } catch (error) {
      toast.error("APPROVE FAILED");
      setIsApproved(true);
    }
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
  }, [isModalOpen, isApproved, isModalOpen]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "package", headerName: "Package", flex: 1 },
    { field: "units", headerName: "Units", flex: 1 },
    { field: "expireson", headerName: "Expiry", flex: 1 },
    {
      field: "status_code",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const getStatusLabel = (status) => {
          switch (status) {
            case "RCG200":
              return { label: "Approved", color: "green" };
            case "RCG202":
              return { label: "Pending", color: "orange" };
            default:
              return { label: status, color: "black" }; 
          }
        };

        const statusInfo = getStatusLabel(params.value);

        return <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>;
      },
    },
    {
      field: "approve",
      headerName: "Approve",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const { status_code } = params.row;
  
        // Check if the user has the 'SuperAdmin' role (implement hasRole function accordingly)
        const userHasSuperAdminRole = hasRole(token, "SuperAdmin");
  
        if (!userHasSuperAdminRole) {
          return null; // Don't show the Approve column for non-SuperAdmin users
        }
  
        // Display the approve icon only for 'RCG202' status, disabled for 'RCG200'
        const isApproved = status_code === "RCG200";
        const canApprove = status_code === "RCG202";
  
        return (
          <Tooltip title={isApproved ? "Already Approved" : "Approve"}>
            <span>
              <IconButton
                onClick={() => handleApprove(params.row.id)} // Add your approve logic here
                disabled={isApproved} // Disable if already approved
                color={canApprove ? "primary" : "default"}
              >
                <CheckCircleIcon
                  style={{
                    color: isApproved ? grey[400] : green[500], // Grey out if already approved
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
    <ToastContainer />
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
    </>
  );
};

export default Recharges;
