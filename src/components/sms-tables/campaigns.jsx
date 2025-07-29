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
  const [searchParams, setSearchParams] = useState({});
  const [total, setTotal] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const [basicFilters, setBasicFilters] = useState({
    name: "",
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    id: "",
    description: "",
    serviceId: "",
    content: "",
    groupId: "",
    organizationId: "",
  });
  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
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

  const handleBasicFilterChange = (key, val) =>
    setBasicFilters((p) => ({ ...p, [key]: val }));
  const handleAdvancedFilterChange = (key, val) =>
    setAdvancedFilters((p) => ({ ...p, [key]: val }));
  const handleDateFilterChange = (key, val) =>
    setDateFilters((p) => ({ ...p, [key]: val }));

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${apiUrl.GET_ACCOUNTS}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      const uniqueOrgIds = [...new Set(campaigns.map(c => c.org_id).filter(Boolean))];
      setOrganizations(uniqueOrgIds.map(id => ({ id, name: `Organization ${id}` })));
    }
  };

  const handleApplyFilters = () => {
    const params = {};

    // basic filters
    if (basicFilters.name) params.like__name = basicFilters.name;

    // advanced filters
    if (advancedFilters.id) params.eq__id = advancedFilters.id;
    if (advancedFilters.description)
      params.ilike__description = advancedFilters.description;
    if (advancedFilters.serviceId)
      params.eq__service_id = advancedFilters.serviceId;
    if (advancedFilters.content)
      params.ilike__content = advancedFilters.content;
    if (advancedFilters.groupId) params.eq__group_id = advancedFilters.groupId;
    if (advancedFilters.organizationId) params.eq__org_id = advancedFilters.organizationId;

    // date filters
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      startDate.setHours(0, 0, 0, 0);
      params.gte__scheduled = startDate.toISOString();
    }
    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      endDate.setHours(23, 59, 59, 999);
      params.lte__scheduled = endDate.toISOString();
    }

    setSearchParams(params);
  };

  const handleClearAllFilters = () => {
    setBasicFilters({ name: "" });
    setAdvancedFilters({
      id: "",
      description: "",
      serviceId: "",
      content: "",
      groupId: "",
      organizationId: "",
    });
    setDateFilters({ startDate: "", endDate: "" });
    setSearchParams({});
  };

  useEffect(() => {
    handleClearAllFilters();
    setPaginationModel({ pageSize: 10, page: 0 });
  }, [campaignType]);

  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  const getCampaigns = async () => {
    if (!email) return console.warn("user email missing, skipping fetch");
    setLoading(true);
  
    const hasFilters = Object.keys(searchParams).length > 0;
  
    const basePaging = hasFilters
      ? { page: 1, limit: 10000 }
      : { page: paginationModel.page + 1, limit: paginationModel.pageSize };
  
    const params = {
      ...basePaging,
      email,
      ...searchParams,
    };
  
    const now = new Date().toISOString();
    if (campaignType === "scheduled" && !params.gte__scheduled)
      params.gte__scheduled = now;
    if (campaignType === "completed" && !params.lte__scheduled)
      params.lte__scheduled = now;
  
    try {
      const res = await GetSmsCampaigns(params);
      if (res.errors) console.error(res.errors);
      setCampaigns(res.data || []);
      setTotal(res.count || 0);
      if (hasFilters && paginationModel.page !== 0) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    getCampaigns();
  }, [
    isSingleModalOpen,
    isBulkModalOpen,
    searchParams,
    campaignType,
    paginationModel,
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
      field: "org_id", 
      headerName: "ORGANIZATION", 
      flex: 1, 
      minWidth: 120,
      renderCell: (params) => {
        const org = organizations.find(o => o.id === params.value);
        return <span>{org ? org.name : params.value || "N/A"}</span>;
      }
    },
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
              value={basicFilters.name}
              onChange={(e) =>
                handleBasicFilterChange("name", e.target.value)
              }
              className="w-full p-2 border rounded"
              placeholder="Search campaign name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilters.startDate}
              onChange={(e) =>
                handleDateFilterChange("startDate", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateFilters.endDate}
              onChange={(e) =>
                handleDateFilterChange("endDate", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Advanced */}
        {showAdvancedFilters && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-3">Advanced Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Organization
                </label>
                <select
                  value={advancedFilters.organizationId}
                  onChange={(e) =>
                    handleAdvancedFilterChange("organizationId", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group ID
                </label>
                <input
                  type="text"
                  value={advancedFilters.groupId}
                  onChange={(e) =>
                    handleAdvancedFilterChange("groupId", e.target.value)
                  }
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
                  value={advancedFilters.description}
                  onChange={(e) =>
                    handleAdvancedFilterChange("description", e.target.value)
                  }
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
                  value={advancedFilters.serviceId}
                  onChange={(e) =>
                    handleAdvancedFilterChange("serviceId", e.target.value)
                  }
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
                  value={advancedFilters.content}
                  onChange={(e) =>
                    handleAdvancedFilterChange("content", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Search message content..."
                />
              </div>
            </div>
          </div>
        )}

        {/* buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleApplyFilters}
            className="bg-[#f97316] text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearAllFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
          {advancedFilters.organizationId && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Filtered by Organization: {organizations.find(o => o.id === advancedFilters.organizationId)?.name || advancedFilters.organizationId}
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
            paginationMode={
              Object.keys(searchParams).length > 0 ? "client" : "server"
            }
            rowCount={
              Object.keys(searchParams).length > 0 ? undefined : total
            }
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