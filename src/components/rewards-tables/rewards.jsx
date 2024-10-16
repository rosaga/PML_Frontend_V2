import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
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
import { format,parseISO } from "date-fns";
import { getToken } from "../../utils/auth";
import { GetRewards } from "../../app/api/actions/reward/reward"

const RewardsTable = () => {

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false);
    const [page, setPage] = useState(0); // Pagination state
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useState({});

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
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__status", label: "Status" },
    { value: "ilike__mobile_no", label: "Phone" },
    { value: "eq__bundle_amount", label: "Bundle Amt" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const columns= [
    { field: "id", headerName: "Request ID", flex: 1, minWidth: 100 },
    { field: "created_at", headerName: "Date Created", flex: 1, minWidth: 150, 
    valueFormatter: (params) => {
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },
   },
    { field: "bundle_amount", headerName: "Bundle Amount", flex: 1, minWidth: 150 },
    {
      field: 'mobile_no',
      headerName: 'Phone Number',
      flex: 1,
      minWidth: 200,
    },
    {
      field: "status",
      headerName: "Status ID",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "SUCCESS":
              return "green";
            case "FAILED":
              return "red";
            default:
              return "black"; // Default color if needed
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    {
      field: 'status_desc',
      headerName: 'Status Description',
      flex: 1,
      minWidth: 200,
    },
  ];
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });


  const [isLoaded, setIsLoaded] = useState(false);
  const [rewards, setRewards] = useState([]);

  const getRewards = async () => {
    try {
      const res = await GetRewards(org_id, paginationModel.page + 1, paginationModel.pageSize, searchParams);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setRewards(res.data.data.map(item => ({
          ...item,
          mobile_no: item.contact?.mobile_no || ""
        })));
        setTotal(res.data.count);
        setIsLoaded(true);
        setLoading(false);
      
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getRewards();
  }, [isModalOpen,isModalOpen1,paginationModel.page, paginationModel.pageSize, org_id, searchParams]);


  return (
    <>
      {isModalOpen && <SendDataRewardsModal closeModal={closeModal} />}
      {isModalOpen1 && <SendBatchRewardsModal closeModal={closeModal} />}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Rewards</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
          <PeakButton
            buttonText="Send Data Rewards"
            icon={AddIcon}
            className="bg-orange-400 text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Send Batch Rewards"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal1}
          />
          {/* <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
          /> */}
        </div>
      </div>

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={rewards}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={total}
            paginationMode="server"
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
        </div>
      </div>
    </>
  );
};

export default RewardsTable;
