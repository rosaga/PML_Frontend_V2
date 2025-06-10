"use client";
import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FormControl from "@mui/material/FormControl";
import Chip from "@mui/material/Chip";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsIcon from "@mui/icons-material/Sms";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import CreateChannelModal from "../modal/createShortCodeModal";
import PeakSearch from "../search/search";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { format, formatDistance } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import IconButton from "@mui/material/IconButton";

const ChannelTable = () => {
  const [openCard, setOpenCard] = useState(null);
  const [selectedFlows, setSelectedFlows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [availableFlows, setAvailableFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [flowSearchTerm, setFlowSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalChannels, setTotalChannels] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);
  
  const [searchParams, setSearchParams] = useState({});

  // Get organization ID from localStorage
  let organization_id = null;
  if (typeof window !== 'undefined') {
    organization_id = localStorage.getItem('selectedAccountId');
  }

  // Fetch channels when component mounts or pagination/search changes
  useEffect(() => {
    fetchChannels();
  }, [currentPage, pageSize, searchParams]);

  // Fetch all flows once
  useEffect(() => {
    fetchAllFlows();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Build query parameters
      const params = new URLSearchParams({
        eq__organization_id: organization_id,
        page: currentPage,
        size: pageSize,
        orderby: "updated_at desc"
      });

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/channels?${params.toString()}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setChannels(response.data.results || []);
      setTotalChannels(response.data.count || response.data.total || 0);
      setTotalPages(Math.ceil((response.data.count || response.data.total || 0) / pageSize));
      setError(null);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError("Failed to load channels. Please try again.");
      toast.error("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all flows for dropdown selection
  const fetchAllFlows = async () => {
    try {
      setFlowsLoading(true);
      let allFlows = [];
      let page = 1;
      let hasMore = true;
      const fetchPageSize = 100;

      while (hasMore) {
        const response = await fetch(
          `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?eq__organization_id=${organization_id}&page=${page}&size=${fetchPageSize}&orderby=updated_at desc`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch flows');
        }

        const data = await response.json();
        const pageResults = data.results || [];
        
        if (pageResults.length === 0) {
          hasMore = false;
        } else {
          allFlows = [...allFlows, ...pageResults];
          
          if (pageResults.length < fetchPageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }

        if (page > 100) {
          hasMore = false;
        }
      }

      setAvailableFlows(allFlows);
    } catch (err) {
      console.error('Error fetching flows:', err);
      toast.error("Failed to load flows");
    } finally {
      setFlowsLoading(false);
    }
  };

  const toggleCard = (cardId) => {
    setOpenCard(openCard === cardId ? null : cardId);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
    fetchChannels();
  };

  const handleFlowChange = (channelId, flowId) => {
    setSelectedFlows({ ...selectedFlows, [channelId]: flowId });
  };

  // Filter flows based on search term
  const filteredFlows = availableFlows.filter(flow =>
    flow.name.toLowerCase().includes(flowSearchTerm.toLowerCase()) ||
    (flow.description && flow.description.toLowerCase().includes(flowSearchTerm.toLowerCase()))
  );

  // Attach flow to channel
  const attachFlow = async (channelId, flowId) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/channels`,
        {
          flow_id: flowId,
          id: channelId,
        },
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 202) {
        toast.success("Flow attached successfully!");
        fetchChannels(); 
        setOpenCard(null); 
        setSelectedFlows(prev => ({ ...prev, [channelId]: "" })); 
      }
    } catch (error) {
      console.error("Error attaching flow:", error);
      toast.error("Failed to attach flow. Please try again.");
    }
  };

  // Search functionality
  const filterOptions = [
    { value: "ilike__type", label: "Channel Type" },
    { value: "ilike__shortcode", label: "Shortcode/Number" },
    { value: "ilike__status", label: "Status" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
    setCurrentPage(1); 
  };

  const handleClearSearch = () => {
    setSearchParams({});
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setOpenCard(null); 
    }
  };

  const handlePageSizeChange = (event) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1);
    setOpenCard(null);
  };

  // Get the appropriate icon based on channel type
  const getChannelIcon = (type) => {
    const upperType = type.toUpperCase();
    
    switch (upperType) {
      case 'WHATSAPP':
        return <WhatsAppIcon style={{ color: "#25D366" }} />;
      case 'SHORTCODE':
        return <SmsIcon style={{ color: "#9c27b0" }} />;
      case 'USSD':
        return <DialpadIcon style={{ color: "#090A29" }} />;
      default:
        return <CodeIcon style={{ color: "#090A29" }} />;
    }
  };

  const timeAgo = (dateString) => {
    try {
      const created = new Date(dateString);
      const now = new Date();
      
      if (isNaN(created.getTime())) {
        return "Unknown date";
      }
      
      return `Created ${formatDistance(created, now, { addSuffix: true })}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Date unavailable";
    }
  };

  // Get flow name by ID
  const getFlowNameById = (flowId) => {
    const flow = availableFlows.find(flow => flow.id === flowId);
    return flow ? flow.name : "Unknown flow";
  };

  return (
    <>
      <ToastContainer />
      {isModalOpen && <CreateChannelModal closeModal={closeModal} />}
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="mt-4 font-medium text-lg">
            All Channels {totalChannels > 0 && `(${totalChannels})`}
          </p>
          <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <PeakSearch
              filterOptions={filterOptions}
              selectedFilter=""
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
            />
            <PeakButton
              buttonText="Create Channel"
              icon={AddIcon}
              className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
              onClick={openModal} 
            />
          </div>
        </div>


        {Object.keys(searchParams).length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {Object.entries(searchParams).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${filterOptions.find(f => f.value === key)?.label}: ${value}`}
                  onDelete={handleClearSearch}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading channels...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-red-500">
            <p>{error}</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p>
              {Object.keys(searchParams).length > 0 
                ? "No channels found matching your search criteria." 
                : "No channels found. Create your first channel!"
              }
            </p>
          </div>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                margin: "8px 0",
                padding: "16px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getChannelIcon(channel.type)}
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
                      {channel.type.toUpperCase()}
                    </p>
                    {channel.shortcode && (
                      <p style={{ margin: "4px 0", color: channel.type.toUpperCase() === "SHORTCODE" ? "#9c27b0" : 
                                                channel.type.toUpperCase() === "WHATSAPP" ? "#25D366" : "#555" }}>
                        {channel.type.toUpperCase() === "SHORTCODE" ? `Shortcode: ${channel.shortcode}` : 
                         channel.type.toUpperCase() === "USSD" ? `USSD Code: ${channel.shortcode}` : 
                         channel.type.toUpperCase() === "WHATSAPP" ? `WhatsApp Number: ${channel.shortcode}` :
                         channel.shortcode}
                      </p>
                    )}
                    {(channel.flow_id || channel.flow) && (
                      <p style={{ margin: "4px 0", color: "#0066cc", fontWeight: "500" }}>
                        Attached to: {channel.flow?.name || getFlowNameById(channel.flow_id) || "Unknown Flow"}
                      </p>
                    )}
                    {!channel.flow_id && !channel.flow && (
                      <p style={{ margin: "4px 0", color: "#ff6b35", fontStyle: "italic" }}>
                        ⚠️ No flow attached
                      </p>
                    )}
                    <p style={{ margin: "4px 0", color: "#777" }}>
                      Status: <span style={{ 
                        color: channel.status === "ACTIVE" ? "green" : 
                               channel.status === "PENDING" ? "orange" : "red" 
                      }}>
                        {channel.status}
                      </span>
                    </p>
                    {channel.created_at && (
                      <p style={{ margin: "4px 0", color: "#777" }}>
                        {timeAgo(channel.created_at)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => toggleCard(channel.id)}
                  endIcon={<ExpandMoreIcon />}
                  style={{ textTransform: "none", color: "#1976d2" }}
                >
                  {openCard === channel.id ? "Hide Details" : "Select Flow"}
                </Button>
              </div>

                <Collapse in={openCard === channel.id} timeout="auto" unmountOnExit>
                <div style={{ marginTop: "16px" }}>
                  <p style={{ color: "#333", marginBottom: "12px" }}>Select the Flow to attach:</p>
                  
                  <FormControl fullWidth>
                    <Select
                      value={selectedFlows[channel.id] || ""}
                      onChange={(e) => handleFlowChange(channel.id, e.target.value)}
                      displayEmpty
                      style={{ backgroundColor: "#fff", color: "#333" }}
                      disabled={flowsLoading}
                      onOpen={() => {
                        setTimeout(() => {
                          const searchInput = document.querySelector(`#flow-search-${channel.id}`);
                          if (searchInput) {
                            searchInput.focus();
                          }
                        }, 100);
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 350,
                          },
                        },
                        MenuListProps: {
                          style: {
                            paddingTop: 0,
                          },
                        },
                      }}
                      renderValue={(selected) => {
                        if (!selected) {
                          return <span style={{ color: "#999" }}>Choose a flow or type to search...</span>;
                        }
                        const selectedFlow = availableFlows.find(flow => flow.id === selected);
                        return selectedFlow ? selectedFlow.name : "Unknown flow";
                      }}
                    >
                      {/* Search input inside dropdown */}
                      <MenuItem 
                        disableRipple 
                        style={{ 
                          position: 'sticky', 
                          top: 0, 
                          backgroundColor: '#fff',
                          borderBottom: '1px solid #eee',
                          zIndex: 1
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextField
                          id={`flow-search-${channel.id}`}
                          fullWidth
                          placeholder="Type to search flows..."
                          value={flowSearchTerm}
                          onChange={(e) => {
                            e.stopPropagation();
                            setFlowSearchTerm(e.target.value);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon style={{ fontSize: '18px' }} />
                              </InputAdornment>
                            ),
                            endAdornment: flowSearchTerm && (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFlowSearchTerm("");
                                  }}
                                >
                                  <ClearIcon style={{ fontSize: '16px' }} />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          size="small"
                          variant="outlined"
                        />
                      </MenuItem>

                      {/* Flow options */}
                      {flowsLoading ? (
                        <MenuItem disabled>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              border: '2px solid #f3f3f3',
                              borderTop: '2px solid #1976d2',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Loading flows...
                          </div>
                        </MenuItem>
                      ) : filteredFlows.length === 0 ? (
                        <MenuItem disabled>
                          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            {flowSearchTerm 
                              ? `No flows found for "${flowSearchTerm}"` 
                              : "No flows available"
                            }
                            {flowSearchTerm && (
                              <div style={{ marginTop: '8px' }}>
                                <Button 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFlowSearchTerm("");
                                  }}
                                  style={{ fontSize: '12px', textTransform: 'none' }}
                                >
                                  Clear search
                                </Button>
                              </div>
                            )}
                          </div>
                        </MenuItem>
                      ) : (
                        filteredFlows.map((flow) => (
                          <MenuItem 
                            key={flow.id} 
                            value={flow.id}
                            style={{ 
                              borderBottom: '1px solid #f5f5f5',
                              padding: '12px 16px'
                            }}
                          >
                            <div style={{ width: "100%" }}>
                              <div style={{ 
                                fontWeight: "bold", 
                                fontSize: "14px",
                                marginBottom: '2px'
                              }}>
                                {/* Highlight search term */}
                                {flowSearchTerm ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: flow.name.replace(
                                        new RegExp(`(${flowSearchTerm})`, 'gi'),
                                        '<mark style="background-color: #fff59d; padding: 0;">$1</mark>'
                                      )
                                    }}
                                  />
                                ) : (
                                  flow.name
                                )}
                              </div>
                              {flow.description && (
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "#666", 
                                  lineHeight: '1.3'
                                }}>
                                  {flowSearchTerm ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: (flow.description.length > 80 
                                          ? `${flow.description.substring(0, 80)}...` 
                                          : flow.description
                                        ).replace(
                                          new RegExp(`(${flowSearchTerm})`, 'gi'),
                                          '<mark style="background-color: #fff59d; padding: 0;">$1</mark>'
                                        )
                                      }}
                                    />
                                  ) : (
                                    flow.description.length > 80 
                                      ? `${flow.description.substring(0, 80)}...` 
                                      : flow.description
                                  )}
                                </div>
                              )}
                              {flow.updated_at && (
                                <div style={{ 
                                  fontSize: "10px", 
                                  color: "#999", 
                                  marginTop: '4px'
                                }}>
                                  Updated {timeAgo(flow.updated_at)}
                                </div>
                              )}
                            </div>
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>


                  <p style={{ color: "red", fontSize: "12px", marginTop: "8px" }}>
                    💡 Once the flow is selected, users will see that flow when they dial the code or message the channel.
                  </p>
                </div>
                
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenCard(null)}
                    style={{ textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{ backgroundColor: "#F58426", textTransform: "none" }}
                    onClick={() => attachFlow(channel.id, selectedFlows[channel.id])}
                    disabled={!selectedFlows[channel.id] || flowsLoading}
                  >
                    Attach Flow
                  </Button>
                </div>
              </Collapse>
            </div>
          ))
        )}

        {channels.length > 0 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <div className="flex items-center text-sm text-gray-700">
              <span>Cards per page:</span>
              <select 
                value={pageSize}
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
                {totalChannels > 0 ? (
                  <>
                    {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, totalChannels)} of {totalChannels}
                  </>
                ) : (
                  "0 of 0"
                )}
              </span>
              <div className="flex">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || totalChannels === 0}
                  className={`p-1 rounded-full ${(currentPage === 1 || totalChannels === 0) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <NavigateBeforeIcon />
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || totalChannels === 0}
                  className={`p-1 rounded-full ${(currentPage >= totalPages || totalChannels === 0) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <NavigateNextIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChannelTable;