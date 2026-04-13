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
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import { GetAdminOrganizations } from "@/app/api/actions/admin/admin";

const OrganizationsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setLoading(true);

        const query = searchTerm
          ? `search=${encodeURIComponent(searchTerm)}`
          : "";

        const response = await GetAdminOrganizations(query);

        setOrganizations(response?.data || []);
      } catch (error) {
        console.error("Error loading organizations:", error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    }

    if (isClient) {
      fetchOrganizations();
    }
  }, [searchTerm, isClient]);

  const handleOrganizationClick = (org) => {
    router.push(`/apps/admin/organizations/${org.external_id}`);
  };

  const getStatusColor = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
        return { backgroundColor: "#000000", color: "white" };
      case "INACTIVE":
        return { backgroundColor: "#E5E7EB", color: "#374151" };
      case "SUSPENDED":
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
      default:
        return { backgroundColor: "#E5E7EB", color: "#374151" };
    }
  };

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-900 mb-2">
          Organizations
        </Typography>
        <Typography variant="body2" className="text-gray-600">
          Manage all registered organizations
        </Typography>
      </div>

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
                  Recharge Count
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Last Recharge
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <CircularProgress size={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow
                    key={org.external_id}
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
                      <Typography variant="caption" sx={{ color: "#6B7280" }}>
                        {org.external_id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={org.status || "UNKNOWN"}
                        size="small"
                        sx={getStatusColor(org.status)}
                      />
                    </TableCell>

                    <TableCell>{org.recharge_count || 0}</TableCell>

                    <TableCell>
                      {org.last_recharge_at
                        ? new Date(org.last_recharge_at).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString()
                        : "-"}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};

export default OrganizationsPage;