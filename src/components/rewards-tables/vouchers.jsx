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
    page: 1,
  });
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0); // Pagination state
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const [loading,setLoading] = useState(true);

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
    { field: "id", headerName: "Voucher ID", flex: 1 },
    { field: "created_at", headerName: "Date Created", flex: 1 ,
    valueFormatter: (params) => { 
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },},
    { field: "created_by", headerName: "Created by", flex: 1 },
    { field: "total", headerName: "No of Units", flex: 1 },
    { field: "bundle_size", headerName: "Bundle Type", flex: 1 },
  ];
  const getVouchers = async () => {
    try {
      const res = await GetVouchers(org_id, paginationModel.page, paginationModel.pageSize);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        console.log('row',res)
        setRows(res.data.data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getVouchers();
}, []);

  return (
    <>
    {isModalOpen && <GenerateVoucherModal closeModal={closeModal} />}
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
