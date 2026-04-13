"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import { useParams } from "next/navigation";
import {
  GetAdminOrganizationProfile,
  GetAdminOrganizationDataDispatches,
} from "@/app/api/actions/admin/admin";
import AdjustBalanceModal from "@/components/modal/AdjustBalanceModal";

const OrganizationDetailPage = () => {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isClient, setIsClient] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const rawOrgId =
    params?.org_id ??
    params?.id ??
    params?.organizationId ??
    params?.slug ??
    "";

  const orgId = useMemo(() => {
    if (!rawOrgId) return "";
    return Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
  }, [rawOrgId]);

  const [profile, setProfile] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [dispatchMeta, setDispatchMeta] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDispatches, setLoadingDispatches] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!orgId) {
      setError("Organization ID missing from route.");
      setLoadingProfile(false);
      return;
    }

    fetchProfile();
  }, [isClient, orgId]);

  useEffect(() => {
    if (!isClient || !orgId || activeTab !== "campaigns") return;
    fetchDispatches();
  }, [isClient, orgId, activeTab]);

  async function fetchProfile() {
    try {
      setLoadingProfile(true);
      setError("");
      const res = await GetAdminOrganizationProfile(orgId);
      setProfile(res);
    } catch (err) {
      console.error("Failed to load organization profile:", err);
      setError(
        err?.response?.data?.error || "Failed to load organization profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  async function fetchDispatches() {
    try {
      setLoadingDispatches(true);
      const res = await GetAdminOrganizationDataDispatches(
        orgId,
        "page=1&page_size=20"
      );
      setDispatches(res?.data || []);
      setDispatchMeta(res?.pagination || null);
    } catch (err) {
      console.error("Failed to load dispatches:", err);
      setDispatches([]);
    } finally {
      setLoadingDispatches(false);
    }
  }

  const organization = profile?.organization || {};
  const accounts = Array.isArray(profile?.accounts) ? profile.accounts : [];

  const enabledServices = useMemo(() => {
    const services = [];

    if (accounts.length > 0 || Number(profile?.total_data_units || 0) > 0) {
      services.push("Bulk Data");
    }

    if (Number(profile?.airtime_balance || 0) > 0) {
      services.push("Bulk Airtime");
    }

    if (profile?.sms && !profile?.sms?.error) {
      services.push("Bulk SMS");
    }

    return services;
  }, [accounts, profile]);

  const dataModules = useMemo(() => {
    return accounts.map((account) => ({
      id: account.id,
      module: account.module || "-",
      units: Number(account.units || 0),
      expires_on: account.expires_on || null,
      service: (account.service || "DATA").toUpperCase(),
    }));
  }, [accounts]);

  const getStatusColor = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
      case "SUCCESS":
      case "COMPLETED":
        return { backgroundColor: "#000000", color: "white" };
      case "PENDING":
        return { backgroundColor: "#E5E7EB", color: "#374151" };
      case "FAILED":
      case "ERROR":
      case "INACTIVE":
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
      default:
        return { backgroundColor: "#E5E7EB", color: "#374151" };
    }
  };

  const formatNumber = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toLocaleString() : "0";
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

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={4}
        gap={2}
        flexWrap="wrap"
      >
        <Box>
          <Typography variant="h3" className="font-bold text-gray-900 mb-1">
            {loadingProfile ? "Loading..." : organization?.name || "Organization"}
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Organization ID: {orgId || "—"}
          </Typography>
        </Box>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchProfile}
            sx={{
              color: "#6B7280",
              borderColor: "#E5E7EB",
              textTransform: "none",
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
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
            onClick={() => setIsBalanceModalOpen(true)}
            sx={{
              backgroundColor: "#000000",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1F2937" },
            }}
          >
            Adjust Balance
          </Button>
        </Box>
      </Box>

      {error ? (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      {loadingProfile ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card
            sx={{
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: 3,
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="start"
                mb={3}
                gap={2}
                flexWrap="wrap"
              >
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
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      <Chip
                        label={organization?.status || "Active"}
                        size="small"
                        sx={getStatusColor(organization?.status || "ACTIVE")}
                      />
                      <Chip
                        label={`${profile?.contacts_count || 0} Contacts`}
                        size="small"
                        sx={{ backgroundColor: "#E5E7EB", color: "#374151" }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography
                    variant="caption"
                    className="text-gray-600 font-medium"
                  >
                    Member Since
                  </Typography>
                  <Typography
                    variant="body2"
                    className="font-semibold text-gray-900"
                  >
                    {formatDate(organization?.created_at)}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <span>✉️</span>
                    <Typography variant="body2" className="text-gray-900">
                      {organization?.created_by || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>⏱️</span>
                    <Typography variant="body2" className="text-gray-900">
                      Last Updated: {formatDateTime(organization?.updated_at)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3} mb={4}>
            {[
              {
                label: "SMS Balance",
                value: formatNumber(profile?.sms?.balance),
                icon: "📨",
              },
              {
                label: "Data Balance",
                value: formatNumber(profile?.total_data_units),
                icon: "📦",
              },
              {
                label: "Airtime Balance",
                value: formatNumber(profile?.airtime_balance),
                icon: "📱",
              },
              {
                label: "Recharge Count",
                value: formatNumber(profile?.recharge_count),
                icon: "🔁",
              },
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  sx={{
                    background: "white",
                    borderRadius: 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography
                          variant="caption"
                          className="text-gray-600 font-medium"
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="h5"
                          className="font-bold text-gray-900 mt-1"
                        >
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
                {enabledServices.length > 0 ? (
                  enabledServices.map((service, idx) => (
                    <Chip
                      key={idx}
                      label={service}
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 500,
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" className="text-gray-600">
                    No service information available yet.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          <Box display="flex" gap={4} mb={3} borderBottom="1px solid #E5E7EB">
            {[
              { id: "campaigns", label: "Data Dispatch History" },
              { id: "activity", label: "Data Modules" },
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

          {activeTab === "campaigns" && (
            <Card
              sx={{
                background: "white",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-4">
                  Data Dispatch History
                </Typography>

                {loadingDispatches ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                          <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                            Dispatch ID
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                            MSISDN
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
                        {dispatches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No dispatch history found
                            </TableCell>
                          </TableRow>
                        ) : (
                          dispatches.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              <TableCell>{item.msisdn || "—"}</TableCell>
                              <TableCell>
                                {item.bundle_amount || item.bundleAmount || "—"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.status || "—"}
                                  size="small"
                                  sx={getStatusColor(item.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {formatDateTime(item.created_at || item.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {dispatchMeta ? (
                  <Box mt={2}>
                    <Typography variant="caption" className="text-gray-600">
                      Page {dispatchMeta.page} of {dispatchMeta.total_pages || 1}
                      {" • "}
                      Total: {dispatchMeta.total_count || 0}
                    </Typography>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          )}

          {activeTab === "activity" && (
            <Card
              sx={{
                background: "white",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-4">
                  Data Modules
                </Typography>

                <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                        <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                          Module
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                          Service
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                          Units
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                          Expiry
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {dataModules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No data balance modules found
                          </TableCell>
                        </TableRow>
                      ) : (
                        dataModules.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.module}</TableCell>
                            <TableCell>{item.service}</TableCell>
                            <TableCell>{formatNumber(item.units)}</TableCell>
                            <TableCell>{formatDateTime(item.expires_on)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {profile?.sms?.error ? (
                  <Box mt={3}>
                    <Alert severity="warning">
                      SMS profile could not be loaded: {profile.sms.error}
                    </Alert>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card
              sx={{
                background: "white",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-2">
                  Settings
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  No backend settings endpoint has been wired here yet.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AdjustBalanceModal
        open={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        orgId={orgId}
        accounts={dataModules}
        onSuccess={fetchProfile}
      />
    </div>
  );
};

export default OrganizationDetailPage;