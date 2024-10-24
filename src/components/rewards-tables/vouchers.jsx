"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import SearchVouchers from "../../components/search/search"
import InviteUserModal from "../../components/modal/inviteUser"
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import GenerateVoucherModal from "../modal/generateVoucher"
import { GetVouchers } from "@/app/api/actions/vouchers/vouchers";
import { format,parseISO } from "date-fns";


const VouchersTable = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const [loading,setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const filterOptions = [
    { value: 'ilike__created_by', label: 'Created By' },
    { value: 'eq__bundle_size', label: 'Bundle Size' },
];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  

  const columns = [
    { field: "id", headerName: "Voucher ID", flex: 1, minWidth: 100 },
    { field: "created_at", headerName: "Date Created", flex: 1 , minWidth: 150,
    valueFormatter: (params) => { 
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },},
    { field: "created_by", headerName: "Created by", flex: 1, minWidth: 200 },
    { field: "total", headerName: "No of Units", flex: 1, minWidth: 150 },
    { field: "bundle_size", headerName: "Bundle Type", flex: 1, minWidth: 150 },
  ];
  const getVouchers = async () => {
    try {
      const res = await GetVouchers(org_id, paginationModel.page+1, paginationModel.pageSize,searchParams);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED", res);
      } else {
        setTotal(res.data.count);
        setRows(res.data.data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getVouchers();
}, [isModalOpen,paginationModel.page, paginationModel.pageSize, org_id, searchParams]);

  return (
    <>
    {isModalOpen && <GenerateVoucherModal closeModal={closeModal} />}
    <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Vouchers</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
          <PeakButton
            buttonText="Generate Voucher"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
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
            rows={rows}
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

export default VouchersTable;
