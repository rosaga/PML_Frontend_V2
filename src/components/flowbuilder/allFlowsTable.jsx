"use client";
import React, { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import MessageIcon from "@mui/icons-material/Message";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import CreateNewFlowModal from "../modal/createNewFlowModal";
import { useRouter } from "next/navigation";
import { format, formatDistance } from 'date-fns';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const AllFlows = () => {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);
  const [selectedPageSize, setSelectedPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Handle page size change
  const handlePageSizeChange = (event) => {
    const newPageSize = parseInt(event.target.value);
    setSelectedPageSize(newPageSize);
    setPaginationModel({
      pageSize: newPageSize,
      page: 0, 
    });
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pageCount) {
      setCurrentPage(newPage);
      setPaginationModel({
        ...paginationModel,
        page: newPage,
      });
    }
  };

  useEffect(() => {
    if (totalCount > 0) {
      setPageCount(Math.ceil(totalCount / paginationModel.pageSize));
    }
  }, [totalCount, paginationModel.pageSize]);

  useEffect(() => {
    // Clear any URL parameters when loading the AllFlows page
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Check if we have any parameters to clean up
      if (url.searchParams.has('flowName') || url.searchParams.has('id') || url.searchParams.has('tab')) {
        // Keep only necessary parameters for this page (if any)
        // In this case, we're clearing all parameters
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    
    fetchFlows();
  }, [paginationModel]);

  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
    refreshFlows();
  };
  
  const fetchFlows = async () => {
    try {
      let organization_id = null;
      if (typeof window !== 'undefined') {
        organization_id = localStorage.getItem('selectedAccountId');
      }

      const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?eq__organization_id=${organization_id}&size=${paginationModel.pageSize}&page=${paginationModel.page + 1}&orderby=updated_at desc`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.results);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshFlows = async () => {
    setLoading(true);
    try {
      let organization_id = null;
      if (typeof window !== 'undefined') {
        organization_id = localStorage.getItem('selectedAccountId');
      }

      const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?eq__organization_id=${organization_id}&size=${paginationModel.pageSize}&page=${paginationModel.page + 1}&order=updated_at desc`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.results);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing flows:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate icon based on flow type
  const getFlowIcon = (type) => {
    switch (type) {
      case 'WhatsApp':
        return <WhatsAppIcon style={{ color: "#25D366" }} />;
      case 'SMS':
        return <ReceiptIcon style={{ color: "#090A29" }} />;
      case 'Shortcode':
        return <DialpadIcon style={{ color: "#090A29" }} />;
      default:
        return <CodeIcon style={{ color: "#090A29" }} />;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      if (now - date < 24 * 60 * 60 * 1000) {
        return formatDistance(date, now, { addSuffix: true });
      }
      
      return format(date, 'dd/MM/yy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleEditFlow = (e, flow) => {
    e.stopPropagation(); 
    // Include the flow name in the URL for it to be displayed in the builder
    const encodedFlowName = encodeURIComponent(flow.name);
    router.push(`/apps/flowbot/flowbuilder?id=${flow.id}&tab=flowbot&flowName=${encodedFlowName}`);
  };

  // Navigate to flow responses page with flow name
  const handleViewSessions = (e, flow) => {
    e.stopPropagation(); 
    // Encode the flow name to handle special characters
    const encodedFlowName = encodeURIComponent(flow.name);
    router.push(`/apps/flowbot/flowbuilder?id=${flow.id}&tab=responses&flowName=${encodedFlowName}`);
  };
  
  // Handle row click to navigate to responses
  const handleRowClick = (flow) => {
    // Encode the flow name to handle special characters
    const encodedFlowName = encodeURIComponent(flow.name);
    router.push(`/apps/flowbot/flowbuilder?id=${flow.id}&tab=responses&flowName=${encodedFlowName}`);
  };

  const filterOptions = [
    { value: "ilike__name", label: "Flow" },
    { value: "ilike__status", label: "Status" },
    { value: "ilike__type", label: "Type" },
  ];

  const handleSearch = (filter, value) => {
    console.log("Search Filter:", filter, "Value:", value);
    // TODO: Implement actual search functionality with API call
  };

  const handleClearSearch = () => {
    console.log("Search Cleared");
    refreshFlows();
  };

  return (
    <>
      {isModalOpen && <CreateNewFlowModal closeModal={closeModal} />}

      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Chatbots</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
          <PeakButton
            buttonText="Create New Flow"
            icon={AddIcon}
            className="bg-[#E88A17] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={() => openModal()} 
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading flows...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-red-500">
            <p>Error: {error}</p>
          </div>
        ) : flows.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p>No flows found. Create your first flow!</p>
          </div>
        ) : (
          <>
            <table className="min-w-full bg-white">
              <thead className="bg-[#F1F2F3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Flow</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Edited</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flows.map((flow) => (
                  <tr 
                    key={flow.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(flow)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getFlowIcon(flow.type)}
                        <span className="ml-2 text-sm text-gray-700">{flow.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`text-sm ${
                          flow.status === 'ACTIVE' ? 'text-green-600' :
                          flow.status === 'DRAFT' ? 'text-gray-600' :
                          'text-black'
                        }`}
                      >
                        {flow.status === 'DRAFT' ? 'Draft' : 
                         flow.status === 'ACTIVE' ? 'Active' : 
                         flow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(flow.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={(e) => handleEditFlow(e, flow)}
                          className="text-#E88A17 hover:text-blue-800 focus:outline-none"
                          title="Edit Flow"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button 
                          onClick={(e) => handleViewSessions(e, flow)}
                          className="text-#E88A17 hover:text-green-800 focus:outline-none"
                          title="View Sessions"
                        >
                          <MessageIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div className="flex items-center text-sm text-gray-700">
                <span>Rows per page:</span>
                <select 
                  value={selectedPageSize}
                  onChange={handlePageSizeChange}
                  className="ml-2 border border-gray-300 rounded px-2 py-1 focus:outline-none"
                >
                  {pageSizeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  {currentPage * paginationModel.pageSize + 1}-
                  {Math.min((currentPage + 1) * paginationModel.pageSize, totalCount)} of {totalCount}
                </span>
                <div className="flex">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className={`p-1 rounded-full ${currentPage === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    <NavigateBeforeIcon />
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pageCount - 1}
                    className={`p-1 rounded-full ${currentPage >= pageCount - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    <NavigateNextIcon />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AllFlows;