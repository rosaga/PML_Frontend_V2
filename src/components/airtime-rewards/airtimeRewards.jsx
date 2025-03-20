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
import SendAirtimeRewardModal from "../modal/sendAirtimeReward"
import SendAirtimeBatchRewardsModal from "../modal/sendBatchAirtimeRewards"
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format,parseISO } from "date-fns";
import { getToken } from "../../utils/auth";
import { GetAirtimeRewards } from "../../app/api/actions/airtimeReward/airtimeReward"
import DownloadAllButton from "../button/DownloadAllButton";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const AirtimeRewardsTable = () => {

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
    const [hidePhone, setHidePhone] = useState(true);


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

    // mask phone number function
    const maskPhone = (phone) => {
      if (phone && phone.length > 5) {
        return phone.slice(0, 2) + "*".repeat(phone.length - 5) + phone.slice(-3);
      }
      return phone;
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
    { field: "airtime_amount", headerName: "Airtime Amount", flex: 1, minWidth: 150 },
    {
      field: "mobile_no",
      renderHeader: () => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: 4 }}>Phone Number</span>
          <IconButton
            size="small"
            onClick={() => setHidePhone(!hidePhone)}
            title={hidePhone ? "Show Phone Number" : "Hide Phone Number"}
          >
            {hidePhone ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>
        </div>
      ),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const phone = params.value || "";
        return hidePhone ? maskPhone(phone) : phone;
      },
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
      const res = await GetAirtimeRewards(org_id, paginationModel.page + 1, paginationModel.pageSize, searchParams);
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

  const fetchAllRewards = async () => {
    try {
      const res = await GetAirtimeRewards(org_id, 1, total, searchParams);
      if (!res.errors) {
        return res.data.data.map((item) => ({
          "Request ID": item.id,
          "Date Created": item.created_at,
          "Airtime Amount": item.airtime_amount,
          "Phone Number": item.contact?.mobile_no || "",
          Status: item.status,
          "Status Description": item.status_desc,
        }));
      }
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
      getRewards();
  }, [isModalOpen,isModalOpen1,paginationModel.page, paginationModel.pageSize, org_id, searchParams]);


  return (
    <>
      {isModalOpen && <SendAirtimeRewardModal closeModal={closeModal} />}
      {isModalOpen1 && <SendAirtimeBatchRewardsModal closeModal={closeModal} />}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Airtime Rewards</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
          <PeakButton
            buttonText="Send Airtime Reward"
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
            slots={{
              toolbar: () => (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px" }}>
                  <GridToolbar />
                  <DownloadAllButton fetchAllData={fetchAllRewards} filename="rewards_data.csv" />
                </div>
              ),
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AirtimeRewardsTable;
