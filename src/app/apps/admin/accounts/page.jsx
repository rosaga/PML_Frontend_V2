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
  Grid,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import MessageIcon from "@mui/icons-material/Message";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import PhoneIcon from "@mui/icons-material/Phone";
import CallMadeIcon from "@mui/icons-material/CallMade";

const AccountsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isClient, setIsClient] = useState(false);
  const [selectedService, setSelectedService] = useState("sms");
  const [revenuePeriod, setRevenuePeriod] = useState("2026-03");
  const [revenueService, setRevenueService] = useState("all");
  const [revenueOrg, setRevenueOrg] = useState("all");
  const [expenditurePeriod, setExpenditurePeriod] = useState("2026-03");
  const [expenditureService, setExpenditureService] = useState("all");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock data for balances
  const balanceMetrics = [
    { label: "Total SMS Balance", value: "1.25M", icon: <EmailIcon sx={{ color: "#3B82F6", fontSize: 32 }} /> },
    { label: "Total Data Balance", value: "8,450 GB", icon: <DataUsageIcon sx={{ color: "#F59E0B", fontSize: 32 }} /> },
    { label: "Total Airtime", value: "52.8M", icon: <PhoneIcon sx={{ color: "#10B981", fontSize: 32 }} /> },
    { label: "Total WhatsApp", value: "425K", icon: <MessageIcon sx={{ color: "#8B5CF6", fontSize: 32 }} /> },
  ];

  const serviceWalletsData = [
    {
      service: "Bulk SMS",
      icon: <EmailIcon sx={{ color: "#3B82F6" }} />,
      currentBalance: "1,250,000",
      totalSpent: "450,000",
      lastTopUpAmount: "500,000",
      lastTopUpDate: "2026-03-10",
    },
    {
      service: "WhatsApp",
      icon: <MessageIcon sx={{ color: "#8B5CF6" }} />,
      currentBalance: "425,000",
      totalSpent: "125,000",
      lastTopUpAmount: "200,000",
      lastTopUpDate: "2026-03-09",
    },
    {
      service: "Data",
      icon: <DataUsageIcon sx={{ color: "#F59E0B" }} />,
      currentBalance: "8,450 GB",
      totalSpent: "2,120 GB",
      lastTopUpAmount: "5,000 GB",
      lastTopUpDate: "2026-03-11",
    },
    {
      service: "Airtime",
      icon: <PhoneIcon sx={{ color: "#10B981" }} />,
      currentBalance: "52,800,000",
      totalSpent: "18,500,000",
      lastTopUpAmount: "25,000,000",
      lastTopUpDate: "2026-03-08",
    },
    {
      service: "USSD Flows",
      icon: <CallMadeIcon sx={{ color: "#EC4899" }} />,
      currentBalance: "75,000",
      totalSpent: "12,000",
      lastTopUpAmount: "50,000",
      lastTopUpDate: "2026-03-07",
    },
  ];

  const lowBalanceAlerts = [
    { service: "Bulk SMS", current: "125,000", threshold: "200,000" },
    { service: "Data", current: "860 GB", threshold: "1,000 GB" },
  ];

  const revenueMetrics = [
    { label: "Total Revenue", value: "KSH 5,451,675", icon: <CallMadeIcon sx={{ color: "#10B981", fontSize: 32 }} /> },
    { label: "Total Expenditure", value: "KSH 42,755,000", icon: <CallMadeIcon sx={{ color: "#EF4444", fontSize: 32 }} /> },
    { label: "Organizations", value: "7", icon: <EmailIcon sx={{ color: "#8B5CF6", fontSize: 32 }} /> },
    { label: "Active Services", value: "6", icon: <MessageIcon sx={{ color: "#F59E0B", fontSize: 32 }} /> },
  ];

  const revenueData = [
    { organization: "TechCorp Solutions", service: "Bulk SMS", consumption: "45,000", rate: "KSH 0.85", revenue: "KSH 38,250" },
    { organization: "TechCorp Solutions", service: "WhatsApp", consumption: "12,000", rate: "KSH 1.20", revenue: "KSH 14,400" },
    { organization: "TechCorp Solutions", service: "Data", consumption: "350", rate: "KSH 450.00", revenue: "KSH 157,500" },
    { organization: "RetailMax Ltd", service: "Bulk SMS", consumption: "78,000", rate: "KSH 0.85", revenue: "KSH 66,300" },
    { organization: "RetailMax Ltd", service: "Bulk Data", consumption: "520", rate: "KSH 450.00", revenue: "KSH 234,000" },
  ];

  const expenditureMetrics = [
    { label: "Total Expenditure", value: "KSH 42,755,000", icon: <CallMadeIcon sx={{ color: "#EF4444", fontSize: 32 }} /> },
    { label: "Total Top Ups", value: "17", icon: <EmailIcon sx={{ color: "#3B82F6", fontSize: 32 }} /> },
    { label: "Active Services", value: "6", icon: <MessageIcon sx={{ color: "#F59E0B", fontSize: 32 }} /> },
  ];

  const expenditureData = [
    { service: "Bulk SMS", subservice: "-", quantity: "1", unitCost: "KSH 600,000", totalCost: "KSH 590,000", date: "2026-03-10" },
    { service: "Bulk SMS", subservice: "-", quantity: "1", unitCost: "KSH 300,000", totalCost: "KSH 300,000", date: "2026-03-08" },
    { service: "WhatsApp", subservice: "-", quantity: "1", unitCost: "KSH 200,000", totalCost: "KSH 200,000", date: "2026-03-09" },
    { service: "Data", subservice: "1GB Data Bundle", quantity: "2,500", unitCost: "KSH 450", totalCost: "KSH 1,125,000", date: "2026-03-11" },
    { service: "Airtime", subservice: "-", quantity: "1", unitCost: "KSH 25,000,000", totalCost: "KSH 25,000,000", date: "2026-03-08" },
  ];

  const currentThresholds = [
    { service: "Bulk SMS", threshold: "200,000", icon: <EmailIcon sx={{ color: "#3B82F6" }} /> },
    { service: "WhatsApp", threshold: "100,000", icon: <MessageIcon sx={{ color: "#8B5CF6" }} /> },
    { service: "Data", threshold: "1,000 GB", icon: <DataUsageIcon sx={{ color: "#F59E0B" }} /> },
    { service: "Airtime", threshold: "10,000,000", icon: <PhoneIcon sx={{ color: "#10B981" }} /> },
    { service: "USSD Flows", threshold: "50,000", icon: <CallMadeIcon sx={{ color: "#EC4899" }} /> },
  ];

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" className="font-bold text-gray-900 mb-1">
          Accounts & Wallet Balances
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280" }}>
          Monitor and manage Peak company wallet balances
        </Typography>
      </Box>

      {/* Tabs */}
      <Box display="flex" gap={1} mb={4}>
        {[
          { id: "overview", label: "Overview" },
          { id: "revenue", label: "Revenue" },
          { id: "expenditure", label: "Expenditure" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              textTransform: "none",
              color: activeTab === tab.id ? "white" : "#6B7280",
              backgroundColor: activeTab === tab.id ? "#1F2937" : "#F3F4F6",
              borderRadius: "24px",
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: "0.95rem",
              px: 3,
              py: 1.2,
              "&:hover": {
                backgroundColor: activeTab === tab.id ? "#374151" : "#E5E7EB",
              },
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <Box className="space-y-6">
          {/* Balance Metrics */}
          <Grid container spacing={3}>
            {balanceMetrics.map((metric, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h4" className="font-bold text-gray-900 mt-2">
                          {metric.value}
                        </Typography>
                      </Box>
                      {metric.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Company Service Wallets */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" className="font-semibold">
                  Company Service Wallets
                </Typography>
                <Button variant="outlined" size="small" sx={{ color: "#6B7280", borderColor: "#E5E7EB" }}>
                  Export Report
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Current Balance</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Total Spent</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Last Top Up Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Last Top Up Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceWalletsData.map((wallet, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {wallet.icon}
                            <span className="text-gray-900 font-medium">{wallet.service}</span>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#374151" }}>{wallet.currentBalance}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{wallet.totalSpent}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{wallet.lastTopUpAmount}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{wallet.lastTopUpDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              backgroundColor: "#000000",
                              textTransform: "none",
                              fontSize: "0.85rem",
                              "&:hover": { backgroundColor: "#1F2937" },
                            }}
                          >
                            Top Up
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Low Balance Alerts */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Low Balance Alerts
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {lowBalanceAlerts.map((alert, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={3}
                    sx={{ backgroundColor: "#FEE2E2", borderRadius: 1 }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                        {alert.service}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6B7280" }}>
                        Current: {alert.current} (Threshold: {alert.threshold})
                      </Typography>
                    </Box>
                    <Chip label="Low Balance" sx={{ backgroundColor: "#DC2626", color: "white", fontWeight: 600 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* REVENUE TAB */}
      {activeTab === "revenue" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Revenue Metrics */}
          <Grid container spacing={3}>
            {revenueMetrics.map((metric, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mt: 1 }}>
                          {metric.value}
                        </Typography>
                      </Box>
                      {metric.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Organization Revenue Table */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box>
                    <Typography variant="h6" className="font-semibold">
                      Organization Revenue by Service
                    </Typography>
                    <Box display="flex" gap={1} mt={2}>
                      <Box sx={{ backgroundColor: "#E0F2FE", px: 2, py: 1, borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: "#0C4A6E", fontWeight: 500 }}>
                          Grand Total Revenue
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#16A34A", fontWeight: 700 }}>
                          KSH 5,451,675
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2} mb={3} alignItems="flex-end">
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Period:
                    </Typography>
                    <Select 
                      value={revenuePeriod} 
                      onChange={(e) => setRevenuePeriod(e.target.value)}
                      fullWidth 
                      size="small" 
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="2026-03">2026-03</MenuItem>
                      <MenuItem value="2026-02">2026-02</MenuItem>
                      <MenuItem value="2026-01">2026-01</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Service:
                    </Typography>
                    <Select 
                      value={revenueService} 
                      onChange={(e) => setRevenueService(e.target.value)}
                      fullWidth 
                      size="small" 
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="all">All Services</MenuItem>
                      <MenuItem value="sms">Bulk SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp</MenuItem>
                      <MenuItem value="data">Data</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Organization:
                    </Typography>
                    <Select 
                      value={revenueOrg} 
                      onChange={(e) => setRevenueOrg(e.target.value)}
                      fullWidth 
                      size="small" 
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="all">All Organizations</MenuItem>
                      <MenuItem value="techcorp">TechCorp Solutions</MenuItem>
                      <MenuItem value="retailmax">RetailMax Ltd</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Organization</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Consumption</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueData.filter((row) => {
                      const periodMatch = revenuePeriod === "2026-03" || true;
                      const serviceMatch = revenueService === "all" || row.service.toLowerCase().includes(revenueService.toLowerCase());
                      const orgMatch = revenueOrg === "all" || row.organization.toLowerCase().includes(revenueOrg === "techcorp" ? "techcorp" : "retailmax");
                      return periodMatch && serviceMatch && orgMatch;
                    }).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: "#374151" }}>{row.organization}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.service}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.consumption}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.rate}</TableCell>
                        <TableCell sx={{ color: "#16A34A", fontWeight: 600 }}>{row.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* EXPENDITURE TAB */}
      {activeTab === "expenditure" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Expenditure Metrics */}
          <Grid container spacing={3}>
            {expenditureMetrics.map((metric, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mt: 1 }}>
                          {metric.value}
                        </Typography>
                      </Box>
                      {metric.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Company Service Expenditure */}
          <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box>
                    <Typography variant="h6" className="font-semibold">
                      Company Service Expenditure
                    </Typography>
                    <Box display="flex" gap={1} mt={2}>
                      <Box sx={{ backgroundColor: "#FEE2E2", px: 2, py: 1, borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: "#7F1D1D", fontWeight: 500 }}>
                          Total Cost
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#DC2626", fontWeight: 700 }}>
                          KSH 42,755,000
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2} mb={3} alignItems="flex-end">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Period:
                    </Typography>
                    <Select 
                      value={expenditurePeriod} 
                      onChange={(e) => setExpenditurePeriod(e.target.value)}
                      fullWidth 
                      size="small" 
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="2026-03">2026-03</MenuItem>
                      <MenuItem value="2026-02">2026-02</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Service:
                    </Typography>
                    <Select 
                      value={expenditureService} 
                      onChange={(e) => setExpenditureService(e.target.value)}
                      fullWidth 
                      size="small" 
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="all">All Services</MenuItem>
                      <MenuItem value="sms">Bulk SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp</MenuItem>
                      <MenuItem value="data">Data</MenuItem>
                      <MenuItem value="airtime">Airtime</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Subservice</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Unit Cost</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Total Cost</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenditureData.filter((row) => {
                      const periodMatch = expenditurePeriod === "2026-03" || true;
                      const serviceMatch = expenditureService === "all" || row.service.toLowerCase().includes(expenditureService.toLowerCase());
                      return periodMatch && serviceMatch;
                    }).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: "#374151", fontWeight: 500 }}>{row.service}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.subservice}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.quantity}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.unitCost}</TableCell>
                        <TableCell sx={{ color: "#DC2626", fontWeight: 600 }}>{row.totalCost}</TableCell>
                        <TableCell sx={{ color: "#374151" }}>{row.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <Grid container spacing={4}>
          {/* Set Alert Threshold */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <EmailIcon sx={{ color: "#3B82F6", fontSize: 28 }} />
                  <Typography variant="h6" className="font-semibold">
                    Set Alert Threshold
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#6B7280", display: "block", mb: 3 }}>
                  Configure low balance alert thresholds for each service
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Select Service
                    </Typography>
                    <Select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ backgroundColor: "white" }}
                    >
                      <MenuItem value="sms">Bulk SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp</MenuItem>
                      <MenuItem value="data">Data</MenuItem>
                      <MenuItem value="airtime">Airtime</MenuItem>
                      <MenuItem value="ussd">USSD Flows</MenuItem>
                    </Select>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600, display: "block", mb: 1 }}>
                      Threshold Value
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Current: 200,000"
                      sx={{ backgroundColor: "white" }}
                    />
                  </Box>

                  <Box sx={{ backgroundColor: "#DBEAFE", p: 2, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: "#1E40AF", display: "block", mb: 0 }}>
                      Current Threshold: 200,000
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "#000000",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": { backgroundColor: "#1F2937" },
                    }}
                  >
                    Update Threshold
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Current Thresholds */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: "white", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-4">
                  Current Thresholds
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
                  {currentThresholds.map((threshold, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2.5,
                        backgroundColor: "#F9FAFB",
                        borderRadius: 1,
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        {threshold.icon}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                            {threshold.service}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6B7280" }}>
                            Low balance alert threshold
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                        {threshold.threshold}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default AccountsPage;
