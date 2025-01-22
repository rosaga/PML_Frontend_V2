"use client";
import React, { useState } from "react";
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
import CreateShortCodeModal from "../modal/createShortCodeModal";


const ChannelTable = () => {
  const [openCard, setOpenCard] = useState(null);
  const [selectedFlows, setSelectedFlows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleCard = (cardId) => {
    setOpenCard(openCard === cardId ? null : cardId);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFlowChange = (channelId, flow) => {
    setSelectedFlows({ ...selectedFlows, [channelId]: flow });
  };

  // Utility function to calculate "time ago" from a date string
  const timeAgo = (createdDate) => {
    const created = new Date(createdDate); // Parse the ISO 8601 date directly
    const now = new Date();
    const diffInMs = now - created;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
    if (diffInDays < 1) return "Created today";
    if (diffInDays === 1) return "Created 1 day ago";
    if (diffInDays < 7) return `Created ${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return "Created 1 week ago";
    return `Created ${diffInWeeks} weeks ago`;
  };

  const channels = [
    {
      id: 1,
      type: "WhatsApp",
      value: "+254 765 321 890",
      // keyword: "null",
      shortcode: "2124",
      ussd: "*645*4#",
      flows: ["Kuza Talanta", "Jenga Misuli"],
      created: "2025-01-19T13:55:30.40499Z",
    },
    {
      id: 2,
      type: "ShortCode",
      value: "+254 745 567 532",
      keyword: "Shared",
      shortcode: null,
      ussd: null,
      flows: ["Kuza Talanta", "Jenga Misuli"],
      created: "2025-01-10T13:55:30.40499Z",
    },
    {
      id: 3,
      type: "KeyWord",
      value: "+254 765 321 890",
      keyword: "Pineworth",
      shortcode: "2124",
      ussd: "*645*4#",
      flows: ["Kuza Talanta", "Jenga Misuli"],
      created: "2024-06-19T13:55:30.40499Z",
    },
    {
      id: 4,
      type: "USSD",
      value: "+254 765 321 890",
      keyword: "Pineworth",
      shortcode: "2124",
      ussd: "*645*4#",
      flows: ["Kuza Talanta", "Jenga Misuli"],
      created: "2024-08-19T13:55:30.40499Z",
    },
  ];

  return (
    <>
    {isModalOpen && <CreateShortCodeModal closeModal={closeModal} />}
    <div>
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Channels</p>
        <div className="ml-auto flex space-x-4">
          <PeakButton
            buttonText="Request ShortCode"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal} 
          />
        </div>
      </div>
      {channels.map((channel) => (
        <div
          key={channel.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            margin: "8px 0",
            padding: "16px",
            backgroundColor: "#f9f9f9", // Light background for cards
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {channel.type == "WhatsApp" ? (
                <WhatsAppIcon style={{ color: "Green" }} />
              ) : channel.type == "ShortCode" ? (
                <SmsIcon style={{ color: "#9c27b0" }} />
              ) : channel.type == "KeyWord" ? (
                <CodeIcon style={{ color: "#090A29" }} />
              ) : (
                <DialpadIcon style={{ color: "#090A29" }} />
              )}
              <div>
              {channel.type && (
                <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>{channel.type}</p>
              )}

                {channel.value && (
                <p style={{ margin: "4px 0", color: "#555" }}>{channel.value}</p>
                )}

                {channel.keyword && (
                <p style={{ margin: "4px 0", color: "#777" }}>
                  Keyword: {channel.keyword} 
                </p>
                )}
                {channel.shortcode && (
                  <p style={{ margin: "4px 0", color: "#9c27b0" }}>Short Code: {channel.shortcode}</p>
                )}
                {channel.ussd && (
                  <p style={{ margin: "4px 0", color: "#3f51b5" }}>USSD Code: {channel.ussd}</p>
                )}
                {channel.created && (
                <p style={{ margin: "4px 0", color: "#777" }}>
                 ({timeAgo(channel.created)})
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
                {channel.flows.map((flow, index) => (
                  <MenuItem key={index} value={flow}>
                    {flow}
                  </MenuItem>
                ))}
              </Select>
              <p style={{ color: "red" }}>
                (Once the flow is selected, the users will see that flow, when they dial the code.)
              </p>
              </div>
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                style={{ marginTop: "16px", backgroundColor: "#F58426" }}
                onClick={() =>
                  alert(`Flow "${selectedFlows[channel.id]}" attached to ${channel.value}`)
                }
              >
                Attach Flow
              </Button>
              </div>
              
          </Collapse>
        </div>
      ))}
    </div>
    </>
  );
};

export default ChannelTable;
