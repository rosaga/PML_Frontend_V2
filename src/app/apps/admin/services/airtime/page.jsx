"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminBalancesSummary,
  GetAdminDashboardSummary,
  GetAdminRechargeRequests,
  GetAdminOrganizations,
  GetAdminOrganizationBalances,
  AutoProvisionAdminBalance,
} from "@/app/api/actions/admin/admin";

function MetricCard({ title, value, subtitle, icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="mt-2 text-[28px] font-semibold leading-none text-gray-900">
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-4 text-sm font-semibold text-green-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dispatchLogs", label: "Dispatch Logs" },
    { id: "organizationBalances", label: "Organization Balances" },
    { id: "scheduledCampaigns", label: "Scheduled Campaigns" },
    { id: "usage", label: "Usage" },
  ];

  return (
    <div className="mb-8 inline-flex rounded-full bg-gray-200 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-white text-gray-900 shadow-[0_0_0_2px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.12)]"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function CardShell({
  title,
  subtitle,
  rightAction,
  children,
  headerClassName = "",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className={`flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 ${headerClassName}`}
      >
        <div>
          <h2 className="text-[22px] font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ value }) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "FAILED" || normalized === "LOW") {
    return (
      <span className="inline-flex rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white">
        {value}
      </span>
    );
  }

  if (normalized === "IN PROGRESS" || normalized === "SCHEDULED") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-800">
        {value}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white">
      {value}
    </span>
  );
}

function ModalShell({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 14 14">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const DEFAULT_TOPUP_FORM = {
  units: "",
  amountSpent: "",
  notes: "",
};

export default function BulkAirtimeManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatchLogs");

  const [balancesSummary, setBalancesSummary] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [rechargeRequests, setRechargeRequests] = useState([]);
  const [airtimeBalanceRows, setAirtimeBalanceRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [pageError, setPageError] = useState("");
  const [balancesError, setBalancesError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [topupForm, setTopupForm] = useState(DEFAULT_TOPUP_FORM);
  const [modalError, setModalError] = useState("");
  const [submittingTopup, setSubmittingTopup] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchPageData();
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    if (activeTab !== "organizationBalances") return;
    if (!organizations.length) return;
    if (airtimeBalanceRows.length > 0) return;

    fetchOrganizationAirtimeBalances();
  }, [activeTab, isClient, organizations]);

  async function fetchPageData() {
    try {
      setLoading(true);
      setPageError("");
      setSuccessMessage("");
      setBalancesError("");

      const [
        balancesResult,
        dashboardResult,
        rechargeResult,
        organizationsResult,
      ] = await Promise.allSettled([
        GetAdminBalancesSummary(),
        GetAdminDashboardSummary(),
        GetAdminRechargeRequests("page=1&page_size=100"),
        GetAdminOrganizations("limit=200"),
      ]);

      if (balancesResult.status === "fulfilled") {
        setBalancesSummary(balancesResult.value?.data || null);
      } else {
        setBalancesSummary(null);
      }

      if (dashboardResult.status === "fulfilled") {
        setDashboardSummary(dashboardResult.value?.data || null);
      } else {
        setDashboardSummary(null);
      }

      if (rechargeResult.status === "fulfilled") {
        setRechargeRequests(
          rechargeResult.value?.data ||
            rechargeResult.value?.items ||
            rechargeResult.value?.recharges ||
            []
        );
      } else {
        setRechargeRequests([]);
      }

      if (organizationsResult.status === "fulfilled") {
        setOrganizations(organizationsResult.value?.data || []);
      } else {
        setOrganizations([]);
      }

      if (
        balancesResult.status === "rejected" &&
        dashboardResult.status === "rejected" &&
        rechargeResult.status === "rejected" &&
        organizationsResult.status === "rejected"
      ) {
        setPageError("Failed to load airtime management data.");
      }
    } catch (err) {
      console.error("Failed to load airtime page:", err);
      setPageError("Failed to load airtime management data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrganizationAirtimeBalances() {
    try {
      setLoadingBalances(true);
      setBalancesError("");

      const results = await Promise.allSettled(
        organizations.map((org) =>
          GetAdminOrganizationBalances(org.external_id, "AIRTIME")
        )
      );

      const rows = organizations.map((org, index) => {
        const result = results[index];

        let balance = 0;

        if (result?.status === "fulfilled") {
          const payload = result.value?.data ?? result.value ?? null;

          if (Array.isArray(payload)) {
            balance = payload.reduce(
              (sum, item) => sum + Number(item?.units || item?.balance || 0),
              0
            );
          } else if (Array.isArray(payload?.accounts)) {
            balance = payload.accounts.reduce(
              (sum, item) => sum + Number(item?.units || item?.balance || 0),
              0
            );
          } else if (typeof payload?.balance !== "undefined") {
            balance = Number(payload.balance || 0);
          } else if (typeof payload?.total_balance !== "undefined") {
            balance = Number(payload.total_balance || 0);
          } else if (typeof payload?.units !== "undefined") {
            balance = Number(payload.units || 0);
          }
        }

        return {
          id: org.external_id,
          organization: org.name,
          organizationId: org.external_id,
          currentBalance: balance,
          threshold: 0,
          status: balance <= 0 ? "Low" : "Healthy",
        };
      });

      setAirtimeBalanceRows(rows);
    } catch (err) {
      console.error("Failed to load organization airtime balances:", err);
      setAirtimeBalanceRows([]);
      setBalancesError(
        err?.response?.data?.error ||
          "Failed to load organization airtime balances."
      );
    } finally {
      setLoadingBalances(false);
    }
  }

  function normalizeService(item) {
    const raw = String(
      item?.service ||
        item?.transaction_type ||
        item?.type ||
        item?.module ||
        item?.package ||
        ""
    )
      .trim()
      .toUpperCase();

    if (!raw) return "";
    if (raw.includes("AIRTIME")) return "AIRTIME";
    if (raw.includes("SMS") || raw.includes("PERSMS")) return "SMS";
    if (raw.includes("DATA") || raw.includes("GB") || raw.includes("MB"))
      return "DATA";

    return raw;
  }

  function getRechargeDate(item) {
    return (
      item?.created_at ||
      item?.createdat ||
      item?.updated_at ||
      item?.updatedat ||
      item?.date ||
      null
    );
  }

  function getRechargeUnits(item) {
    return Number(item?.units ?? item?.quantity ?? item?.amount ?? 0);
  }

  function getRechargeCashValue(item) {
    return Number(
      item?.amount_spent ??
        item?.amountSpent ??
        item?.amount ??
        item?.cash_value ??
        item?.cashValue ??
        item?.cost ??
        item?.price ??
        item?.total_amount ??
        0
    );
  }

  function getRechargeStatus(item) {
    return String(item?.status || item?.status_code || "APPROVED").toUpperCase();
  }

  function getRechargeAdmin(item) {
    return item?.created_by || item?.createdby || item?.updated_by || "Admin";
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-CA");
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openTopupModal(org) {
    setSelectedOrganization(org);
    setTopupForm(DEFAULT_TOPUP_FORM);
    setModalError("");
    setIsTopUpOpen(true);
  }

  function closeTopupModal() {
    if (submittingTopup) return;
    setSelectedOrganization(null);
    setTopupForm(DEFAULT_TOPUP_FORM);
    setModalError("");
    setIsTopUpOpen(false);
  }

  async function handleTopupSubmit(e) {
    e.preventDefault();
    setModalError("");

    if (!selectedOrganization?.organizationId) {
      setModalError("Organization is required.");
      return;
    }

    const units = Number(topupForm.units);
    const amountSpent = Number(topupForm.amountSpent);

    if (!Number.isFinite(units) || units <= 0) {
      setModalError("Units must be greater than zero.");
      return;
    }

    if (!Number.isFinite(amountSpent) || amountSpent <= 0) {
      setModalError("Amount spent must be greater than zero.");
      return;
    }

    try {
      setSubmittingTopup(true);

      await AutoProvisionAdminBalance({
        org_id: selectedOrganization.organizationId,
        organization_id: selectedOrganization.organizationId,
        application_id: selectedOrganization.organizationId,
        service: "AIRTIME",
        package: "AIRTIME",
        units,
        amount_spent: amountSpent,
        amount: amountSpent,
        notes: topupForm.notes?.trim() || "",
        reason: topupForm.notes?.trim() || "",
      });

      setSuccessMessage("Airtime provisioned successfully.");
      closeTopupModal();
      await fetchPageData();
      await fetchOrganizationAirtimeBalances();
    } catch (err) {
      console.error("Failed to provision airtime:", err);
      setModalError(
        err?.response?.data?.error || "Failed to provision airtime."
      );
    } finally {
      setSubmittingTopup(false);
    }
  }

  const organizationsByExternalId = useMemo(() => {
    const map = {};
    (organizations || []).forEach((org) => {
      if (org?.external_id) {
        map[String(org.external_id)] = org;
      }
      if (org?.id) {
        map[String(org.id)] = org;
      }
    });
    return map;
  }, [organizations]);

  const airtimeRequests = useMemo(() => {
    return (Array.isArray(rechargeRequests) ? rechargeRequests : []).filter(
      (item) => normalizeService(item) === "AIRTIME"
    );
  }, [rechargeRequests]);

  const topupsTodayCount = useMemo(() => {
    const today = new Date();
    return airtimeRequests.filter((item) => {
      const value = getRechargeDate(item);
      if (!value) return false;
      const d = new Date(value);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length;
  }, [airtimeRequests]);

  const lowBalanceCount = useMemo(() => {
    return airtimeBalanceRows.filter((item) => Number(item.currentBalance || 0) <= 0)
      .length;
  }, [airtimeBalanceRows]);

  const dispatchRows = useMemo(() => {
    return airtimeRequests
      .map((item, index) => {
        const orgKey =
          item?.application_id ||
          item?.organization_external_id ||
          item?.org_id ||
          item?.organization_id ||
          "";

        const org = organizationsByExternalId[String(orgKey)] || null;

        return {
          id: item?.id || item?.request_id || `AT-${index + 1}`,
          organization:
            item?.organization_name ||
            item?.organization ||
            org?.name ||
            orgKey ||
            "—",
          recipient: item?.msisdn || item?.recipient || "—",
          amount: formatNumber(getRechargeUnits(item)),
          status:
            getRechargeStatus(item) === "FAILED" ? "Failed" : "Success",
          provider: item?.provider || item?.network || "—",
          timestamp: formatDateTime(getRechargeDate(item)),
        };
      })
      .sort((a, b) => {
        const left = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const right = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return right - left;
      });
  }, [airtimeRequests, organizationsByExternalId]);

  const scheduledCampaignRows = useMemo(() => {
    const grouped = {};

    airtimeRequests.forEach((item, index) => {
      const orgKey =
        item?.application_id ||
        item?.organization_external_id ||
        item?.org_id ||
        item?.organization_id ||
        "";

      const org = organizationsByExternalId[String(orgKey)] || null;
      const dateOnly = formatDate(getRechargeDate(item));
      const key = `${orgKey}-${dateOnly}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: `ATC-${index + 1}`,
          organization: org?.name || orgKey || "—",
          name: "Airtime Provision Batch",
          recipients: 0,
          totalAmount: 0,
          status: "Completed",
          date: dateOnly,
        };
      }

      grouped[key].recipients += 1;
      grouped[key].totalAmount += getRechargeUnits(item);

      if (getRechargeStatus(item) === "FAILED") {
        grouped[key].status = "Failed";
      }
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [airtimeRequests, organizationsByExternalId]);

  const usageRows = useMemo(() => {
    const grouped = {};

    airtimeRequests.forEach((item) => {
      const orgKey =
        item?.application_id ||
        item?.organization_external_id ||
        item?.org_id ||
        item?.organization_id ||
        "";

      const org = organizationsByExternalId[String(orgKey)] || null;
      const label = String(item?.package || item?.module || "AIRTIME");
      const key = `${orgKey}-${label}`;

      if (!grouped[key]) {
        grouped[key] = {
          organization: org?.name || orgKey || "—",
          airtimeValue: label,
          unitsDispatched: 0,
          total: 0,
        };
      }

      grouped[key].unitsDispatched += getRechargeUnits(item);
      grouped[key].total += getRechargeCashValue(item);
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [airtimeRequests, organizationsByExternalId]);

  const metrics = useMemo(
    () => [
      {
        title: "Total Airtime Balance",
        value: formatNumber(balancesSummary?.total_airtime_units),
        subtitle: "",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92V19.92C22.0001 20.1985 21.9419 20.474 21.8293 20.7288C21.7167 20.9836 21.5521 21.2122 21.346 21.4C21.1398 21.5878 20.8969 21.7306 20.6327 21.8192C20.3685 21.9078 20.0886 21.9403 19.811 21.914C16.731 21.579 13.7727 20.5261 11.171 18.84C8.75083 17.3017 6.69829 15.2492 5.16 12.829C3.46782 10.2151 2.41469 7.24117 2.086 4.14603C2.06099 3.86929 2.09417 3.59032 2.18341 3.32718C2.27266 3.06404 2.41598 2.82287 2.60407 2.6175C2.79216 2.41213 3.02098 2.24717 3.27601 2.13352C3.53104 2.01987 3.80708 1.96002 4.086 1.95803H7.086C7.57302 1.95324 8.04517 2.11679 8.424 2.42003C8.80283 2.72327 9.06421 3.14755 9.164 3.62403C9.35091 4.51285 9.63891 5.37747 10.024 6.20003C10.1592 6.48581 10.2128 6.80338 10.1785 7.11817C10.1441 7.43296 10.0232 7.73205 9.829 7.98203L8.559 9.25203C9.98127 11.7534 12.0537 13.8258 14.555 15.248L15.825 13.978C16.075 13.7838 16.3741 13.6629 16.6889 13.6285C17.0037 13.5942 17.3212 13.6478 17.607 13.783C18.4296 14.1681 19.2942 14.4561 20.183 14.643C20.6647 14.7438 21.0938 15.0107 21.3978 15.3966C21.7019 15.7825 21.8614 16.2637 21.849 16.758L22 16.92Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Active Organizations",
        value: formatNumber(dashboardSummary?.active_organizations),
        subtitle: "",
        iconBg: "#dcfce7",
        iconColor: "#16a34a",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.085V12C21.9988 14.1457 21.304 16.2331 20.0198 17.9503C18.7357 19.6675 16.9319 20.9267 14.8765 21.5396C12.8211 22.1525 10.6232 22.0862 8.60857 21.3505C6.59395 20.6148 4.86903 19.2489 3.69078 17.4571C2.51252 15.6652 1.94482 13.5403 2.07276 11.3981C2.20069 9.25587 3.01776 7.21385 4.40135 5.57455C5.78494 3.93526 7.66177 2.78583 9.74868 2.29708C11.8356 1.80833 14.022 2.00691 15.987 2.863"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 4L12 14.01L9 11.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Recent Airtime Top Ups",
        value: formatNumber(topupsTodayCount),
        subtitle: "",
        iconBg: "#f3e8ff",
        iconColor: "#9333ea",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M16 3V7M8 3V7M3 11H21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        title: "Low Balance Alerts",
        value: formatNumber(lowBalanceCount),
        subtitle: "",
        iconBg: "#fee2e2",
        iconColor: "#ef4444",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 9V13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 17H12.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
    [balancesSummary, dashboardSummary, topupsTodayCount, lowBalanceCount]
  );

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight text-gray-900">
              Bulk Airtime Management
            </h1>
            <p className="mt-2 text-[16px] text-gray-600">
              Manage airtime distribution and wallet balances
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPageData}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "dispatchLogs" && (
              <CardShell
                title="Airtime Dispatch Logs"
                rightAction={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Filter
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 10L12 15L17 10"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 15V3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Export
                    </button>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Transaction ID
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Recipient
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Amount
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Provider
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No airtime dispatch logs found
                          </td>
                        </tr>
                      ) : (
                        dispatchRows.map((item) => (
                          <tr key={item.id}>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                              {item.id}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.organization}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.recipient}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {item.amount}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm">
                              <StatusPill value={item.status} />
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {item.provider}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {item.timestamp}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardShell>
            )}

            {activeTab === "organizationBalances" && (
              <CardShell title="Airtime Wallet Balances">
                {balancesError ? (
                  <div className="px-6 py-4 text-sm text-amber-700">
                    {balancesError}
                  </div>
                ) : null}

                {loadingBalances ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Organization
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Current Balance
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Threshold
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Status
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-right text-sm font-semibold text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {airtimeBalanceRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No airtime balance rows found
                            </td>
                          </tr>
                        ) : (
                          airtimeBalanceRows.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                                {item.organization}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                                {formatNumber(item.currentBalance)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatNumber(item.threshold)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <StatusPill value={item.status} />
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                                <button
                                  type="button"
                                  onClick={() => openTopupModal(item)}
                                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                  Top Up
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardShell>
            )}

            {activeTab === "scheduledCampaigns" && (
              <CardShell title="Scheduled Airtime Campaigns">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Campaign ID
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Name
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Recipients
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Total Amount
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledCampaignRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No recent airtime provision batches found
                          </td>
                        </tr>
                      ) : (
                        scheduledCampaignRows.map((item) => (
                          <tr key={item.id}>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                              {item.id}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.organization}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {formatNumber(item.recipients)}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {formatNumber(item.totalAmount)}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm">
                              <StatusPill value={item.status} />
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {item.date}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardShell>
            )}

            {activeTab === "usage" && (
              <CardShell
                title="Airtime Usage Data"
                headerClassName="items-center"
                rightAction={
                  <div className="flex flex-wrap items-center gap-4">
                    <select className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400">
                      <option>Last 30 Days</option>
                      <option>Last 7 Days</option>
                      <option>This Month</option>
                    </select>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">
                        Total Usage
                      </p>
                      <p className="text-[20px] font-semibold leading-none text-gray-900">
                        {formatCurrency(
                          usageRows.reduce(
                            (sum, item) => sum + Number(item.total || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Airtime Value
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Units Dispatched
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No airtime usage data found
                          </td>
                        </tr>
                      ) : (
                        usageRows.map((item, index) => (
                          <tr key={`${item.organization}-${index}`}>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {item.organization}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {item.airtimeValue}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {formatNumber(item.unitsDispatched)}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardShell>
            )}
          </>
        )}

        <ModalShell
          open={isTopUpOpen}
          title="Top Up Airtime Wallet"
          onClose={closeTopupModal}
        >
          {modalError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {modalError}
            </div>
          ) : null}

          <form onSubmit={handleTopupSubmit} className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">
                {selectedOrganization?.organization || "—"}
              </div>
              <div className="mt-1">
                Current balance: {formatNumber(selectedOrganization?.currentBalance)} units
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Units
              </label>
              <input
                type="number"
                min="1"
                value={topupForm.units}
                onChange={(e) =>
                  setTopupForm((prev) => ({
                    ...prev,
                    units: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter airtime units"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Amount Spent
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={topupForm.amountSpent}
                onChange={(e) =>
                  setTopupForm((prev) => ({
                    ...prev,
                    amountSpent: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter amount spent"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Notes
              </label>
              <textarea
                rows={3}
                value={topupForm.notes}
                onChange={(e) =>
                  setTopupForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Optional notes"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={closeTopupModal}
                disabled={submittingTopup}
                className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submittingTopup}
                className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
                  submittingTopup
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {submittingTopup ? "Provisioning..." : "Top Up"}
              </button>
            </div>
          </form>
        </ModalShell>
      </div>
    </div>
  );
}