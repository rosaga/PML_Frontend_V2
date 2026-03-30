"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";

const OrganizationsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock data for organizations
  const organizationsData = [
    {
      id: 1,
      name: "SunKing",
      status: "Active",
      services: ["SMS", "WhatsApp", "Data"],
      smsBalance: 50000,
      dataBalance: "500 GB",
      airtime: 250000,
      whatsapp: 25000,
      dateCreated: "2025-01-15",
    },
    {
      id: 2,
      name: "Cheers Bakery",
      status: "Active",
      services: ["SMS", "Airtime"],
      smsBalance: 120000,
      dataBalance: "0 GB",
      airtime: 500000,
      whatsapp: 0,
      dateCreated: "2025-02-10",
    },
    {
      id: 3,
      name: "Stepping Resort",
      status: "Pending",
      services: ["SMS", "WhatsApp", "Data", "Airtime"],
      smsBalance: 15000,
      dataBalance: "200 GB",
      airtime: 100000,
      whatsapp: 10000,
      dateCreated: "2026-03-01",
    },
    {
      id: 4,
      name: "Epren Petrol Station",
      status: "Active",
      services: ["SMS", "WhatsApp"],
      smsBalance: 80000,
      dataBalance: "0 GB",
      airtime: 0,
      whatsapp: 40000,
      dateCreated: "2025-11-22",
    },
    {
      id: 5,
      name: "FinServe Pro",
      status: "Suspended",
      services: ["SMS"],
      smsBalance: 5000,
      dataBalance: "0 GB",
      airtime: 20000,
      whatsapp: 0,
      dateCreated: "2024-08-30",
    },
  ];

  // Filter organizations based on search term
  const filteredOrganizations = organizationsData.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrganizationClick = (org) => {
    router.push(`/apps/admin/organizations/${org.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { backgroundColor: "#000000", color: "white" };
      case "Pending":
        return { backgroundColor: "#E5E7EB", color: "#374151" };
      case "Suspended":
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
      default:
        return { backgroundColor: "#E5E7EB", color: "#374151" };
    }
  };

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-900 mb-2">
          Organizations
        </Typography>
        <Typography variant="body2" className="text-gray-600">
          Manage all registered organizations
        </Typography>
      </div>

      {/* Search and Filters */}
      <Card
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: 3,
        }}
      >
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search organizations..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "#9CA3AF" }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": {
                    borderColor: "#E5E7EB",
                  },
                },
              }}
            />
            <Button
              variant="outlined"
              sx={{
                color: "#6B7280",
                borderColor: "#E5E7EB",
                textTransform: "none",
              }}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Organization Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Services
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  SMS Balance
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Data Balance
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Airtime
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  WhatsApp
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Date Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow
                  key={org.id}
                  onClick={() => handleOrganizationClick(org)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#F9FAFB",
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      className="font-medium"
                      sx={{ color: "#3B82F6" }}
                    >
                      {org.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={org.status}
                      size="small"
                      sx={getStatusColor(org.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {org.services.map((service, idx) => (
                        <Chip
                          key={idx}
                          label={service}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#E5E7EB",
                            color: "#6B7280",
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium">
                    {org.smsBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium">
                    {org.dataBalance}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium">
                    {org.airtime.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium">
                    {org.whatsapp.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {org.dateCreated}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};

export default OrganizationsPage;
