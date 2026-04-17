"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import MessageIcon from "@mui/icons-material/Message";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import PhoneIcon from "@mui/icons-material/Phone";
import CallMadeIcon from "@mui/icons-material/CallMade";
import { GetAdminDashboardSummary } from "@/app/api/actions/admin/admin";

const AccountsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isClient, setIsClient] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchSummary();
  }, [isClient]);

  async function fetchSummary() {
    try {
      setLoading(true);
      setError("");

      const res = await GetAdminDashboardSummary();
      setSummary(res?.data || null);
    } catch (err) {
      console.error("Failed to load accounts summary:", err);
      setError(
        err?.response?.data?.error || "Failed to load accounts summary."
      );
    } finally {
      setLoading(false);
    }
  }

  const overviewMetrics = useMemo(() => {
    return [
      {
        label: "Total Organizations",
        value: Number(summary?.total_organizations || 0).toLocaleString(),
        icon: <EmailIcon sx={{ color: "#3B82F6", fontSize: 32 }} />,
      },
      {
        label: "Active Organizations",
        value: Number(summary?.active_organizations || 0).toLocaleString(),
        icon: <PhoneIcon sx={{ color: "#10B981", fontSize: 32 }} />,
      },
      {
        label: "Messages Sent Today",
        value: Number(summary?.messages_sent_today || 0).toLocaleString(),
        icon: <MessageIcon sx={{ color: "#8B5CF6", fontSize: 32 }} />,
      },
      {
        label: "Total Data Units",
        value: Number(summary?.total_data_units || 0).toLocaleString(),
        icon: <DataUsageIcon sx={{ color: "#F59E0B", fontSize: 32 }} />,
      },
    ];
  }, [summary]);

  const PlaceholderCard = ({ title, description }) => (
    <Card
      sx={{
        background: "white",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <CardContent>
        <Typography variant="h6" className="font-semibold mb-3">
          {title}
        </Typography>
        <Alert severity="info">{description}</Alert>
      </CardContent>
    </Card>
  );

  if (!isClient) return null;

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="start" gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h3" className="font-bold text-gray-900 mb-1">
            Accounts & Wallet Balances
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Monitor and manage admin-level balance summaries
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={fetchSummary}
          sx={{
            color: "#6B7280",
            borderColor: "#E5E7EB",
            textTransform: "none",
          }}
        >
          Refresh
        </Button>
      </Box>

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

      <Box display="flex" gap={1} mb={4} flexWrap="wrap">
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

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === "overview" && (
            <Box className="space-y-6">
              <Grid container spacing={3}>
                {overviewMetrics.map((metric, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={idx}>
                    <Card
                      sx={{
                        background: "white",
                        borderRadius: 2,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
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

              <PlaceholderCard
                title="Company Service Wallets"
                description="No backend route has been wired yet for company wallet balances by service, total spent, or last top-up details."
              />

              <PlaceholderCard
                title="Low Balance Alerts"
                description="No backend threshold or low-balance alert routes have been wired yet."
              />
            </Box>
          )}

          {activeTab === "revenue" && (
            <PlaceholderCard
              title="Revenue"
              description="No revenue aggregation endpoints have been wired yet for this page."
            />
          )}

          {activeTab === "expenditure" && (
            <PlaceholderCard
              title="Expenditure"
              description="No expenditure/top-up history endpoints have been wired yet for this page."
            />
          )}

          {activeTab === "settings" && (
            <PlaceholderCard
              title="Settings"
              description="No backend routes have been wired yet for thresholds or accounts settings."
            />
          )}
        </>
      )}
    </div>
  );
};

export default AccountsPage;