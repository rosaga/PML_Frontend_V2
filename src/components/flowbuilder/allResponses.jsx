import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import { format,parseISO } from "date-fns";
import axios from "axios";
import { MoreVertical } from 'lucide-react';
import RequestUnitsModal from "../modal/requestUnits";
import ResponseDetailsModal from "../modal/responseDetails"
import ScheduleCampaignModal from "../modal/scheduleCampaign";
import { getToken } from "@/utils/auth";
import { GetCampaigns } from "@/app/api/actions/campaigns/campaigns";

const AllResponses = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScheduleModelOpen, setIsScheduleModelOpen] = useState(false);
    const [total, setTotal] = useState(5);
    const [loading, setLoading] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [searchParams, setSearchParams] = useState({});

    let org_id = null;
    if (typeof window !== 'undefined') {
      org_id = localStorage.getItem('selectedAccountId');
    }
    const [data, setData] = useState([
        {
          id: 1,
          date: 'November 29, 2024 11:08PM',
          serviceCode: '*234*5#',
          phoneNumber: '+254 765 543 128',
          variable: 'Age',
          duration: '25s',
          status: 'Success',
          flowName: 'Kuza Talanta'
        },
        {
          id: 2,
          date: 'November 29, 2024 11:08PM',
          serviceCode: '*234*5#',
          phoneNumber: '+254 765 543 128',
          variable: 'Age',
          duration: '25s',
          status: 'Success',
          flowName: 'Kuza Talanta'
        },
        {
          id: 3,
          date: 'November 29, 2024 11:08PM',
          serviceCode: '*234*5#',
          phoneNumber: '+254 765 543 128',
          variable: 'Age',
          duration: '25s',
          status: 'Success',
          flowName: 'Kuza Talanta'
        },
        {
          id: 4,
          date: 'November 29, 2024 11:08PM',
          serviceCode: '*234*5#',
          phoneNumber: '+254 765 543 128',
          variable: 'Age',
          duration: '25s',
          status: 'Success',
          flowName: 'Kuza Talanta'
        },
        {
          id: 5,
          date: 'November 29, 2024 11:08PM',
          serviceCode: '*234*5#',
          phoneNumber: '+254 765 543 128',
          variable: 'Age',
          duration: '25s',
          status: 'Success',
          flowName: 'Kuza Talanta'
        }
      ]);

  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
  };



  const filterOptions = [
    { value: "ilike__name", label: "Name" },
    { value: "ilike__created_by", label: "Owner" },
    { value: "eq__bundle_size", label: "Bundle Amt" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

const columns = [
    { 
        field: 'date', 
        headerName: 'Date', 
        flex: 1.2,
        minWidth: 180,
        align: 'center',
        headerAlign: 'center'
    },
    { 
        field: 'serviceCode', 
        headerName: 'Service Code', 
        flex: 1,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center'
    },
    { 
        field: 'phoneNumber', 
        headerName: 'Phone Number', 
        flex: 1,
        minWidth: 150,
        align: 'center',
        headerAlign: 'center'
    },
    { 
        field: 'variable', 
        headerName: 'Variable', 
        flex: 1,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center'
    },
    { 
        field: 'duration', 
        headerName: 'Duration', 
        flex: 1,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center'
    },
    { 
        field: 'status', 
        headerName: 'Status', 
        flex: 1,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <div className="bg-green-400 text-white px-3 py-2 rounded-full text-sm flex items-center justify-center">
                {params.value}
            </div>
        )
    },
    { 
        field: 'flowName', 
        headerName: 'Flow Name', 
        flex: 1,
        minWidth: 150,
        align: 'center',
        headerAlign: 'center'
    },
    {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.5,
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
        renderCell: () => (
            <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical size={20} />
            </button>
        )
    }
];

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  useEffect(() => {
    // getCampaigns();
  }, [ org_id, paginationModel.page, paginationModel.pageSize, isModalOpen, searchParams]);

  const handleRowClick = (params) => {
    const { id } = params.row;
    setSelectedResponse(id);
    openModal()
  };

  return (
    <>
        <>
          {isModalOpen && <ResponseDetailsModal flowData='' closeModal={closeModal} />}
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="mt-4 font-medium text-lg">All Responses</p>
            <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
              
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
                onRowClick={handleRowClick}
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
    </>
  );
};

export default AllResponses;