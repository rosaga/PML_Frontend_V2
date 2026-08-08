"use client";

import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { format, parseISO } from "date-fns";

import { getPayments } from "@/app/api/actions/payments/payments";
import PeakSearch from "@/components/search/search";
import DownloadAllButton from "@/components/button/DownloadAllButton";

// const maskPhone = (phone) =>
//   phone && phone.length > 5
//     ? phone.slice(0, 2) + "*".repeat(phone.length - 5) + phone.slice(-3)
//     : phone;

export default function PaymentsPage() {
  const org_id =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedAccountId")
      : null;

  const [payments, setPayments] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({});

  const columns = [
    { field: "id", headerName: "Payment ID", flex: 1, minWidth: 110 },

    { field: "created_at", headerName: "Created At", flex: 1, minWidth:150,
        valueFormatter: (params) => {
          try {
            const date = parseISO(params);
            return format(date, "yyyy-MM-dd HH:mm");
          } catch (error) {
            return "Invalid Date";
          }
        }, },

    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => {
        const color =
          value === "SUCCESS" ? "green" : value === "FAILED" ? "red" : "black";
        return <span style={{ color }}>{value}</span>;
      },
    },
    { field: "amount", headerName: "Amount", flex: 1, minWidth: 100 },

    { field: "MSISDN", headerName: "Phone", flex: 1, minWidth: 100 },
    // {
    //   field: "MSISDN",
    //   renderHeader: () => (
    //     <div style={{ display: "flex", alignItems: "center" }}>
    //       <span style={{ marginRight: 4 }}>Phone Number</span>
    //       <IconButton
    //         size="small"
    //         onClick={() => setHidePhone((h) => !h)}
    //         title={hidePhone ? "Show" : "Hide"}
    //       >
    //         {hidePhone ? (
    //           <VisibilityIcon fontSize="small" />
    //         ) : (
    //           <VisibilityOffIcon fontSize="small" />
    //         )}
    //       </IconButton>
    //     </div>
    //   ),
    //   flex: 1,
    //   minWidth: 180,
    //   renderCell: ({ value }) => (hidePhone ? maskPhone(value) : value),
    // },

    {
      field: "status_desc",
      headerName: "Status Description",
      flex: 1,
      minWidth: 200,
    },
  ];

  const filterOptions = [
    { value: "ilike__package", label: "Package" },
    { value: "eq__status", label: "Status" },
    { value: "ilike__MSISDN", label: "Phone" },
    { value: "gte__amount", label: "Amount ≥" },
  ];

  const fetchPayments = async () => {
    setLoading(true);
    const res = await getPayments(
      org_id,
      pageInfo.page + 1,
      pageInfo.pageSize,
      {
        ...search,
        order_by: "created_at",
        order: "desc",
      }
    );
    if (!res.errors) {
      setPayments(res.data);
      setTotal(res.count);
    }
    setLoading(false);
  };

  const fetchAllPayments = async () => {
    const res = await getPayments(org_id, 1, total, {
      ...search,
      order__created_at: "desc",
    });
    if (res.errors) return [];
    return res.data.map((p) => ({
      "Payment ID": p.id,
      "Date Created": p.created_at,
      Package: p.package,
      Amount: p.amount,
      MSISDN: p.MSISDN,
      Status: p.status,
      "Status Description": p.status_desc,
    }));
  };

  useEffect(() => {
    if (org_id) fetchPayments();
  }, [org_id, pageInfo, search]);

  return (
    <div className="lg:ml-64 p-4">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Payments</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={(filter, value) => setSearch({ [filter]: value })}
            onClearSearch={() => setSearch({})}
          />
        </div>
      </div>

      {/* DataGrid */}
      <div className="mt-4" style={{ width: "100%" }}>
        <DataGrid
          getRowId={(row) => row.id}

          rows={payments}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={pageInfo}
          onPaginationModelChange={setPageInfo}

          initialState={{
            sorting: {
              sortModel: [{ field: "created_at", sort: "desc" }],
            },
          }}

          sx={{
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#F1F2F3" },
            "&.MuiDataGrid-root": { border: "none" },
          }}
          slots={{
            toolbar: () => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 8,
                }}
              >
                <GridToolbar />
                <DownloadAllButton
                  fetchAllData={fetchAllPayments}
                  filename="payments_data.csv"
                />
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
