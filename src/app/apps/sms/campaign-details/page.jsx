"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { GetSmsCampaignMessages } from "@/app/api/actions/smsCampaigns/smsCampaigns";
import { format, parseISO } from "date-fns";
import Image from "next/image";


const successStatuses = [
    "SUCCESS",
    "DeliveredToTerminal",
    "Recieved Pending Confirmation",
    "Accepted for processing",
  ];

const CampaignMessagesPage = () => {

  const searchParams     = useSearchParams();
  const campaignId       = searchParams.get("campaign_id");
  const conversationId   = searchParams.get("conversation_id");
  const orgId            =
    typeof window !== "undefined" ? localStorage.getItem("selectedAccountId") : null;

  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });

  const [success, setSuccess] = useState(0);
  const [failed,  setFailed]  = useState(0);

  const fetchMessages = async () => {
    if (!orgId || !conversationId) return;

    setLoading(true);

    const res = await GetSmsCampaignMessages({
      org_id: orgId,
      page  : pagination.page + 1,
      limit : pagination.pageSize,
      eq__conversation_id: conversationId,
    });

    const mappedRows = (res.data || []).map((m) => ({
      id      : m.id,
      phone   : m.destination,
      status  : m.status_desc,
      sent_at : m.createdat,
      content : m.content,
    }));

    const successCnt = mappedRows.filter((r) =>
        successStatuses.includes(r.status)
      ).length;

      setRows(mappedRows);
      setTotal(mappedRows.length);
      setSuccess(successCnt);
      setFailed(mappedRows.length - successCnt);
      setLoading(false);
    };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, pagination]);

  const columns = [
    { field: "id",     headerName: "ID",      minWidth: 80,  flex: 1 },
    { field: "phone",  headerName: "PHONE",   minWidth: 150, flex: 1 },
    { field: "status", headerName: "STATUS",  minWidth: 120, flex: 1 },
    {
      field: "content",
      headerName: "MESSAGE",
      minWidth: 300,
      flex: 2,
      renderCell: (p) => (
        <span title={p.value}>
          {p.value?.length > 60 ? `${p.value.slice(0, 60)}…` : p.value}
        </span>
      ),
    },
    {
      field: "sent_at",
      headerName: "SENT AT",
      minWidth: 170,
      flex: 1,
      valueFormatter: (p) =>
        p && typeof p === "string"
          ? format(parseISO(p), "yyyy-MM-dd HH:mm")
          : "—",
    },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen flex flex-col">
      <h2 className="text-xl font-semibold mb-4">
        Campaign&nbsp;{campaignId}&nbsp;–&nbsp;Messages
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Total Messages" value={total} icon="/images/Icon-0.svg" />
        <Card label="Delivered / Success" value={success} icon="/images/Icon-1.svg" />
        <Card label="Failed / Pending" value={failed} icon="/images/Icon-1.svg" />
      </div>


      <DataGrid
        rows                   = {rows}
        columns                = {columns}
        getRowId               = {(row) => row.id}
        loading                = {loading}
        paginationModel        = {pagination}
        onPaginationModelChange= {setPagination}
        paginationMode         = "server"
        rowCount               = {total}
        pageSizeOptions        = {[5, 10, 25]}
        slots                  = {{ toolbar: GridToolbar }}
        sx={{
          "& .MuiDataGrid-columnHeader": { backgroundColor: "#F1F2F3" },
          "&.MuiDataGrid-root"          : { border: "none" },
          flexGrow                      : 1,
        }}
      />
    </div>
  );
};

const Card = ({ label, value, icon }) => (
    <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-500">{label}</div>
        <Image
          className="w-10 h-10 rounded-lg"
          width={40}
          height={40}
          src={icon}
          alt={label}
          priority
        />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );

export default CampaignMessagesPage;
