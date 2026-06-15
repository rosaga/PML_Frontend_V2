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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PeakButton from "../button/button";
import SendSmsModal from "../modal/sendSms";
import SendBulkModal from "../modal/sendBulkSms";
import { format, parseISO } from "date-fns";
import { GetSmsCampaigns } from "../../app/api/actions/smsCampaigns/smsCampaigns";
import { getToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import apiUrl from "@/app/api/utils/apiUtils/apiUrl";
import { jwtDecode } from "jwt-decode";

const SmsCampaignsTable = ({ campaignType = "all" }) => {
  const router = useRouter();

  let org_id = null;
  let token = null;
  let email = null;

  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
    token = getToken();
    if (token) {
      const { email: userEmail } = jwtDecode(token);
      email = userEmail;
    }
  }

  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    startDate: "",
    endDate: "",
    id: "",
    description: "",
    serviceId: "",
    content: "",
    groupId: "",
  });

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const openSendSingle = () => setIsSingleModalOpen(true);
  const openSendBulk = () => setIsBulkModalOpen(true);
  const closeModal = () => {
    setIsSingleModalOpen(false);
    setIsBulkModalOpen(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${apiUrl.GET_ACCOUNTS}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  const buildServerFilters = () => {
    const serverParams = {};
    
    if (filters.name.trim()) {
      serverParams['like__name'] = filters.name.trim();
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      serverParams['gte__createdat'] = startDate.toISOString();
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      serverParams['lte__createdat'] = endDate.toISOString();
    }

    // Advanced filters
    if (filters.id.trim()) {
      serverParams['eq__id'] = filters.id.trim();
    }
    
    if (filters.description.trim()) {
      serverParams['like__description'] = filters.description.trim();
    }
    
    if (filters.serviceId.trim()) {
      serverParams['eq__service_id'] = filters.serviceId.trim();
    }
    
    if (filters.content.trim()) {
      serverParams['like__content'] = filters.content.trim();
    }
    
    if (filters.groupId.trim()) {
      serverParams['eq__group_id'] = filters.groupId.trim();
    }
    

    return serverParams;
  };

  const checkIfHasActiveFilters = () => {
    return Object.values(filters).some(value => 
      typeof value === 'string' ? value.trim() !== '' : value !== ''
    );
  };

  const handleApplyFilters = () => {
    const hasFilters = checkIfHasActiveFilters();
    setHasActiveFilters(hasFilters);
    
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    
    getCampaigns(true);
  };

  const handleClearAllFilters = () => {
    setFilters({
      name: "",
      startDate: "",
      endDate: "",
      id: "",
      description: "",
      serviceId: "",
      content: "",
      groupId: "",
    });
    setHasActiveFilters(false);
    setPaginationModel({ pageSize: 10, page: 0 });
  };

  useEffect(() => {
    handleClearAllFilters();
  }, [campaignType]);

  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  const getCampaigns = async (isFilterChange = false) => {
  if (!org_id) {
    console.warn("selected account/org missing, skipping fetch");
    setCampaigns([]);
    setTotal(0);
    return;
  }

  setLoading(true);

  try {
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      org_id,
      orderby: "createdat DESC",
    };

    const now = new Date().toISOString();

    if (campaignType === "scheduled") {
      params['gte__scheduled'] = now;
    } else if (campaignType === "completed") {
      params['lte__scheduled'] = now;
    }

    const serverFilters = buildServerFilters();
    Object.assign(params, serverFilters);

    console.log("Fetching campaigns with params:", params);

    const res = await GetSmsCampaigns(params);

    if (res.errors) {
      console.error("API errors:", res.errors);
      setCampaigns([]);
      setTotal(0);
    } else {
      setCampaigns(res.data || []);
      setTotal(res.count || 0);
    }
  } catch (e) {
    console.error("Fetch error:", e);
    setCampaigns([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    getCampaigns();
  }, [
    org_id,
    campaignType,
    paginationModel,
    isSingleModalOpen,
    isBulkModalOpen,
    hasActiveFilters,
  ]);

  const getDisplayTitle = () => {
    if (campaignType === "scheduled") return "Scheduled Campaigns";
    if (campaignType === "completed") return "Completed Campaigns";
    return "All Campaigns";
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 1, minWidth: 80 },
    {
      field: "name",
      headerName: "CAMPAIGN NAME",
      flex: 1,
      minWidth: 200,
      renderCell: (p) => (
        <span style={{ fontWeight: "550" }}>{p.value || "N/A"}</span>
      ),
    },
    {
      field: "description",
      headerName: "DESCRIPTION",
      flex: 1,
      minWidth: 250,
      renderCell: (p) => (
        <span title={p.value}>
          {p.value
            ? p.value.length > 50
              ? `${p.value.substring(0, 50)}...`
              : p.value
            : "N/A"}
        </span>
      ),
    },
    {
      field: "content",
      headerName: "MESSAGE",
      flex: 1,
      minWidth: 300,
      renderCell: (p) => (
        <span title={p.value}>
          {p.value
            ? p.value.length > 60
              ? `${p.value.substring(0, 60)}...`
              : p.value
            : "N/A"}
        </span>
      ),
    },
    { field: "service_id", headerName: "SENDER ID", flex: 1, minWidth: 120 },
    { field: "group_id", headerName: "GROUP ID", flex: 1, minWidth: 100 },
    {
      field: "createdat",
      headerName: "DATE CREATED",
      flex: 1,
      minWidth: 170,
      valueFormatter: (p) => {
        try {
          if (!p) return "N/A";
          return format(parseISO(p), "yyyy-MM-dd HH:mm");
        } catch {
          return "Invalid Date";
        }
      },
    },
    {
      field: "scheduled",
      headerName: "SCHEDULED",
      flex: 1,
      minWidth: 170,
      valueFormatter: (p) => {
        try {
          if (!p) return "Not Scheduled";
          return format(parseISO(p), "yyyy-MM-dd HH:mm");
        } catch {
          return "Invalid Date";
        }
      },
    },
  ];

  const handleRowClick = (params) => {
    const { requestid, id } = params.row;
    router.push(
      `/apps/sms/campaign-details?campaign_id=${id}&conversation_id=${requestid}`
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="mb-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            Advanced Filters
            {showAdvancedFilters ? (
              <ExpandLessIcon className="ml-1" />
            ) : (
              <ExpandMoreIcon className="ml-1" />
            )}
          </button>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Search campaign name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-3">Advanced Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Campaign ID
                </label>
                <input
                  type="text"
                  value={filters.id}
                  onChange={(e) => handleFilterChange("id", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter campaign ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group ID
                </label>
                <input
                  type="text"
                  value={filters.groupId}
                  onChange={(e) => handleFilterChange("groupId", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter group ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={filters.description}
                  onChange={(e) => handleFilterChange("description", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Search description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={filters.serviceId}
                  onChange={(e) => handleFilterChange("serviceId", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter sender ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message Content
                </label>
                <input
                  type="text"
                  value={filters.content}
                  onChange={(e) => handleFilterChange("content", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Search message content..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleApplyFilters}
            className="bg-[#f97316] text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearAllFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <p className="font-medium text-lg">{getDisplayTitle()}</p>
          <span className="text-sm text-gray-600">Total: {total}</span>
          {hasActiveFilters && (
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
              Filters Applied
            </span>
          )}
        </div>
        <div className="ml-auto flex space-x-4">
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

      {/* DataGrid */}
      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={campaigns}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            onRowClick={handleRowClick}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationMode="server" // Always server-side pagination
            rowCount={total}
            sx={{
              "& .MuiDataGrid-columnHeader": { backgroundColor: "#F1F2F3" },
              "&.MuiDataGrid-root": { border: "none" },
            }}
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </div>

      {isSingleModalOpen && <SendSmsModal closeModal={closeModal} />}
      {isBulkModalOpen && <SendBulkModal closeModal={closeModal} />}
    </div>
  );
};

export default SmsCampaignsTable;