"use client";

import { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import { format, parseISO } from "date-fns";
import { GetGroups } from "@/app/api/actions/group/group";
import { GetSenderId } from "@/app/api/actions/senderId/senderId";
import PeakButton from "@/components/button/button";
import NewGroupModal from "@/components/modal/newGroup";
import NewSenderID from "@/components/modal/newSenderID";
import "react-toastify/dist/ReactToastify.css";

function senderStatus(state) {
  if (state === "SVC200") return "ACTIVE";
  if (state === "SVC202") return "INACTIVE";
  return state || "Not provided";
}

const GROUP_COLUMNS = [
  { field: "id", headerName: "ID", flex: 1, minWidth: 100 },
  { field: "name", headerName: "Group Name", flex: 1, minWidth: 200 },
  { field: "contact_count", headerName: "No of Contacts", flex: 1, minWidth: 150 },
  { field: "description", headerName: "Description", flex: 1, minWidth: 200 },
  {
    field: "created_at",
    headerName: "Date Created",
    flex: 1,
    minWidth: 160,
    valueFormatter: (value) => {
      try {
        return value ? format(parseISO(value), "yyyy-MM-dd HH:mm") : "Not provided";
      } catch {
        return "Not provided";
      }
    },
  },
];

const SENDER_COLUMNS = [
  { field: "service_id", headerName: "ID", flex: 1, minWidth: 150 },
  { field: "sendername", headerName: "Sender Name", flex: 1, minWidth: 150 },
  { field: "channel", headerName: "Channel", flex: 1, minWidth: 150 },
  { field: "telco", headerName: "Telco", flex: 1, minWidth: 150 },
  {
    field: "service_state",
    headerName: "Status",
    flex: 1,
    minWidth: 150,
    renderCell: ({ value }) => (
      <span className={value === "SVC200" ? "text-green-600" : value === "SVC202" ? "text-red-500" : "text-gray-500"}>
        {senderStatus(value)}
      </span>
    ),
  },
];

const groupRowId = (row) => row.id;
const senderRowId = (row) => row.service_id ?? row.sendername;

export default function ProfileResources({ accountId }) {
  const [view, setView] = useState("groups");
  const [modal, setModal] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const isGroups = view === "groups";
  const groupPage = isGroups ? paginationModel.page + 1 : 1;
  const groupPageSize = isGroups ? paginationModel.pageSize : 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    async function loadResources() {
      try {
        const response = view === "groups"
          ? await GetGroups(accountId, groupPage, groupPageSize)
          : await GetSenderId(accountId);
        const data = view === "groups" ? response.data?.data : response.data;
        if (response.errors || !Array.isArray(data)) {
          throw new Error(`Unable to load your ${view === "groups" ? "groups" : "sender names"}. Please try again.`);
        }
        if (!cancelled) {
          setRows(data);
          setTotal(view === "groups" ? Number(response.data.count) || 0 : data.length);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load company resources. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadResources();
    return () => { cancelled = true; };
  }, [accountId, view, groupPage, groupPageSize, attempt]);

  const changeView = (nextView) => {
    if (view === nextView) return;
    setView(nextView);
    setPaginationModel((value) => ({ ...value, page: 0 }));
    setRows([]);
    setTotal(0);
    setLoading(true);
    setError("");
  };

  const closeModal = () => {
    setModal(null);
    setPaginationModel((value) => ({ ...value, page: 0 }));
    setAttempt((value) => value + 1);
  };

  const openModal = (nextView) => {
    changeView(nextView);
    setModal(nextView);
  };

  return (
    <section aria-labelledby="resources-title">
      <header className="mb-4">
        <h2 id="resources-title" className="text-lg font-medium">Groups &amp; Sender Names</h2>
        <p className="mt-1 text-sm text-gray-500">Manage the groups and sender names used across your company&apos;s products.</p>
      </header>

      <div className="mb-4 flex flex-col gap-4 rounded-lg border-[1.5px] border-gray-200 p-2 sm:flex-row" role="group" aria-label="Company resources">
        {[["groups", "My Groups"], ["senders", "Sender Names"]].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => changeView(value)}
            className={`min-h-10 flex-1 rounded-xl border-[1.5px] px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-[#E88A17] ${view === value ? "border-[#E88A17] bg-white text-[#E88A17]" : "border-transparent bg-[#F1F2F3] hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-medium">{isGroups ? "All Groups" : "All Sender Names"}</h3>
        <div className="flex flex-wrap gap-4">
          <PeakButton
            buttonText="Refresh"
            icon={RefreshIcon}
            className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-[#E88A17]"
            onClick={() => { if (!loading) setAttempt((value) => value + 1); }}
          />
          <PeakButton
            buttonText={isGroups ? "Create New Group" : "New Sender Name"}
            icon={AddIcon}
            className="h-10 rounded-xl bg-[#090A29] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline-[#E88A17]"
            onClick={() => openModal(view)}
          />
        </div>
      </div>

      <div className="mt-4 min-w-0" aria-busy={loading}>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center" role="status">
              <CircularProgress style={{ color: "#E88A17" }} />
              <span className="sr-only">Loading your {isGroups ? "groups" : "sender names"}...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600" role="alert">
              <p>{error}</p>
              <button type="button" className="mt-3 h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-[#E88A17]" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border-[1.5px] border-gray-200 bg-white px-4 py-12 text-center">
              <p className="font-medium">{isGroups ? "No groups yet" : "No sender names yet"}</p>
              <p className="mt-2 text-sm text-gray-500">{isGroups ? "Create a group to keep your contacts together and use them across products." : "Request a sender name for your company to use when sending messages."}</p>
            </div>
          ) : (
            <DataGrid
              key={view}
              aria-label={isGroups ? "Your company's groups" : "Your company's sender names"}
              autoHeight
              rows={rows}
              columns={isGroups ? GROUP_COLUMNS : SENDER_COLUMNS}
              getRowId={isGroups ? groupRowId : senderRowId}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              paginationMode={isGroups ? "server" : "client"}
              rowCount={isGroups ? total : undefined}
              disableRowSelectionOnClick
              sx={{
                "& .MuiDataGrid-columnHeader": { backgroundColor: "#F1F2F3" },
                "&.MuiDataGrid-root": { border: "none" },
              }}
              slots={{ toolbar: GridToolbar }}
            />
          )}
      </div>

      {modal === "groups" && <NewGroupModal closeModal={closeModal} successActionLabel="View my groups" onSuccessAction={closeModal} />}
      {modal === "senders" && <NewSenderID closeModal={closeModal} />}
    </section>
  );
}
