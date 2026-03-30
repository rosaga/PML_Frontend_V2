"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useParams } from "next/navigation";

const OrganizationDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock organization data
  const orgData = {
    id: "ORG-1",
    name: "SunKing",
    status: "Active",
    verified: true,
    email: "contact@sunking.com",
    phone: "+254 701 234 568",
    location: "Nairobi, Kenya",
    lastActivity: "2 hours ago",
    memberSince: "January 15, 2025",
    balances: {
      sms: 50000,
      data: "500 GB",
      airtime: 250000,
      whatsapp: 25000,
    },
    enabledServices: [
      "Bulk SMS",
      "WhatsApp Business",
      "Bulk Data",
      "Bulk Airtime",
      "USSD Flows",
    ],
  };

  // Mock campaigns data
  const campaignsData = [
    {
      id: "CMP-001",
      service: "SMS",
      name: "Product Launch",
      date: "2026-03-09",
      messagesSent: 15000,
      status: "Completed",
    },
    {
      id: "CMP-002",
      service: "WhatsApp",
      name: "Newsletter",
      date: "2026-03-08",
      messagesSent: 8000,
      status: "Completed",
    },
    {
      id: "CMP-003",
      service: "Data",
      name: "Bundle Rewards",
      date: "2026-03-07",
      messagesSent: 500,
      status: "Completed",
    },
  ];

  // Mock activity log data
  const activityLogData = [
    {
      type: "Balance top-up",
      description: "Added 100,000 to airtime wallet",
      timestamp: "2 hours ago",
    },
    {
      type: "Campaign launched",
      description: "Product Launch SMS campaign sent",
      timestamp: "5 hours ago",
    },
    {
      type: "Template approved",
      description: "WhatsApp template approved",
      timestamp: "1 day ago",
    },
  ];

  // Mock service rates data
  const serviceRatesData = [
    { service: "Bulk SMS", rate: "KES 0.80", unit: "per SMS" },
    { service: "WhatsApp Business", rate: "KES 1.20", unit: "per message" },
    { service: "Bulk Data", rate: "KES 5.00", unit: "per GB" },
  ];

  // Mock service thresholds data
  const serviceThresholdsData = [
    { service: "Bulk SMS", threshold: 10000 },
    { service: "WhatsApp Business", threshold: 5000 },
    { service: "Bulk Data", threshold: "100 GB" },
  ];

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h3" className="font-bold text-gray-900 mb-1">
            {orgData.name}
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Organization ID: {orgData.id}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            sx={{
              color: "#6B7280",
              borderColor: "#E5E7EB",
              textTransform: "none",
            }}
          >
            Edit Profile
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#000000",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1F2937" },
            }}
          >
            Provision Balance
          </Button>
        </Box>
      </Box>

      {/* Company Information Card */}
      <Card
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: 3,
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  backgroundColor: "#E0E7FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 24 }}>🏢</span>
              </Box>
              <Box>
                <Typography variant="h6" className="font-semibold">
                  Company Information
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip label={orgData.status} size="small" sx={{ backgroundColor: "#000000", color: "white" }} />
                  <Chip label="Verified" size="small" sx={{ backgroundColor: "#E5E7EB", color: "#374151" }} />
                </Box>
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" className="text-gray-600 font-medium">
                Member Since
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                {orgData.memberSince}
              </Typography>
            </Box>
          </Box>

          {/* Contact Information Grid */}
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <span>✉️</span>
                <Typography variant="body2" className="text-gray-900">
                  {orgData.email}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <span>📞</span>
                <Typography variant="body2" className="text-gray-900">
                  {orgData.phone}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <span>📍</span>
                <Typography variant="body2" className="text-gray-900">
                  {orgData.location}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <span>⏱️</span>
                <Typography variant="body2" className="text-gray-900">
                  Last Activity: {orgData.lastActivity}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          { label: "SMS Balance", value: orgData.balances.sms.toLocaleString(), icon: "📨" },
          { label: "Data Balance", value: orgData.balances.data, icon: "📦" },
          { label: "Airtime Balance", value: orgData.balances.airtime.toLocaleString(), icon: "📱" },
          { label: "WhatsApp Balance", value: orgData.balances.whatsapp.toLocaleString(), icon: "💬" },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="caption" className="text-gray-600 font-medium">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" className="font-bold text-gray-900 mt-1">
                      {item.value}
                    </Typography>
                  </Box>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Enabled Services */}
      <Card
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: 3,
        }}
      >
        <CardContent>
          <Typography variant="h6" className="font-semibold mb-3">
            Enabled Services
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            {orgData.enabledServices.map((service, idx) => (
              <Chip
                key={idx}
                label={service}
                sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box display="flex" gap={4} mb={3} borderBottom="1px solid #E5E7EB">
        {[
          { id: "campaigns", label: "Campaign History" },
          { id: "activity", label: "Activity Log" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              textTransform: "none",
              color: activeTab === tab.id ? "#1F2937" : "#6B7280",
              borderBottom: activeTab === tab.id ? "2px solid #000" : "none",
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: "1rem",
              padding: "12px 0",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Tab Content */}
      {activeTab === "campaigns" && (
        <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Campaign History
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Campaign ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Messages Sent</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaignsData.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Typography
                          component="a"
                          href="#"
                          sx={{
                            color: "#3B82F6",
                            textDecoration: "none",
                            fontWeight: 500,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {campaign.id}
                        </Typography>
                      </TableCell>
                      <TableCell className="text-gray-900">{campaign.service}</TableCell>
                      <TableCell className="text-gray-900">{campaign.name}</TableCell>
                      <TableCell className="text-gray-900">{campaign.date}</TableCell>
                      <TableCell className="text-gray-900">{campaign.messagesSent.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={campaign.status}
                          size="small"
                          sx={{ backgroundColor: "#000000", color: "white" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "activity" && (
        <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Recent Activity
            </Typography>
            <Box className="space-y-4">
              {activityLogData.map((activity, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  gap={3}
                  paddingY={2}
                  borderBottom={idx < activityLogData.length - 1 ? "1px solid #E5E7EB" : "none"}
                >
                  <Box>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#3B82F6",
                        marginTop: 1,
                      }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" className="font-semibold text-gray-900">
                      {activity.type}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 block mt-1">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Box className="space-y-4">
          {/* Service Rates */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" className="font-semibold">
                    Service Rates
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    Configure pricing rates for each service
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "#000000",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#1F2937" },
                  }}
                >
                  + Add Rate
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: "none", mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceRatesData.map((rate, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-gray-900 font-medium">{rate.service}</TableCell>
                        <TableCell className="text-gray-900">{rate.rate}</TableCell>
                        <TableCell className="text-gray-900">{rate.unit}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <DeleteIcon fontSize="small" sx={{ color: "#EF4444" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className="p-4 bg-gray-50 rounded-lg">
                <Typography variant="body2" className="font-semibold mb-4">
                  Configure Service Rate
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" className="text-gray-700 font-medium block mb-2">
                      Service
                    </Typography>
                    <Select
                      defaultValue=""
                      displayEmpty
                      fullWidth
                      size="small"
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#E5E7EB",
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select service...
                      </MenuItem>
                      <MenuItem value="sms">Bulk SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp Business</MenuItem>
                      <MenuItem value="data">Bulk Data</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <Typography variant="caption" className="text-gray-700 font-medium block mb-2">
                        Rate
                    </Typography>
                    <TextField
                      placeholder="0.00"
                      type="number"
                      size="small"
                      fullWidth
                      label="Rate per Unit"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" className="text-gray-700 font-medium block mb-2">
                      Currency
                    </Typography>
                    <Select
                      defaultValue="KES"
                      fullWidth
                      size="small"
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#E5E7EB",
                        },
                      }}
                    >
                      <MenuItem value="KES">KES</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} display="flex" gap={1} mt={1}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: "#000000",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#1F2937" },
                      }}
                    >
                      Save Rate
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      sx={{ color: "#6B7280", borderColor: "#E5E7EB", textTransform: "uppercase" }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Service Thresholds */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" className="font-semibold">
                    Service Thresholds
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    Set low balance alerts for each service
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "#000000",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#1F2937" },
                  }}
                >
                  + Add Threshold
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: "none", mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Threshold</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceThresholdsData.map((threshold, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-gray-900 font-medium">{threshold.service}</TableCell>
                        <TableCell className="text-gray-900">{threshold.threshold}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <DeleteIcon fontSize="small" sx={{ color: "#EF4444" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className="p-4 bg-gray-50 rounded-lg">
                <Typography variant="body2" className="font-semibold mb-4">
                  Configure Service Threshold
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" className="text-gray-700 font-medium block mb-2">
                      Service
                    </Typography>
                    <Select
                      defaultValue=""
                      displayEmpty
                      fullWidth
                      size="small"
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#E5E7EB",
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select service...
                      </MenuItem>
                      <MenuItem value="sms">Bulk SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp Business</MenuItem>
                      <MenuItem value="data">Bulk Data</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" className="text-gray-700 font-medium block mb-2">
                      Threshold
                    </Typography>
                    <TextField
                      placeholder="e.g., 10,000 or 100 GB"
                      size="small"
                      fullWidth
                      label="Threshold Amount"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} display="flex" gap={1} mt={1}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: "#000000",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#1F2937" },
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      sx={{ color: "#6B7280", borderColor: "#E5E7EB", textTransform: "uppercase" }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </div>
  );
};

export default OrganizationDetailPage;
