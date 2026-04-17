"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  GetAdminDashboardSummary,
  GetAdminOrganizations,
  GetAdminDataDispatches,
} from "@/app/api/actions/admin/admin";

const AdminDashboard = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [summary, setSummary] = useState(null);
  const [recentOrganizations, setRecentOrganizations] = useState([]);
  const [failedDispatches, setFailedDispatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchDashboard();
  }, [isClient]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, recentOrgsRes, failedDispatchesRes] = await Promise.all([
        GetAdminDashboardSummary(),
        GetAdminOrganizations("recent=true&limit=4"),
        GetAdminDataDispatches("status=FAILED&page=1&page_size=6"),
      ]);

      setSummary(summaryRes?.data || null);
      setRecentOrganizations(recentOrgsRes?.data || []);
      setFailedDispatches(failedDispatchesRes?.data || []);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(
        err?.response?.data?.error || "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => {
    return [
      {
        label: "Total Organizations",
        value: Number(summary?.total_organizations || 0).toLocaleString(),
        helper: "All registered organizations",
        helperColor: "green",
        icon: "🏢",
        color: "#4B7FFF",
      },
      {
        label: "Active Organizations",
        value: Number(summary?.active_organizations || 0).toLocaleString(),
        helper: "Based on recent approved recharge activity",
        helperColor: "green",
        icon: "👤",
        color: "#A678FF",
      },
      {
        label: "Messages Sent Today",
        value: Number(summary?.messages_sent_today || 0).toLocaleString(),
        helper: summary?.sms_error ? "SMS service unavailable" : "Total SMS messages sent today",
        helperColor: summary?.sms_error ? "red" : "green",
        icon: "💬",
        color: "#1BC47D",
      },
      {
        label: "Data Units",
        value: Number(summary?.total_data_units || 0).toLocaleString(),
        helper: "Current total data balance",
        helperColor: "green",
        icon: "💾",
        color: "#FDB022",
      },
    ];
  }, [summary]);

  const getStatusChip = (status) => {
    const normalized = (status || "").toUpperCase();

    if (normalized === "ACTIVE" || normalized === "COMPLETED" || normalized === "SUCCESS") {
      return {
        backgroundColor: "#D1FAE5",
        color: "#065F46",
      };
    }

    if (normalized === "FAILED" || normalized === "ERROR" || normalized === "INACTIVE") {
      return {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
      };
    }

    return {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
    };
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const handleOrganizationClick = (row) => {
    if (!row?.external_id) return;
    router.push(`/apps/admin/organizations/${row.external_id}`);
  };

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            Dashboard
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            System overview and performance metrics
          </Typography>
        </div>

        <Button
          variant="outlined"
          onClick={fetchDashboard}
          sx={{
            color: "#6B7280",
            borderColor: "#E5E7EB",
            textTransform: "none",
          }}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      {summary?.sms_error ? (
        <Box mb={3}>
          <Alert severity="warning">
            SMS summary could not be fully loaded: {summary.sms_error}
          </Alert>
        </Box>
      ) : null}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} className="mb-8">
            {metrics.map((metric, idx) => (
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
                            color: metric.helperColor === "red" ? "#EF4444" : "#10B981",
                          }}
                        >
                          {metric.helper}
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
                    {[
                      {
                        service: "Admin Backend",
                        status: "Operational",
                        detail: "Dashboard summary loaded",
                      },
                      {
                        service: "SMS Summary Service",
                        status: summary?.sms_error ? "Degraded" : "Operational",
                        detail: summary?.sms_error ? "Could not fetch SMS counts" : "Messages sent today loaded",
                      },
                      {
                        service: "Data Dispatch Service",
                        status: "Operational",
                        detail: "Failed dispatch list loaded",
                      },
                    ].map((service, idx) => (
                      <Box
                        key={idx}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        paddingY={1}
                        borderBottom={idx < 2 ? "1px solid #E5E7EB" : "none"}
                      >
                        <Box>
                          <Typography variant="body2" className="font-medium text-gray-900">
                            {service.service}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {service.detail}
                          </Typography>
                        </Box>

                        <Chip
                          label={service.status}
                          size="small"
                          sx={{
                            backgroundColor:
                              service.status === "Operational" ? "#D1FAE5" : "#FEF3C7",
                            color:
                              service.status === "Operational" ? "#065F46" : "#92400E",
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

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
                        {recentOrganizations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              No organizations found
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentOrganizations.map((row) => (
                            <TableRow
                              key={row.external_id || row.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => handleOrganizationClick(row)}
                            >
                              <TableCell className="text-gray-900 font-medium">
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#6B7280" }}>
                                    {row.external_id}
                                  </Typography>
                                </Box>
                              </TableCell>

                              <TableCell className="text-gray-600">
                                {formatDate(row.created_at)}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  label={row.status}
                                  size="small"
                                  sx={getStatusChip(row.status)}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
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

                  {/* <Alert severity="info">
                    Pending
                  </Alert> */}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card
            sx={{
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Recent Failed Dispatches
              </Typography>

              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Organization
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Recipient
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Bundle Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {failedDispatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No failed dispatches found
                        </TableCell>
                      </TableRow>
                    ) : (
                      failedDispatches.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-gray-900 font-medium">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {row.organization_name || "—"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#6B7280" }}>
                                {row.organization_external_id || ""}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell className="text-gray-900 font-medium">
                            {row.msisdn || "—"}
                          </TableCell>

                          <TableCell className="text-gray-600">
                            {row.bundle_amount || row.bundleAmount || "—"}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={row.status || "FAILED"}
                              size="small"
                              sx={getStatusChip(row.status || "FAILED")}
                            />
                          </TableCell>

                          <TableCell className="text-gray-600 text-sm">
                            {formatDateTime(row.created_at || row.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;