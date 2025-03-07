"use client";
import React, { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import CreateNewFlowModal from "../modal/createNewFlowModal";
import { useRouter } from "next/navigation";
import { format, formatDistance } from 'date-fns';

const AllFlows = () => {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch flows from the backend
  useEffect(() => {
    

    fetchFlows();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
    // Refetch flows after closing modal to show newly created flow
    refreshFlows();
  };
  const fetchFlows = async () => {
    try {
      let organization_id = null;
      if (typeof window !== 'undefined') {
        organization_id = localStorage.getItem('selectedAccountId');
      }

      const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?eq__organization_id=${organization_id}`;
      
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

      const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?organization_id=${organization_id}`;
      
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

  // Format date to human readable format
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If date is invalid, return original string
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // If date is less than 24 hours ago, show relative time (e.g., "5 mins ago")
      if (now - date < 24 * 60 * 60 * 1000) {
        return formatDistance(date, now, { addSuffix: true });
      }
      
      // Otherwise, show formatted date
      return format(date, 'dd/MM/yy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleRowClick = (flow) => {
    router.push(`/apps/flowbot/flowbuilder?id=${flow.id}&tab=responses`);
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
          <table className="min-w-full bg-white">
            <thead className="bg-[#F1F2F3]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Flow</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Edited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {flows.map((flow) => (
                <tr 
                  key={flow.id}
                  onClick={() => handleRowClick(flow)}
                  className="hover:bg-gray-50 cursor-pointer"
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AllFlows;