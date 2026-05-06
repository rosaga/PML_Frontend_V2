"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminSMSDashboardSummary,
  GetAdminSMSCampaignSummaries,
  GetAdminSMSSenderIDs,
  ApproveAdminSMSSenderID,
  UpdateAdminSMSSenderID,
  CreateAdminSMSSenderID,
} from "@/app/api/actions/admin/admin";

const MetricCard = ({ title, value, subtitle, iconBg, iconColor, icon }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="mt-2 text-[28px] font-bold leading-none text-gray-900">
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-4 text-sm font-medium text-green-600">{subtitle}</p>
          ) : null}
        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "campaigns", label: "Campaigns" },
    { id: "senderIds", label: "Sender IDs" },
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
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
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
};

const CardShell = ({ title, subtitle, rightAction, children }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        {rightAction}
      </div>

      {children}
    </div>
  );
};

const Pagination = ({
  page,
  pageSize,
  totalPages,
  count,
  onPageChange,
  onPageSizeChange,
  disabled,
}) => {
  const safeTotalPages = totalPages || 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
      <div className="text-sm text-gray-500">
        Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
        <span className="font-semibold text-gray-900">{safeTotalPages}</span>
        {" • "}
        Total: <span className="font-semibold text-gray-900">{count || 0}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={disabled}
          className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-400 disabled:opacity-60"
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= safeTotalPages}
          className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const SenderStatusBadge = ({ status }) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SVC200") {
    return (
      <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-xs font-bold text-white">
        Active
      </span>
    );
  }

  if (normalized === "SVC202") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-800">
        Activation Pending
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-700">
      {status || "Unknown"}
    </span>
  );
};

const EditSenderIDModal = ({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  loading,
}) => {
  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Edit Sender ID</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update the sender name, provider, country, channel, or message type.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Sender ID Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
              placeholder="Example: PEAKMOBILE"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Provider
            </label>
            <input
              value={form.provider}
              onChange={(e) => updateField("provider", e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
              placeholder="Example: Safaricom"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Country Code
              </label>
              <input
                value={form.country_code}
                onChange={(e) =>
                  updateField("country_code", e.target.value.toUpperCase())
                }
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
                placeholder="KE"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Channel
              </label>
              <input
                value={form.channel}
                onChange={(e) =>
                  updateField("channel", e.target.value.toUpperCase())
                }
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
                placeholder="SENDERNAME"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Message Type
            </label>
            <select
              value={form.message_type}
              onChange={(e) => updateField("message_type", e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
              required
            >
              <option value="TRANSACTIONAL">TRANSACTIONAL</option>
              <option value="PROMOTIONAL">PROMOTIONAL</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-[#02051d] px-5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function BulkSMSManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  const [summary, setSummary] = useState(null);

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsMeta, setCampaignsMeta] = useState(null);
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignPageSize, setCampaignPageSize] = useState(20);

  const [senderIds, setSenderIds] = useState([]);
  const [senderIdsMeta, setSenderIdsMeta] = useState(null);
  const [senderPage, setSenderPage] = useState(1);
  const [senderPageSize, setSenderPageSize] = useState(20);
  const [senderStatusFilter, setSenderStatusFilter] = useState("");
  const [senderMessageTypeFilter, setSenderMessageTypeFilter] = useState("");
  const [senderSearch, setSenderSearch] = useState("");

  const [showCreateSenderForm, setShowCreateSenderForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSenderForm, setCreateSenderForm] = useState({
    name: "",
    provider: "Safaricom",
    country_code: "KE",
    channel: "SENDERNAME",
    message_type: "TRANSACTIONAL",
  });

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingSenderIds, setLoadingSenderIds] = useState(false);

  const [error, setError] = useState("");
  const [campaignsError, setCampaignsError] = useState("");
  const [senderIdsError, setSenderIdsError] = useState("");

  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editingSender, setEditingSender] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    provider: "",
    country_code: "KE",
    channel: "SENDERNAME",
    message_type: "TRANSACTIONAL",
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchInitialData();
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    if (activeTab === "campaigns") {
      fetchCampaigns();
    }

    if (activeTab === "senderIds") {
      fetchSenderIds();
    }
  }, [
    activeTab,
    isClient,
    campaignPage,
    campaignPageSize,
    senderPage,
    senderPageSize,
    senderStatusFilter,
    senderMessageTypeFilter,
  ]);

  function buildQuery(params) {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        searchParams.set(key, String(value));
      }
    });

    return searchParams.toString();
  }

  async function fetchInitialData() {
    try {
      setError("");
      await fetchSummary();
      await fetchCampaigns();
    } catch (err) {
      console.error("Failed to load initial bulk SMS data:", err);
      setError("Failed to load Bulk SMS management data.");
    }
  }

  async function fetchSummary() {
    try {
      setLoadingSummary(true);

      const res = await GetAdminSMSDashboardSummary();
      setSummary(res || null);

      return res;
    } catch (err) {
      console.error("Failed to load SMS dashboard summary:", err);
      setSummary(null);
      setError(
        err?.response?.data?.error || "Failed to load SMS dashboard summary."
      );
      throw err;
    } finally {
      setLoadingSummary(false);
    }
  }

  async function fetchCampaigns() {
    try {
      setLoadingCampaigns(true);
      setCampaignsError("");

      const query = buildQuery({
        page: campaignPage,
        page_size: campaignPageSize,
      });

      const res = await GetAdminSMSCampaignSummaries(query);

      setCampaigns(res?.data || []);
      setCampaignsMeta({
        ...(res?.pagination || {}),
        count: res?.count || 0,
      });
    } catch (err) {
      console.error("Failed to load SMS campaigns:", err);
      setCampaigns([]);
      setCampaignsMeta(null);
      setCampaignsError(
        err?.response?.data?.error || "Failed to load SMS campaigns."
      );
    } finally {
      setLoadingCampaigns(false);
    }
  }

  async function fetchSenderIds(overrides = {}) {
    try {
      setLoadingSenderIds(true);
      setSenderIdsError("");

      const query = buildQuery({
        page: overrides.page || senderPage,
        page_size: overrides.pageSize || senderPageSize,
        status:
          overrides.status !== undefined ? overrides.status : senderStatusFilter,
        message_type:
          overrides.messageType !== undefined
            ? overrides.messageType
            : senderMessageTypeFilter,
        search: overrides.search !== undefined ? overrides.search : senderSearch,
      });

      const res = await GetAdminSMSSenderIDs(query);

      setSenderIds(res?.data || []);
      setSenderIdsMeta({
        ...(res?.pagination || {}),
        count: res?.count || 0,
      });
    } catch (err) {
      console.error("Failed to load sender IDs:", err);
      setSenderIds([]);
      setSenderIdsMeta(null);
      setSenderIdsError(
        err?.response?.data?.error || "Failed to load sender IDs."
      );
    } finally {
      setLoadingSenderIds(false);
    }
  }

  function updateCreateSenderField(field, value) {
    setCreateSenderForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetCreateSenderForm() {
    setCreateSenderForm({
      name: "",
      provider: "Safaricom",
      country_code: "KE",
      channel: "SENDERNAME",
      message_type: "TRANSACTIONAL",
    });
  }

  async function handleCreateSenderID(e) {
    e.preventDefault();

    try {
      setCreateLoading(true);
      setSenderIdsError("");

      await CreateAdminSMSSenderID({
        name: createSenderForm.name,
        provider: createSenderForm.provider,
        country_code: createSenderForm.country_code,
        channel: createSenderForm.channel,
        message_type: createSenderForm.message_type,
      });

      resetCreateSenderForm();
      setShowCreateSenderForm(false);
      setSenderPage(1);

      await fetchSenderIds({ page: 1 });
    } catch (err) {
      console.error("Failed to create sender ID:", err);
      setSenderIdsError(
        err?.response?.data?.error || "Failed to create sender ID."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleApproveSenderId(serviceId) {
    if (!serviceId) return;

    try {
      setApproveLoadingId(serviceId);
      setSenderIdsError("");

      await ApproveAdminSMSSenderID(serviceId);
      await fetchSenderIds();
    } catch (err) {
      console.error("Failed to approve sender ID:", err);
      setSenderIdsError(
        err?.response?.data?.error || "Failed to approve sender ID."
      );
    } finally {
      setApproveLoadingId(null);
    }
  }

  function openEditModal(item) {
    setEditingSender(item);
    setEditForm({
      name: item?.name || item?.sender_id || "",
      provider: item?.provider || "",
      country_code: item?.country_code || "KE",
      channel: item?.channel || "SENDERNAME",
      message_type: item?.message_type || "TRANSACTIONAL",
    });
  }

  function closeEditModal() {
    if (editLoading) return;

    setEditingSender(null);
    setEditForm({
      name: "",
      provider: "",
      country_code: "KE",
      channel: "SENDERNAME",
      message_type: "TRANSACTIONAL",
    });
  }

  async function handleUpdateSenderID(e) {
    e.preventDefault();

    const serviceId = getSenderServiceId(editingSender);
    if (!serviceId) return;

    try {
      setEditLoading(true);
      setSenderIdsError("");

      await UpdateAdminSMSSenderID(serviceId, {
        name: editForm.name,
        provider: editForm.provider,
        country_code: editForm.country_code,
        channel: editForm.channel,
        message_type: editForm.message_type,
      });

      setEditingSender(null);

      await fetchSenderIds();
    } catch (err) {
      console.error("Failed to update sender ID:", err);
      setSenderIdsError(
        err?.response?.data?.error || "Failed to update sender ID."
      );
    } finally {
      setEditLoading(false);
    }
  }

  function handleSenderFilterChange(field, value) {
    if (field === "status") {
      setSenderStatusFilter(value);
    }

    if (field === "message_type") {
      setSenderMessageTypeFilter(value);
    }

    setSenderPage(1);
  }

  function handleSenderSearchSubmit(e) {
    e.preventDefault();
    setSenderPage(1);
    fetchSenderIds({ page: 1, search: senderSearch });
  }

  function resetSenderFilters() {
    setSenderStatusFilter("");
    setSenderMessageTypeFilter("");
    setSenderSearch("");
    setSenderPage(1);

    fetchSenderIds({
      page: 1,
      status: "",
      messageType: "",
      search: "",
    });
  }

  function getSenderServiceId(item) {
    return item?.id || item?.service_id;
  }

  function isInactiveSender(item) {
    return String(item?.status || "").toUpperCase() === "SVC202";
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatPercent(value) {
    const num = Number(value || 0);

    return `${num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;
  }

  function formatDate(value) {
    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const metrics = useMemo(() => {
    return [
      {
        title: "Messages Sent Today",
        value: formatNumber(summary?.messages_sent_today),
        subtitle: "",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 10H16M8 14H12M7 19L3 21V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H8.2C7.77996 20 7.56994 20 7.40901 19.9183C7.26744 19.8464 7.15359 19.7326 7.08165 19.591C7 19.4301 7 19.2201 7 18.8V19Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Delivery Success Rate",
        value: formatPercent(summary?.delivery_success_rate),
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
        title: "Failed Messages",
        value: formatNumber(summary?.failed_messages),
        subtitle: "",
        iconBg: "#fee2e2",
        iconColor: "#ef4444",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M15 9L9 15M9 9L15 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        title: "Pending Delivery from dispatch/scheduled",
        value: formatNumber(
          summary?.pending_delivery_total ??
            (Number(summary?.pending_dispatch || 0) +
              Number(summary?.pending_scheduled || 0))
        ),
        subtitle: "",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 7V12L15 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ];
  }, [summary]);

  const campaignRows = useMemo(() => {
    return (Array.isArray(campaigns) ? campaigns : []).map((item) => ({
      id: item?.campaign_id || "—",
      name: item?.name || "—",
      organization:
        item?.organization ||
        item?.application_id ||
        (item?.service_id ? `Service ${item.service_id}` : "—"),
      totalSent: formatNumber(item?.total_sent),
      delivered: formatNumber(item?.successful),
      failed: formatNumber(item?.unsuccessful),
      date: item?.date || formatDate(item?.first_message_at),
      deliveryTime: item?.delivery_time || "—",
    }));
  }, [campaigns]);

  const senderRows = useMemo(() => {
    return (Array.isArray(senderIds) ? senderIds : [])
      .map((item) => ({
        id: getSenderServiceId(item),
        name: item?.name || item?.sender_id || "—",
        provider: item?.provider || "—",
        status: item?.status || "—",
        countryCode: item?.country_code || "—",
        channel: item?.channel || "—",
        messageType: item?.message_type || "—",
        createdAt: item?.createdat,
        updatedAt: item?.updatedat,
        raw: item,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [senderIds]);

  const loading = loadingSummary && !summary;

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
              Bulk SMS Management
            </h1>
            <p className="mt-2 text-[16px] text-gray-600">
              Monitor SMS campaigns, sender IDs, and approval status
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchSummary();

              if (activeTab === "campaigns") {
                fetchCampaigns();
              }

              if (activeTab === "senderIds") {
                fetchSenderIds();
              }
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
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

            {activeTab === "campaigns" && (
              <CardShell
                title="SMS Campaigns"
                subtitle="Campaigns are listed from newest to oldest"
              >
                {campaignsError ? (
                  <div className="px-6 py-4 text-sm text-amber-700">
                    {campaignsError}
                  </div>
                ) : null}

                {loadingCampaigns ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Campaign ID
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Name
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Organization
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Total Sent
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Delivered
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Failed
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Date
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Delivery Time
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {campaignRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No campaigns found
                            </td>
                          </tr>
                        ) : (
                          campaignRows.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                                {item.id}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.organization}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {item.totalSent}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-medium text-green-600">
                                {item.delivered}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-medium text-red-500">
                                {item.failed}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.date}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.deliveryTime}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pagination
                  page={campaignPage}
                  pageSize={campaignPageSize}
                  totalPages={campaignsMeta?.total_pages || 1}
                  count={campaignsMeta?.count || 0}
                  disabled={loadingCampaigns}
                  onPageChange={setCampaignPage}
                  onPageSizeChange={(value) => {
                    setCampaignPageSize(value);
                    setCampaignPage(1);
                  }}
                />
              </CardShell>
            )}

            {activeTab === "senderIds" && (
              <CardShell
                title="Sender IDs"
                subtitle="Sender IDs are listed from newest to oldest"
                rightAction={
                  <form
                    onSubmit={handleSenderSearchSubmit}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      value={senderSearch}
                      onChange={(e) => setSenderSearch(e.target.value)}
                      placeholder="Search sender/provider"
                      className="h-10 w-56 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                    />

                    <select
                      value={senderStatusFilter}
                      onChange={(e) =>
                        handleSenderFilterChange("status", e.target.value)
                      }
                      className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-400"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      value={senderMessageTypeFilter}
                      onChange={(e) =>
                        handleSenderFilterChange("message_type", e.target.value)
                      }
                      className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-400"
                    >
                      <option value="">All Types</option>
                      <option value="TRANSACTIONAL">Transactional</option>
                      <option value="PROMOTIONAL">Promotional</option>
                    </select>

                    <button
                      type="submit"
                      disabled={loadingSenderIds}
                      className="h-10 rounded-xl bg-[#02051d] px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      Search
                    </button>

                    <button
                      type="button"
                      onClick={resetSenderFilters}
                      disabled={loadingSenderIds}
                      className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Reset
                    </button>
                  </form>
                }
              >
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Create New Sender Name
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add a new sender name.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreateSenderForm((prev) => !prev)}
                      className="h-10 rounded-xl bg-[#02051d] px-4 text-sm font-semibold text-white hover:opacity-95"
                    >
                      {showCreateSenderForm ? "Hide Form" : "Add Sender Name"}
                    </button>
                  </div>

                  {showCreateSenderForm ? (
                    <form
                      onSubmit={handleCreateSenderID}
                      className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-2 xl:grid-cols-5"
                    >
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Sender Name
                        </label>
                        <input
                          value={createSenderForm.name}
                          onChange={(e) =>
                            updateCreateSenderField("name", e.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                          placeholder="PEAKMOBILE"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Provider
                        </label>
                        <input
                          value={createSenderForm.provider}
                          onChange={(e) =>
                            updateCreateSenderField("provider", e.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                          placeholder="Safaricom"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Country Code
                        </label>
                        <input
                          value={createSenderForm.country_code}
                          onChange={(e) =>
                            updateCreateSenderField(
                              "country_code",
                              e.target.value.toUpperCase()
                            )
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                          placeholder="KE"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Channel
                        </label>
                        <input
                          value={createSenderForm.channel}
                          onChange={(e) =>
                            updateCreateSenderField(
                              "channel",
                              e.target.value.toUpperCase()
                            )
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                          placeholder="SENDERNAME"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Message Type
                        </label>
                        <select
                          value={createSenderForm.message_type}
                          onChange={(e) =>
                            updateCreateSenderField("message_type", e.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-gray-400"
                          required
                        >
                          <option value="TRANSACTIONAL">TRANSACTIONAL</option>
                          <option value="PROMOTIONAL">PROMOTIONAL</option>
                        </select>
                      </div>

                      <div className="flex items-end gap-3 md:col-span-2 xl:col-span-5">
                        <button
                          type="submit"
                          disabled={createLoading}
                          className="h-11 rounded-xl bg-[#02051d] px-5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {createLoading ? "Creating..." : "Create Sender Name"}
                        </button>

                        <button
                          type="button"
                          onClick={resetCreateSenderForm}
                          disabled={createLoading}
                          className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Clear
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                {senderIdsError ? (
                  <div className="px-6 py-4 text-sm text-amber-700">
                    {senderIdsError}
                  </div>
                ) : null}

                {loadingSenderIds ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            ID
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Name
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Provider
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Status
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Country
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Channel
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Message Type
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Date Created
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Date Updated
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-right text-sm font-semibold text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {senderRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No sender IDs found
                            </td>
                          </tr>
                        ) : (
                          senderRows.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                                {item.id}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                                {item.name}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.provider}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <SenderStatusBadge status={item.status} />
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.countryCode}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.channel}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.messageType}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatDate(item.createdAt)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatDate(item.updatedAt)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item.raw)}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>

                                  {isInactiveSender(item.raw) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveSenderId(item.id)}
                                      disabled={approveLoadingId === item.id}
                                      className="rounded-xl bg-[#02051d] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {approveLoadingId === item.id
                                        ? "Approving..."
                                        : "Approve"}
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pagination
                  page={senderPage}
                  pageSize={senderPageSize}
                  totalPages={senderIdsMeta?.total_pages || 1}
                  count={senderIdsMeta?.count || 0}
                  disabled={loadingSenderIds}
                  onPageChange={setSenderPage}
                  onPageSizeChange={(value) => {
                    setSenderPageSize(value);
                    setSenderPage(1);
                  }}
                />
              </CardShell>
            )}
          </>
        )}
      </div>

      <EditSenderIDModal
        open={Boolean(editingSender)}
        form={editForm}
        setForm={setEditForm}
        onClose={closeEditModal}
        onSubmit={handleUpdateSenderID}
        loading={editLoading}
      />
    </div>
  );
}