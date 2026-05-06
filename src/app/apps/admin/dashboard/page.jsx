"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminDashboardSummary,
  GetAdminBalancesSummary,
  GetAdminOrganizations,
  GetAdminDataDispatches,
  GetAdminAllRecharges,
} from "@/app/api/actions/admin/admin";

const DashboardPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [summary, setSummary] = useState(null);
  const [balances, setBalances] = useState(null);
  const [recentOrganizations, setRecentOrganizations] = useState([]);
  const [recentServiceRequests, setRecentServiceRequests] = useState([]);
  const [failedDispatches, setFailedDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceRequestsError, setServiceRequestsError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchDashboardData();
  }, [isClient]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");
      setServiceRequestsError("");

      const results = await Promise.allSettled([
        GetAdminDashboardSummary(),
        GetAdminBalancesSummary(),
        GetAdminOrganizations("recent=true&limit=5"),
        GetAdminAllRecharges("page=1&page_size=5"),
        GetAdminDataDispatches("status=FAILED&page=1&page_size=8"),
      ]);

      const [
        summaryResult,
        balancesResult,
        recentOrgsResult,
        allRechargesResult,
        failedDispatchesResult,
      ] = results;

      const summaryData =
        summaryResult.status === "fulfilled" ? summaryResult.value?.data || null : null;

      const balancesData =
        balancesResult.status === "fulfilled" ? balancesResult.value?.data || null : null;

      const recentOrganizationsData =
        recentOrgsResult.status === "fulfilled" ? recentOrgsResult.value?.data || [] : [];

      const recentActivityData =
        allRechargesResult.status === "fulfilled"
          ? normalizeRechargeListPayload(allRechargesResult.value)
          : [];

      const failedDispatchesData =
        failedDispatchesResult.status === "fulfilled"
          ? failedDispatchesResult.value?.data || []
          : [];

      setSummary(summaryData);
      setBalances(balancesData);
      setRecentOrganizations(recentOrganizationsData);
      setRecentServiceRequests(recentActivityData);
      setFailedDispatches(failedDispatchesData);

      const criticalErrors = [];

      if (summaryResult.status === "rejected") {
        criticalErrors.push(
          summaryResult.reason?.response?.data?.error ||
            summaryResult.reason?.message ||
            "Failed to load dashboard summary"
        );
      }

      if (balancesResult.status === "rejected") {
        criticalErrors.push(
          balancesResult.reason?.response?.data?.error ||
            balancesResult.reason?.message ||
            "Failed to load balances summary"
        );
      }

      if (criticalErrors.length > 0) {
        setError(criticalErrors.join(" | "));
      }

      if (allRechargesResult.status === "rejected") {
        setServiceRequestsError(
          allRechargesResult.reason?.response?.data?.error ||
            allRechargesResult.reason?.message ||
            "Failed to load recent activity"
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err?.response?.data?.error || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeRechargeListPayload(payload) {
    const rows =
      payload?.data?.items ||
      payload?.data?.recharges ||
      payload?.data?.records ||
      payload?.data?.results ||
      payload?.items ||
      payload?.recharges ||
      payload?.records ||
      payload?.results ||
      payload?.data ||
      [];

    return Array.isArray(rows) ? rows : [];
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  const metrics = useMemo(() => {
    return [
      {
        label: "Total Organizations",
        value: formatNumber(
          balances?.total_organizations ?? summary?.total_organizations
        ),
        subtitle: "All registered organizations",
        iconBg: "#eef2ff",
        iconColor: "#9ca3af",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 21H21M5 21V7L12 3L19 7V21M9 10H15M9 14H15"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "Active Organizations",
        value: formatNumber(summary?.active_organizations),
        subtitle: "Based on recent approved recharge activity",
        iconBg: "#f3e8ff",
        iconColor: "#9ca3af",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 21C20 17.6863 16.4183 15 12 15C7.58172 15 4 17.6863 4 21M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "Messages Sent Today",
        value: formatNumber(summary?.messages_sent_today),
        subtitle: "Total SMS messages sent today",
        iconBg: "#dcfce7",
        iconColor: "#9ca3af",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 10H16M8 14H12M7 19L3 21V6C3 4.89543 3 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H8.2C7.77996 20 7.56994 20 7.40901 19.9183C7.26744 19.8464 7.15359 19.7326 7.08165 19.591C7 19.4301 7 19.2201 7 18.8V19Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "Data Balance",
        value: `${formatDecimal(balances?.total_data_gb)} GB`,
        subtitle: "Total data balance",
        iconBg: "#fef3c7",
        iconColor: "#9ca3af",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 3H18V21H6V3ZM9 7H15M9 11H15M9 15H12"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ];
  }, [summary, balances]);

  const systemHealth = [
    {
      title: "Admin Backend",
      note: error ? "Dashboard data failed to fully load" : "Dashboard data loaded",
      status: error ? "Degraded" : "Operational",
    },
    {
      title: "SMS Summary Service",
      note: balances?.sms_error
        ? `Issue detected: ${balances.sms_error}`
        : summary?.sms_error
        ? `Issue detected: ${summary.sms_error}`
        : "SMS metrics loaded",
      status:
        balances?.sms_error || summary?.sms_error ? "Degraded" : "Operational",
    },
    {
      title: "Data Dispatch Service",
      note:
        failedDispatches.length > 0
          ? "Failed dispatch list loaded"
          : "Dispatch summary loaded",
      status: "Operational",
    },
  ];

  function getStatusPill(status) {
    const normalized = String(status || "").toUpperCase();

    if (
      ["ACTIVE", "COMPLETED", "SUCCESS", "OPERATIONAL", "APPROVED"].includes(
        normalized
      )
    ) {
      return "bg-[#02051d] text-white";
    }

    if (
      ["PENDING", "IN PROGRESS", "IN_PROGRESS", "DEGRADED", "PROCESSING"].includes(
        normalized
      )
    ) {
      return "bg-gray-100 text-gray-800";
    }

    if (
      ["FAILED", "ERROR", "INACTIVE", "SUSPENDED", "REJECTED"].includes(normalized)
    ) {
      return "bg-rose-100 text-rose-700";
    }

    return "bg-gray-100 text-gray-800";
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

  function getOrganizationName(item) {
    return (
      item?.organization_name ||
      item?.organization?.name ||
      item?.organization ||
      item?.org_name ||
      item?.business_name ||
      item?.company_name ||
      item?.name ||
      item?.app_name ||
      item?.application_name ||
      item?.application_id ||
      item?.org_id ||
      item?.organization_id ||
      "—"
    );
  }

  function getServiceName(item) {
    return (
      item?.service ||
      item?.service_name ||
      item?.service_type ||
      item?.module ||
      item?.account_type ||
      item?.type ||
      item?.package ||
      item?.bundle_type ||
      "—"
    );
  }

  function getRequestStatus(item) {
    return (
      item?.status ||
      item?.approval_status ||
      item?.status_code ||
      item?.request_status ||
      "Pending"
    );
  }

  function getRechargeAmount(item) {
    const amount =
      item?.amount ??
      item?.units ??
      item?.quantity ??
      item?.value ??
      item?.recharge_amount ??
      item?.credited_units;

    if (amount === null || amount === undefined || amount === "") return "—";

    return Number(amount).toLocaleString();
  }

  function getActivityDate(item) {
    return (
      item?.created_at ||
      item?.requested_at ||
      item?.recharge_date ||
      item?.date ||
      item?.updated_at ||
      item?.timestamp
    );
  }

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-5 md:ml-64">
      <div className="w-full">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              System overview and performance metrics
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
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

        {balances?.sms_error || summary?.sms_error ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            SMS summary could not be fully loaded:{" "}
            {balances?.sms_error || summary?.sms_error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-gray-600">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-[18px] font-semibold leading-none text-gray-900">
                        {metric.value}
                      </p>
                      <p className="mt-4 text-[13px] text-green-600">
                        {metric.subtitle}
                      </p>
                    </div>

                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: metric.iconBg,
                        color: metric.iconColor,
                      }}
                    >
                      {metric.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Recent Organizations
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Date Created
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrganizations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No recent organizations found
                          </td>
                        </tr>
                      ) : (
                        recentOrganizations.slice(0, 4).map((item, index) => (
                          <tr key={item?.id || item?.external_id || index}>
                            <td className="border-b border-gray-100 px-4 py-4 text-[14px] text-gray-900">
                              {item?.name || "—"}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatDate(item?.created_at)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getStatusPill(
                                  item?.status || "Pending"
                                )}`}
                              >
                                {item?.status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Recent Activity
                  </h2>
                </div>

                {serviceRequestsError ? (
                  <div className="px-4 py-4 text-sm text-amber-700">
                    {serviceRequestsError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Service
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Amount / Units
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentServiceRequests.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No recent activity found
                          </td>
                        </tr>
                      ) : (
                        recentServiceRequests.slice(0, 4).map((item, index) => (
                          <tr
                            key={
                              item?.id ||
                              item?.request_id ||
                              item?.recharge_id ||
                              item?.reference ||
                              index
                            }
                          >
                            <td className="border-b border-gray-100 px-4 py-4 text-[14px] text-gray-900">
                              {getOrganizationName(item)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {getServiceName(item)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {getRechargeAmount(item)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatDateTime(getActivityDate(item))}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getStatusPill(
                                  getRequestStatus(item)
                                )}`}
                              >
                                {getRequestStatus(item)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-[18px] font-semibold text-gray-900">
                Recent Failed Dispatches
              </h2>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Recipient
                      </th>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Error Reason
                      </th>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedDispatches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No failed dispatches found
                        </td>
                      </tr>
                    ) : (
                      failedDispatches.slice(0, 8).map((item, index) => (
                        <tr key={item?.id || index}>
                          <td className="border-b border-gray-100 px-4 py-4 text-[14px] text-gray-900">
                            {item?.recipient || item?.msisdn || "—"}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[14px] text-red-600">
                            {item?.error_reason ||
                              item?.reason ||
                              item?.error ||
                              item?.status ||
                              "—"}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                            {formatDateTime(item?.timestamp || item?.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;