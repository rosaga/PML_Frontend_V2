"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from '@mui/icons-material/Add';
import PeakButton from "../../../../components/button/button";
import { getToken } from "@/utils/auth";
import { GetRecharges } from "@/app/api/actions/senderId/senderId";
import { GetAccounts } from "@/app/api/actions/accounts/accounts";
import { GetAllOrgUnits } from "@/app/api/actions/senderId/senderId";
import RequestSmsUnitsModal from "../../../../components/modal/requestSmsUnits";
import ProvisionSmsUnitsModal from "../../../../components/modal/autoprovUnits";
import { hasRole } from "../../../../utils/decodeToken";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { grey, green } from "@mui/material/colors";
import apiUrl from "@/app/api/utils/apiUtils/apiUrl";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

const Recharges = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
    // if user has "SuperAdmin" role, override org_id
    if (token && hasRole(token, "SuperAdmin")) {
      org_id = "admin";
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const openModal1 = () => setIsModalOpen1(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsModalOpen1(false);
  };

  const handleApprove = async (id) => {
    const approvalUrl = `${apiUrl.APPROVE_SMS_UNITS}/${id}`;
    try {
      const response = await axios.put(approvalUrl, null, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 202) {
        toast.success("APPROVE SUCCESS!");
        setIsApproved(prev => !prev);
      } else {
        toast.error("APPROVE FAILED");
        setIsApproved(prev => !prev);
      }
    } catch (error) {
      toast.error("APPROVE FAILED");
      setIsApproved(prev => !prev);
    }
  };

   const getRecharges = async () => {
      try {
        const res = await GetRecharges(org_id);
        if (res.errors) {
          setLoading;
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
  }, [isModalOpen, isModalOpen1, isApproved]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },

    { field: "account_name", headerName: "Account", flex: 1, minWidth: 200 },

    { field: "package", headerName: "Package", flex: 1 },
    { field: "units", headerName: "Units", flex: 1 },

    {
      field: "createdat",
      headerName: "Date",
      flex: 1,
      minWidth: 180,
      valueFormatter: (value) => {
        if (!value) return "";
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : format(d, "yyyy-MM-dd HH:mm");
      },
    },

    { field: "createdby", headerName: "Created By", flex: 1 },

    {
      field: "status_code",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const status = params.value;
        let label = status;
        let color = "black";
        if (status === "RCG200") {
          label = "Approved";
          color = "green";
        } else if (status === "RCG202") {
          label = "Pending";
          color = "orange";
        }
        return <span style={{ color }}>{label}</span>;
      },
    },
    {
      field: "approve",
      headerName: "Approve",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const { status_code } = params.row;
        const userHasSuperAdminRole = hasRole(token, "SuperAdmin");
        if (!userHasSuperAdminRole) return null;

        const alreadyApproved = status_code === "RCG200";
        const canApprove = status_code === "RCG202";

        return (
          <Tooltip title={alreadyApproved ? "Already Approved" : "Approve"}>
            <span>
              <IconButton
                onClick={() => handleApprove(params.row.id)}
                disabled={alreadyApproved}
                color={canApprove ? "primary" : "default"}
              >
                <CheckCircleIcon
                  style={{
                    color: alreadyApproved ? grey[400] : green[500],
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
                  {hasRole(token, 'SuperAdmin') && (
                    <PeakButton
                      buttonText="Provision"
                      icon={AddIcon}
                      className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] p-2 shadow-sm outline-none"
                      onClick={openModal1}
                    />
                  )}
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
        {isModalOpen1 && <ProvisionSmsUnitsModal closeModal={closeModal} />}
      </div>
    </>
  );
};

export default Recharges;
