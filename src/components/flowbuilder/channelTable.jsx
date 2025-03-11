"use client";
import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsIcon from "@mui/icons-material/Sms";
import CodeIcon from "@mui/icons-material/Code";
import DialpadIcon from "@mui/icons-material/Dialpad";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import CreateChannelModal from "../modal/createShortCodeModal";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { format, formatDistance } from 'date-fns';

const ChannelTable = () => {
  const [openCard, setOpenCard] = useState(null);
  const [selectedFlows, setSelectedFlows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [availableFlows, setAvailableFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get organization ID from localStorage
  let organization_id = null;
  if (typeof window !== 'undefined') {
    organization_id = localStorage.getItem('selectedAccountId');
  }

  // Fetch channels and flows when component mounts
  useEffect(() => {
    fetchChannels();
    fetchFlows();
  }, []);

  // Fetch channels from backend
  const fetchChannels = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/channels?eq__organization_id=${organization_id}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setChannels(response.data.results);
      setError(null);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError("Failed to load channels. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all flows for dropdown selection
  const fetchFlows = async () => {
    try {
      const response = await fetch(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows?eq__organization_id=${organization_id}`,
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
      setAvailableFlows(data.results);
    } catch (err) {
      console.error('Error fetching flows:', err);
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
    // Refresh channels after creating a new one
    fetchChannels();
  };

  const handleFlowChange = (channelId, flowId) => {
    setSelectedFlows({ ...selectedFlows, [channelId]: flowId });
  };

  // Attach flow to channel
  const attachFlow = async (channelId, flowId) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/channels/${channelId}`,
        {
          flow_id: flowId
        },
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        alert("Flow attached successfully!");
        fetchChannels(); // Refresh channels to show the updated flow
      }
    } catch (error) {
      console.error("Error attaching flow:", error);
      alert("Failed to attach flow. Please try again.");
    }
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

  // Format date to time ago
  const timeAgo = (dateString) => {
    try {
      const created = new Date(dateString);
      const now = new Date();
      
      // If date is invalid, return original string
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
      {isModalOpen && <CreateChannelModal closeModal={closeModal} />}
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="mt-4 font-medium text-lg">All Channels</p>
          <div className="ml-auto flex space-x-4">
            <PeakButton
              buttonText="Create Channel"
              icon={AddIcon}
              className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
              onClick={openModal} 
            />
          </div>
        </div>

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
            <p>No channels found. Create your first channel!</p>
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
                    {channel.flow && (
                      <p style={{ margin: "4px 0", color: "#555" }}>
                        Current Flow: {channel.flow.name || getFlowNameById(channel.flow_id)}
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
                  <p style={{ color: "#333" }}>Select the Flow to attach:</p>
                  <Select
                    value={selectedFlows[channel.id] || ""}
                    onChange={(e) => handleFlowChange(channel.id, e.target.value)}
                    displayEmpty
                    fullWidth
                    style={{ backgroundColor: "#fff", color: "#333" }}
                  >
                    <MenuItem value="" disabled>
                      Choose a flow
                    </MenuItem>
                    {availableFlows.map((flow) => (
                      <MenuItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <p style={{ color: "red" }}>
                    (Once the flow is selected, the users will see that flow, when they dial the code or message the channel.)
                  </p>
                </div>
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{ marginTop: "16px", backgroundColor: "#F58426" }}
                    onClick={() => attachFlow(channel.id, selectedFlows[channel.id])}
                    disabled={!selectedFlows[channel.id]}
                  >
                    Attach Flow
                  </Button>
                </div>
              </Collapse>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ChannelTable;