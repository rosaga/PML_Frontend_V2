"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminSMSDashboardSummary,
  GetAdminSMSCampaignSummaries,
  GetAdminSMSSenderIDs,
  ApproveAdminSMSSenderID,
  GetAdminOrganizations,
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
    { id: "senderIdApprovals", label: "Sender ID Approvals" },
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

export default function BulkSMSManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsMeta, setCampaignsMeta] = useState(null);
  const [senderIds, setSenderIds] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingSenderIds, setLoadingSenderIds] = useState(false);

  const [error, setError] = useState("");
  const [campaignsError, setCampaignsError] = useState("");
  const [senderIdsError, setSenderIdsError] = useState("");
  const [approveLoadingId, setApproveLoadingId] = useState(null);

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

    if (activeTab === "senderIdApprovals") {
      fetchSenderIds();
    }
  }, [activeTab, isClient]);

  async function fetchInitialData() {
    try {
      setError("");

      const [summaryResult, orgsResult] = await Promise.allSettled([
        fetchSummary(),
        fetchOrganizations(),
      ]);

      if (summaryResult.status === "rejected" && orgsResult.status === "rejected") {
        setError("Failed to load Bulk SMS management data.");
      }
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

  async function fetchOrganizations() {
    try {
      const res = await GetAdminOrganizations("limit=500");
      setOrganizations(res?.data || []);
      return res;
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setOrganizations([]);
      throw err;
    }
  }

  async function fetchCampaigns() {
    try {
      setLoadingCampaigns(true);
      setCampaignsError("");

      const res = await GetAdminSMSCampaignSummaries("page=1&page_size=50");
      setCampaigns(res?.data || []);
      setCampaignsMeta(res?.pagination || null);
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

  async function fetchSenderIds() {
    try {
      setLoadingSenderIds(true);
      setSenderIdsError("");

      const res = await GetAdminSMSSenderIDs("page=1&page_size=100");
      setSenderIds(res?.data || []);
    } catch (err) {
      console.error("Failed to load sender IDs:", err);
      setSenderIds([]);
      setSenderIdsError(
        err?.response?.data?.error || "Failed to load sender ID approvals."
      );
    } finally {
      setLoadingSenderIds(false);
    }
  }

  async function handleApproveSenderId(serviceId) {
    try {
      setApproveLoadingId(serviceId);
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
    return d.toLocaleDateString("en-CA");
  }

  const organizationsByExternalId = useMemo(() => {
    const map = {};
    (organizations || []).forEach((org) => {
      if (org?.external_id) {
        map[String(org.external_id)] = org;
      }
    });
    return map;
  }, [organizations]);

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

  const senderApprovalRows = useMemo(() => {
    const allRows = (Array.isArray(senderIds) ? senderIds : []).map((item) => {
      const rawStatus = String(item?.status || "").toUpperCase();
      const isApproved =
        rawStatus.includes("ACTIVE") || rawStatus.includes("APPROVED");
      const applicationId = item?.application_id || "";
      const organizationName =
        organizationsByExternalId[String(applicationId)]?.name ||
        applicationId ||
        "—";

      return {
        serviceId: item?.service_id,
        senderId: item?.sender_id || "—",
        organization: organizationName,
        status: isApproved ? "Approved" : "Pending",
        requestDate: formatDate(item?.createdat),
        approvedDate: isApproved ? formatDate(item?.updatedat) : "—",
        sortDate: isApproved ? item?.updatedat || item?.createdat : item?.createdat,
      };
    });

    const pending = allRows
      .filter((item) => item.status === "Pending")
      .sort(
        (a, b) =>
          new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime()
      );

    const approved = allRows
      .filter((item) => item.status === "Approved")
      .sort(
        (a, b) =>
          new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime()
      )
      .slice(0, 5);

    return [...pending, ...approved];
  }, [senderIds, organizationsByExternalId]);

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
              Monitor SMS campaigns and sender ID approvals
            </p>
          </div>

          <button
            type="button"
            onClick={fetchInitialData}
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

                {campaignsMeta ? (
                  <div className="px-6 py-4 text-sm text-gray-500">
                    Page {campaignsMeta.page || 1} of{" "}
                    {campaignsMeta.total_pages || 1}
                    {" • "}Total: {campaignsMeta.total_count || campaigns.length || 0}
                  </div>
                ) : null}
              </CardShell>
            )}

            {activeTab === "senderIdApprovals" && (
              <CardShell
                title="Sender ID Approvals"
                subtitle="Showing all pending requests and last 5 approved requests"
              >
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
                            Sender ID
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Organization
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Status
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Request Date
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Approved Date
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-right text-sm font-semibold text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {senderApprovalRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No sender ID approvals found
                            </td>
                          </tr>
                        ) : (
                          senderApprovalRows.map((item) => (
                            <tr key={`${item.senderId}-${item.requestDate}-${item.serviceId}`}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                                {item.senderId}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.organization}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                {item.status === "Pending" ? (
                                  <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-900">
                                    Pending
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white">
                                    Approved
                                  </span>
                                )}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.requestDate}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.approvedDate}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                                {item.status === "Pending" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSenderId(item.serviceId)}
                                    disabled={approveLoadingId === item.serviceId}
                                    className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {approveLoadingId === item.serviceId
                                      ? "Approving..."
                                      : "Approve"}
                                  </button>
                                ) : null}
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
          </>
        )}
      </div>
    </div>
  );
}