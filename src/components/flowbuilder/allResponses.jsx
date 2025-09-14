import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import { format, parseISO } from "date-fns";
import axios from "axios";
import { MoreVertical } from 'lucide-react';
import RequestUnitsModal from "../modal/requestUnits";
import ResponseDetailsModal from "../modal/responseDetails";
import { getToken } from "@/utils/auth";
import { GetCampaigns } from "@/app/api/actions/campaigns/campaigns";

const AllResponses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModelOpen, setIsScheduleModelOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [responses, setResponses] = useState([]);
  const [flowId, setFlowId] = useState(null);
  const [flowName, setFlowName] = useState('');
  const [error, setError] = useState(null);

  // Get flowId and flowName from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const id = url.searchParams.get("id");
      const name = url.searchParams.get("flowName");
      
      setFlowId(id);
      
      // If flowName is in the URL, decode it and use it
      if (name) {
        setFlowName(decodeURIComponent(name));
      }
    }
  }, []);

  // Get organization ID from localStorage
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filterOptions = [
    { value: "ilike__phone_number", label: "Phone Number" },
    { value: "ilike__status", label: "Status" },
    { value: "ilike__service_code", label: "Service Code" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  // Function to refresh the page with clean parameters
  const refreshPage = () => {
    // Keep only the necessary parameters (id and tab) and remove others
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const id = url.searchParams.get("id");
      const tab = url.searchParams.get("tab");
      
      // Create a new URL with only the required parameters
      let newUrl = `${window.location.pathname}?id=${id}&tab=${tab}`;
      window.history.replaceState({}, '', newUrl);
      
      // Refresh the sessions data
      fetchSessions();
    }
  };

  const handleClearSearch = () => {
    setSearchParams({});
    refreshPage();
  };

  // Fetch sessions data from the backend
  const fetchSessions = async () => {
    if (!flowId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Construct URL with pagination and search parameters
      let url = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/session?eq__flow_id=${flowId}`;
      
      // Add pagination parameters
      url += `&size=${paginationModel.pageSize}&page=${paginationModel.page + 1}&orderby=created_at desc`;

      // Add search parameters if there are any
      if (Object.keys(searchParams).length > 0) {
        const searchParamsString = Object.entries(searchParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        
        url += `&${searchParamsString}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Sessions data:", data);
      
      // Format the data to match DataGrid requirements
      const formattedData = data.results.map(session => ({
        id: session.id,
        date: formatDate(session.created_at),
        serviceCode: session.channel || 'N/A',
        phoneNumber: session.msisdn || 'N/A',
        variable: getVariableName(session),
        duration: calculateDuration(session.created_at, session.updated_at),
        status: session.status || 'Active',
        flowName: flowName || 'Unknown', // Use the flow name from URL param or fallback
        rawData: session // Store raw data for modal display
      }));

      setResponses(formattedData);
      setTotal(data.count || 0);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy h:mma');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Calculate session duration
  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate || Date.now());
      const durationMs = end - start;
      const seconds = Math.floor(durationMs / 1000);
      
      if (seconds < 60) {
        return `${seconds}s`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'N/A';
    }
  };

  // Extract variable name from session data
  const getVariableName = (session) => {
    try {
      if (session.variables && Object.keys(session.variables).length > 0) {
        // Get the first variable name
        return Object.keys(session.variables)[0];
      }
      return 'None';
    } catch (error) {
      console.error('Error getting variable name:', error);
      return 'N/A';
    }
  };

  useEffect(() => {
    if (flowId) {
      fetchSessions();
      
      // Store the flowName in localStorage for persistence
      if (flowName) {
        localStorage.setItem('currentFlowName', flowName);
      }
    }
  }, [flowId, paginationModel.page, paginationModel.pageSize, searchParams]);
  
  // When the component unmounts or user navigates away, consider clearing the stored flow name
  useEffect(() => {
    return () => {
      localStorage.removeItem('currentFlowName');
    };
  }, []);

  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1.2,
      minWidth: 180,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'serviceCode', 
      headerName: 'Service Code', 
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Phone Number', 
      flex: 1,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'duration', 
      headerName: 'Duration', 
      flex: 1,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div className={`${
          params.value === 'Success' || params.value === 'COMPLETED' ? 'bg-green-400' :
          params.value === 'Failed' || params.value === 'FAILED' ? 'bg-red-400' :
          params.value === 'IN_PROGRESS' ? 'bg-blue-400' :
          'bg-gray-400'
        } text-white px-3 py-2 rounded-full text-sm flex items-center justify-center`}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'flowName', 
      headerName: 'Flow Name', 
      flex: 1,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <button 
          className="p-2 hover:bg-gray-100 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedResponse(params.row.rawData);
            openModal();
          }}
        >
          <MoreVertical size={20} />
        </button>
      )
    }
  ];

  const handleRowClick = (params) => {
    setSelectedResponse(params.row.rawData);
    openModal();
  };

  return (
    <>
      {isModalOpen && selectedResponse && (
        <ResponseDetailsModal 
          flowData={selectedResponse} 
          closeModal={closeModal} 
        />
      )}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col">
          <p className="mt-4 font-medium text-lg">All Responses</p>
          {flowName && (
            <p className="text-gray-600 text-sm">
              Flow: {flowName}
            </p>
          )}
        </div>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch 
            filterOptions={filterOptions} 
            selectedFilter="" 
            onSearch={handleSearch} 
            onClearSearch={handleClearSearch}
          />
        </div>
      </div>

      <div className="mt-4">
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
            Error: {error}
          </div>
        )}
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={responses}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            onRowClick={handleRowClick}
            rowCount={total}
            paginationMode="server"
            disableRowSelectionOnClick
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

export default AllResponses;