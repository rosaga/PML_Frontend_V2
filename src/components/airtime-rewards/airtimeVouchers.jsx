"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import GenerateAirtimeVoucherModal from "../modal/generateAirtimeVoucher";
import { format, parseISO } from "date-fns";
import { GetAirtimeVouchers } from "@/app/api/actions/vouchers/vouchers";

const AirtimeVouchersTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});

  const filterOptions = [
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__airtime_amount", label: "Airtime Amount (KES)" },
  ];

  const handleSearch = (filter, value) => {
    console.log("[AirtimeVouchersTable] handleSearch:", { filter, value });
    setSearchParams(value ? { [filter]: value } : {});
  };

  const handleClearSearch = () => {
    console.log("[AirtimeVouchersTable] handleClearSearch");
    setSearchParams({});
  };

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }
  console.log("[AirtimeVouchersTable] org_id from localStorage:", org_id);

const columns = [
  { field: "id", headerName: "Voucher ID", flex: 1, minWidth: 120 },
  {
    field: "created_at",
    headerName: "Date Created",
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) => {
      try {
        const raw = params?.value ?? params;
        if (!raw) return "";
        const date = parseISO(raw);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        console.warn("[AirtimeVouchersTable] Invalid created_at value:", params);
        return "Invalid Date";
      }
    },
  },
  { field: "created_by", headerName: "Created By", flex: 1, minWidth: 200 },
  {
    field: "total",
    headerName: "No. of Units",
    flex: 1,
    minWidth: 140,
    type: "number",
  },
  {
    field: "airtime_amount",
    headerName: "Airtime Amount (KES)",
    flex: 1,
    minWidth: 190,
    type: "number",
    valueFormatter: (params) => {
      const value = params?.value;
      if (typeof value === "number") return value.toLocaleString("en-KE");
      if (value == null) return "";
      return value;
    },
  },
];


  const getAirtimeVouchers = async () => {
    if (!org_id) {
      console.warn(
        "[AirtimeVouchersTable] No org_id found (selectedAccountId) – skipping fetch."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const page = paginationModel.page + 1;
      const size = paginationModel.pageSize;

      console.log("[AirtimeVouchersTable] Fetching vouchers with:", {
        org_id,
        page,
        size,
        searchParams,
      });

      const res = await GetAirtimeVouchers(org_id, page, size, searchParams);

      console.log("[AirtimeVouchersTable] Raw API response:", res);

      if (res.errors) {
        console.error("[AirtimeVouchersTable] API error:", res.errors);
        setData([]);
        setTotal(0);
        return;
      }

      const payload = res.data;
      console.log("[AirtimeVouchersTable] Parsed payload:", payload);

      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.results)
        ? payload.results
        : [];

      const totalCount =
        payload.count ??
        payload.total ??
        payload.pagination?.total ??
        items.length;

      console.log("[AirtimeVouchersTable] items & total:", {
        itemsLength: items.length,
        totalCount,
      });

      setData(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("[AirtimeVouchersTable] Exception in getAirtimeVouchers:", err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AirtimeVouchersTable] useEffect deps changed:", {
      org_id,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      searchParams,
      isModalOpen,
    });
    getAirtimeVouchers();
  }, [org_id, paginationModel.page, paginationModel.pageSize, isModalOpen, searchParams]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  console.log("[AirtimeVouchersTable] render:", {
    rowsLength: data.length,
    total,
    loading,
  });

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

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={data}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={(model) => {
              console.log(
                "[AirtimeVouchersTable] paginationModel changed:",
                model
              );
              setPaginationModel(model);
            }}
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

export default AirtimeVouchersTable;
