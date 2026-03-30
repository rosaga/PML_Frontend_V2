"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";

const AdminDashboard = () => {
  const [org_id, setOrgId] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setOrgId(localStorage.getItem("selectedAccountId"));
    }
  }, []);

  // Mock data for system overview metrics
  const systemMetrics = [
    {
      label: "Total Organizations",
      value: "1,247",
      change: "+12% from last month",
      changeColor: "green",
      icon: "🏢",
      color: "#4B7FFF",
    },
    {
      label: "Active Accounts",
      value: "3,891",
      change: "+8% from last month",
      changeColor: "green",
      icon: "👤",
      color: "#A678FF",
    },
    {
      label: "Messages Sent Today",
      value: "73,245",
      change: "+15% from yesterday",
      changeColor: "green",
      icon: "💬",
      color: "#1BC47D",
    },
    {
      label: "Data Units (GB)",
      value: "2,847",
      change: "↓ 3% from yesterday",
      changeColor: "red",
      icon: "💾",
      color: "#FDB022",
    },
  ];

  // Mock data for chart (used in Highcharts initialization)
  // No longer needed separately as data is defined in useEffect

  // Mock data for recent organizations
  const recentOrganizations = [
    { id: 1, org: "Sunking", dateCreated: "2026-03-08", status: "Active" },
    { id: 2, org: "Cheers", dateCreated: "2026-03-07", status: "Active" },
    { id: 3, org: "Stepping", dateCreated: "2026-03-06", status: "Pending" },
    { id: 4, org: "Epren", dateCreated: "2026-03-05", status: "Active" },
  ];

  // Mock data for service health
  const serviceHealth = [
    { service: "SMS Provider", status: "Operational", uptime: "120ms" },
    { service: "WhatsApp API", status: "Operational", uptime: "95ms" },
    { service: "Airtime API", status: "Degraded", uptime: "350ms" },
    { service: "Data Provisioning", status: "Operational", uptime: "105ms" },
  ];

  if (!isClient) {
    return null;
  }

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-900 mb-2">
          Dashboard
        </Typography>
        <Typography variant="body2" className="text-gray-600">
          System overview and performance metrics
        </Typography>
      </div>

      {/* System Metrics Cards */}
      <Grid container spacing={3} className="mb-8">
        {systemMetrics.map((metric, idx) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={idx}>
            <Card
              className="hover:shadow-lg transition-shadow"
              sx={{
                background: "white",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography
                      variant="body2"
                      className="text-gray-600 font-medium"
                    >
                      {metric.label}
                    </Typography>
                    <Typography variant="h5" className="font-bold text-gray-900 my-2">
                      {metric.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="font-medium"
                      style={{
                        color: metric.changeColor === "red" ? "#EF4444" : "#10B981",
                      }}
                    >
                      {metric.change}
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width={50}
                    height={50}
                    borderRadius="50%"
                    sx={{
                      backgroundColor: `${metric.color}20`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{metric.icon}</span>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12}>
          <Card
            sx={{
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                System Health
              </Typography>
              <Box className="space-y-4">
                {serviceHealth.map((service, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    paddingY={1}
                    borderBottom="1px solid #E5E7EB"
                  >
                    <Box>
                      <Typography variant="body2" className="font-medium text-gray-900">
                        {service.service}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={4} alignItems="center">
                      <Typography
                        variant="caption"
                        className="text-gray-600 font-medium"
                      >
                        {service.uptime}
                      </Typography>
                      <Chip
                        label={service.status}
                        size="small"
                        sx={{
                          backgroundColor:
                            service.status === "Operational"
                              ? "#D1FAE5"
                              : "#FEF3C7",
                          color:
                            service.status === "Operational"
                              ? "#065F46"
                              : "#92400E",
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Organizations Table */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Recent Organizations
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Organization
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Date Created
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrganizations.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-gray-900 font-medium">
                          {row.org}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {row.dateCreated}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              backgroundColor:
                                row.status === "Active"
                                  ? "#D1FAE5"
                                  : "#FEF3C7",
                              color:
                                row.status === "Active"
                                  ? "#065F46"
                                  : "#92400E",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Recent Service Requests
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Organization
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Service
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { org: "Sunking", service: "Bulk SMS", status: "Completed" },
                      { org: "Cheers", service: "WhatsApp", status: "Pending" },
                      { org: "Savannah", service: "Bulk Data", status: "In Progress" },
                      { org: "Epren", service: "Bulk SMS", status: "Completed" },
                    ].map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-gray-900 font-medium">
                          {row.org}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {row.service}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              backgroundColor:
                                row.status === "Completed"
                                  ? "#000000"
                                  : row.status === "In Progress"
                                  ? "#E0E0E0"
                                  : "#E0E0E0",
                              color:
                                row.status === "Completed"
                                  ? "white"
                                  : "#374151",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Failed Dispatches Section */}
      <Card
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h6" className="font-semibold mb-4">
            Recent Failed Dispatches From Last Dispatch
          </Typography>

          {/* Dispatch Header Info */}
          <Box className="mb-6 p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-4">
            <Box>
              <Typography variant="caption" className="text-gray-600 font-medium">
                CHANNEL
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                SMS
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-gray-600 font-medium">
                CLIENT
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                Sunking
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-gray-600 font-medium">
                TITLE
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                Product Launch Promo
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-gray-600 font-medium">
                DATE DISPATCHED
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                2026-03-09 14:30
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-gray-600 font-medium">
                DELIVERY SPEED
              </Typography>
              <Typography variant="body2" className="font-semibold text-gray-900">
                95% in 5 min
              </Typography>
            </Box>
          </Box>

          {/* Failed Recipients Table */}
          <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                    Recipient
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                    Error Reason
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                    Timestamp
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    recipient: "+254701234567",
                    error: "Invalid number format",
                    timestamp: "2026-03-09 14:31",
                  },
                  {
                    recipient: "+254702345678",
                    error: "Network timeout",
                    timestamp: "2026-03-09 14:31",
                  },
                  {
                    recipient: "+254703456789",
                    error: "DND restriction active",
                    timestamp: "2026-03-09 14:32",
                  },
                  {
                    recipient: "+254704567890",
                    error: "Invalid number format",
                    timestamp: "2026-03-09 14:32",
                  },
                  {
                    recipient: "+254705678901",
                    error: "Recipient blocked sender",
                    timestamp: "2026-03-09 14:33",
                  },
                  {
                    recipient: "+254706789012",
                    error: "Network timeout",
                    timestamp: "2026-03-09 14:33",
                  },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-gray-900 font-medium">
                      {row.recipient}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-red-600 font-medium">
                        {row.error}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {row.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
