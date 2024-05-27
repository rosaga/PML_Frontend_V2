import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import axios from "axios";
import RequestUnitsModal from "../modal/requestUnits";
import SendDataRewardsModal from "../modal/sendDataReward"
import SendBatchRewardsModal from "../modal/sendBatchRewards"
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format } from "date-fns";

const RewardsTable = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false);
    const [page, setPage] = useState(0); // Pagination state
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const openModal1 = () => {
    setIsModalOpen1(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsModalOpen1(false);
  };

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];


  const columns= [
    { field: "id", headerName: "Request ID", flex: 1 },
    { field: "created_date", headerName: "Date Created", flex: 1 },
    { field: "bundle_amount", headerName: "Bundle Amount", flex: 1 },
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/reward/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const transformedData = response.data.map((item) => ({
        id: item.id,
        created_date: format(new Date(item.createdat), "dd-MM-yyyy, h:mm a"),
        bundle_amount: item.bundle_amount,
        phone_number: item.mobile_no,
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
      {isModalOpen && <SendDataRewardsModal closeModal={closeModal} />}
      {isModalOpen1 && <SendBatchRewardsModal closeModal={closeModal} />}
      <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Rewards</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Send Data Rewards"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Send Batch Rewards"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal1}
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

export default RewardsTable;
