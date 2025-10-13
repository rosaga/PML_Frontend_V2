"use client";
import React, { useMemo, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import GenerateAirtimeVoucherModal from "../modal/generateAirtimeVoucher";
import { format, parseISO } from "date-fns";

// ===== Dummy Data =====
const DUMMY_VOUCHERS = [
  { id: "VCH-001", created_at: "2025-10-01T09:15:00Z", created_by: "Ted Test", total: 120, airtime_amount: 50 },
  { id: "VCH-002", created_at: "2025-10-02T11:30:00Z", created_by: "Edwin Aringo",   total: 80,  airtime_amount: 100 },
  { id: "VCH-003", created_at: "2025-10-03T14:05:00Z", created_by: "Ted Test",        total: 50,  airtime_amount: 20 },
  { id: "VCH-004", created_at: "2025-10-04T08:45:00Z", created_by: "Edwin Aringo",    total: 200, airtime_amount: 10 },
  { id: "VCH-005", created_at: "2025-10-05T16:10:00Z", created_by: "Ted Test",            total: 150, airtime_amount: 200 },
  { id: "VCH-006", created_at: "2025-10-06T10:20:00Z", created_by: "Operations",        total: 300, airtime_amount: 50 },
  { id: "VCH-007", created_at: "2025-10-07T12:00:00Z", created_by: "Ted Test",      total: 35,  airtime_amount: 100 },
  { id: "VCH-008", created_at: "2025-10-08T18:40:00Z", created_by: "Edwin Aringo",      total: 90,  airtime_amount: 20 },
  { id: "VCH-009", created_at: "2025-10-09T07:55:00Z", created_by: "Ted Test",         total: 60,  airtime_amount: 500 },
  { id: "VCH-010", created_at: "2025-10-10T13:25:00Z", created_by: "Edwin Aringo",      total: 55,  airtime_amount: 50 },
  { id: "VCH-011", created_at: "2025-10-11T15:00:00Z", created_by: "Ted Test",          total: 40,  airtime_amount: 100 },
];

const AirtimeVouchersTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters (use "Airtime Amount (KES)" instead of bundle size)
  const filterOptions = [
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__airtime_amount", label: "Airtime Amount (KES)" },
  ];
  const [searchParams, setSearchParams] = useState({});
  const handleSearch = (filter, value) => setSearchParams({ [filter]: value });
  const handleClearSearch = () => setSearchParams({});

  // Client pagination
  const [paginationModel, setPaginationModel] = useState({ pageSize: 10, page: 0 });

  // Local filtering
  const rows = useMemo(() => {
    const entries = Object.entries(searchParams || {});
    if (!entries.length) return DUMMY_VOUCHERS;

    return DUMMY_VOUCHERS.filter((row) =>
      entries.every(([key, val]) => {
        if (val === undefined || val === null || val === "") return true;
        const v = String(val).toLowerCase();

        if (key === "ilike__created_by") {
          return String(row.created_by || "").toLowerCase().includes(v);
        }
        if (key === "eq__airtime_amount") {
          const numeric = Number(v);
          return Number(row.airtime_amount) === numeric;
        }
        return true;
      })
    );
  }, [searchParams]);

  const columns = [
    { field: "id", headerName: "Voucher ID", flex: 1, minWidth: 120 },
    {
      field: "created_at",
      headerName: "Date Created",
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        try {
          const date = parseISO(params);
          return format(date, "yyyy-MM-dd HH:mm");
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
    { field: "created_by", headerName: "Created By", flex: 1, minWidth: 200 },
    { field: "total", headerName: "No. of Units", flex: 1, minWidth: 140, type: "number" },
    {
      field: "airtime_amount",
      headerName: "Airtime Amount (KES)",
      flex: 1,
      minWidth: 190,
      type: "number",
      valueFormatter: ({ value }) =>
        typeof value === "number" ? value.toLocaleString("en-KE") : value,
    },
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {isModalOpen && <GenerateAirtimeVoucherModal closeModal={closeModal} />}

      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Airtime Vouchers</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
          <PeakButton
            buttonText="Generate Airtime Voucher"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
        </div>
      </div>

      <div className="mt-4" style={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="client"
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
    </>
  );
};

export default AirtimeVouchersTable;
