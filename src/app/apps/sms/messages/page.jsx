"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridToolbar,
} from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import InviteUserModal from "../../../../components/modal/inviteUser";
import SendSmsModal from "../../../../components/modal/sendSms";
import SendBulkModal from "../../../../components/modal/sendBulkSms";
import apiUrl from "../../../api/utils/apiUtils/apiUrl";
import { messagesAction } from "../../../api/actions/messages/messagesAction";
import { getToken } from "@/utils/auth";

const Messages = () => {
  let org_id = null;
  let token = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
    token = getToken();
  }

  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});
  const [total, setTotal] = useState(0);

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const openSendSingle = () => {
    setIsSingleModalOpen(true);
  };

  const openSendBulk = () => {
    setIsBulkModalOpen(true);
  };

  const closeModal = () => {
    setIsSingleModalOpen(false);
    setIsBulkModalOpen(false);
  };

  const filterOptions = [
    { value: "ilike__firstName", label: "First Name" },
    { value: "ilike__lastName", label: "Last Name" },
    { value: "ilike__email", label: "Email" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const getMessages = () => {
    if (org_id) {
      messagesAction({ org_id, page, limit })
        .then((res) => {
          if (res.errors) {
            console.log("AN ERROR HAS OCCURED");
          } else {
            setMessages(res.data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("org_id is null or undefined. Skipping API call.");
    }
  };

  useEffect(() => {
    getMessages();
  }, [isSingleModalOpen, isBulkModalOpen, searchParams]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1, minWidth: 150 },
    { field: "source", headerName: "SOURCE", flex: 1, minWidth: 150 },
    { field: "destination", headerName: "DESTINATION", flex: 1, minWidth: 150 },
    { field: "content", headerName: "CONTENT", flex: 1, minWidth: 200 },
    { field: "channel", headerName: "CHANNEL", flex: 1, minWidth: 150 },
    { field: "direction", headerName: "DIRECTION", flex: 1, minWidth: 150 },
    { field: "status_desc", headerName: "STATUS", flex: 1, minWidth: 200 },
    { field: "createdat", headerName: "DATE", flex: 1, minWidth: 150 },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Messages</p>
              <div className="ml-auto flex space-x-4">
                <PeakSearch
                  filterOptions={filterOptions}
                  selectedFilter=""
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                />
                <PeakButton
                  buttonText="Send SMS"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                  onClick={openSendSingle}
                />
                <PeakButton
                  buttonText="Send Bulk"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                  onClick={openSendBulk}
                />
              </div>
            </div>

            <div className="mt-4">
              <div style={{ width: "100%" }}>
                <DataGrid
                  rows={messages}
                  columns={columns}
                  loading={loading}
                  getRowId={(row) => row.id}
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
          </div>
        </div>
      </div>
      {isSingleModalOpen && <SendSmsModal closeModal={closeModal} />}
      {isBulkModalOpen && <SendBulkModal closeModal={closeModal} />}
    </div>
  );
};

export default Messages;
