"use client";
import React, { useState,useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import SearchVouchers from "../search/search"
import InviteUserModal from "../modal/inviteUser"
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import { format } from "date-fns";
import axios from "axios";
import RequestUnitsModal from "../modal/requestUnits";


const CampaignDetails = (campaignId,closeDetails) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const filterOptions = [
    { value: 'eq__external_id', label: 'Phone Number' },
    { value: 'ilike__first_name', label: 'First Name' },
    { value: 'ilike__last_name', label: 'Last Name' },
];


  const columns = [
    { field: "request_id", headerName: "RequestID", flex: 1 },
    { field: "created_date", headerName: "Date Created", flex: 1 },
    { field: "bundle", headerName: "Bundle Amount", flex: 1 },
    { field: "phone_number", headerName: "Phone Number", flex: 1 },
    {
      field: "status",
      headerName: "Status ID",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "Success Dispatch":
              return "green";
            case "Failed Dispatch":
              return "orange";
            default:
              return "black"; // Default color if needed
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
  ];
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const fetchToken = async () => {
    try {
      const authResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/token`, {
        username: process.env.NEXT_PUBLIC_USERNAME,
        password: process.env.NEXT_PUBLIC_PASSWORD,
      });

      const fetchedToken = authResponse.data.token;
      return fetchedToken;
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await fetchToken();
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/campaign/${campaignId.campaignId}/rewards/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const transformedData = response.data.map((item) => ({
        id: item.id,
        request_id: item.request_id,
        phone_number: item.mobile_no,
        bundle: item.bundle_amount,
        created_date: format(new Date(item.createdat), "dd-MM-yyyy, h:mm a"),
        status: item.status_id === "SUCCESS_DISPATCH" ? "Success Dispatch" : "Failed Dispatch",
      }));
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <>
    {isModalOpen && <RequestUnitsModal closeModal={closeModal} />}
    <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Vouchers</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Generate Voucher"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
          />
        </div>
      </div>

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={data}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#F1F2F3",
              },
              "&.MuiDataGrid-root": {
                border: "none",
              },
            }}
          />
        </div>
      </div>
      </>
  );
};

export default CampaignDetails;