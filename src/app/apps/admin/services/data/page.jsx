"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminBundleCatalog,
  CreateAdminBundleCatalog,
  UpdateAdminBundleCatalog,
  GetAdminDataDispatches,
  GetAdminDashboardSummary,
} from "@/app/api/actions/admin/admin";

const DEFAULT_BUNDLE_FORM = {
  bundleType: "",
  balance: "",
  expiresOn: "",
  description: "",
  status: "ACTIVE",
};

const DEFAULT_TOPUP_FORM = {
  units: "",
  expiresOn: "",
};

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
    { id: "bundleCatalog", label: "Bundle Catalog" },
    { id: "dispatchLogs", label: "Dispatch Logs" },
    { id: "expiry", label: "Expiry" },
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

function CardShell({ title, subtitle, rightAction, children, headerClassName = "" }) {
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

  if (
    normalized === "EXPIRING SOON" ||
    normalized === "EXPIRING_SOON" ||
    normalized === "FAILED"
  ) {
    return (
      <span
        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
          normalized === "FAILED"
            ? "bg-rose-600 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {normalized === "EXPIRING_SOON" ? "Expiring Soon" : value}
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
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
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

export default function BulkDataManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("bundleCatalog");

  const [summary, setSummary] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [dispatchMeta, setDispatchMeta] = useState(null);

  const [scheduledCount, setScheduledCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [totalDispatchCount, setTotalDispatchCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [bundleError, setBundleError] = useState("");
  const [dispatchError, setDispatchError] = useState("");

  const [isAddBundleOpen, setIsAddBundleOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);

  const [selectedBundle, setSelectedBundle] = useState(null);

  const [bundleForm, setBundleForm] = useState(DEFAULT_BUNDLE_FORM);
  const [topupForm, setTopupForm] = useState(DEFAULT_TOPUP_FORM);

  const [submittingBundle, setSubmittingBundle] = useState(false);
  const [submittingTopup, setSubmittingTopup] = useState(false);
  const [submittingExtend, setSubmittingExtend] = useState(false);

  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchPageData();
  }, [isClient]);

  async function fetchPageData() {
    try {
      setLoading(true);
      setPageError("");
      setBundleError("");
      setDispatchError("");

      const [
        summaryResult,
        bundleResult,
        dispatchResult,
        scheduledResult,
        successResult,
        totalResult,
      ] = await Promise.allSettled([
        GetAdminDashboardSummary(),
        GetAdminBundleCatalog("limit=200"),
        GetAdminDataDispatches("page=1&page_size=50"),
        GetAdminDataDispatches("status=SCHEDULED&page=1&page_size=1"),
        GetAdminDataDispatches("status=SUCCESS&page=1&page_size=1"),
        GetAdminDataDispatches("page=1&page_size=1"),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value?.data || null);
      } else {
        setSummary(null);
      }

      if (bundleResult.status === "fulfilled") {
        setBundles(bundleResult.value?.data || []);
      } else {
        setBundles([]);
        setBundleError(
          bundleResult.reason?.response?.data?.error ||
            "Failed to load bundle catalog."
        );
      }

      if (dispatchResult.status === "fulfilled") {
        setDispatches(dispatchResult.value?.data || []);
        setDispatchMeta(dispatchResult.value?.pagination || null);
      } else {
        setDispatches([]);
        setDispatchMeta(null);
        setDispatchError(
          dispatchResult.reason?.response?.data?.error ||
            "Failed to load dispatch logs."
        );
      }

      if (scheduledResult.status === "fulfilled") {
        setScheduledCount(
          Number(
            scheduledResult.value?.pagination?.total_count ||
              scheduledResult.value?.count ||
              0
          )
        );
      } else {
        setScheduledCount(0);
      }

      if (successResult.status === "fulfilled") {
        setSuccessCount(
          Number(
            successResult.value?.pagination?.total_count ||
              successResult.value?.count ||
              0
          )
        );
      } else {
        setSuccessCount(0);
      }

      if (totalResult.status === "fulfilled") {
        setTotalDispatchCount(
          Number(
            totalResult.value?.pagination?.total_count ||
              totalResult.value?.count ||
              0
          )
        );
      } else {
        setTotalDispatchCount(0);
      }

      const allFailed =
        summaryResult.status === "rejected" &&
        bundleResult.status === "rejected" &&
        dispatchResult.status === "rejected";

      if (allFailed) {
        setPageError("Failed to load bulk data management data.");
      }
    } catch (err) {
      console.error("Failed to load bulk data page:", err);
      setPageError("Failed to load bulk data management data.");
    } finally {
      setLoading(false);
    }
  }

  function resetBundleForm() {
    setBundleForm(DEFAULT_BUNDLE_FORM);
    setModalError("");
  }

  function resetTopupForm() {
    setTopupForm(DEFAULT_TOPUP_FORM);
    setModalError("");
  }

  function parseBundleName(item) {
    const metadata = item?.metadata || {};
    return (
      metadata?.bundle_name ||
      metadata?.name ||
      metadata?.label ||
      metadata?.bundle ||
      item?.description ||
      `${item?.bundle_type || "Bundle"}`
    );
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

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function getBundleStatus(item) {
    const expiresOn = item?.expires_on || item?.expiresOn;
    if (expiresOn) {
      const exp = new Date(expiresOn);
      const now = new Date();
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (!Number.isNaN(diffDays) && diffDays <= 7) {
        return "Expiring Soon";
      }
    }

    const rawStatus = String(item?.status || "").toUpperCase();
    if (!rawStatus) return "Active";
    if (rawStatus.includes("ACTIVE")) return "Active";
    return item?.status || "Active";
  }

  function parseBundleAmountToGB(value) {
    const raw = String(value || "").trim().toUpperCase();
    if (!raw) return 0;

    const match = raw.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return 0;

    if (raw.includes("TB")) return amount * 1024;
    if (raw.includes("GB")) return amount;
    if (raw.includes("MB")) return amount / 1024;
    if (raw.includes("KB")) return amount / (1024 * 1024);

    return amount;
  }

  async function handleCreateBundle(e) {
    e.preventDefault();
    setModalError("");

    const bundleType = Number(bundleForm.bundleType);
    const balance = Number(bundleForm.balance);

    if (!Number.isFinite(bundleType) || bundleType <= 0) {
      setModalError("Bundle type is required and must be greater than zero.");
      return;
    }

    if (!Number.isFinite(balance) || balance < 0) {
      setModalError("Balance must be zero or greater.");
      return;
    }

    try {
      setSubmittingBundle(true);

      await CreateAdminBundleCatalog({
        bundle_type: bundleType,
        balance,
        status: bundleForm.status,
        description: bundleForm.description?.trim() || "",
        expires_on: bundleForm.expiresOn
          ? new Date(bundleForm.expiresOn).toISOString()
          : null,
        metadata: {
          name: bundleForm.description?.trim() || `${bundleType}`,
        },
      });

      setIsAddBundleOpen(false);
      resetBundleForm();
      setSuccessMessage("Bundle created successfully.");
      await fetchPageData();
    } catch (err) {
      console.error("Failed to create bundle:", err);
      setModalError(
        err?.response?.data?.error || "Failed to create bundle."
      );
    } finally {
      setSubmittingBundle(false);
    }
  }

  async function handleTopupBundle(e) {
    e.preventDefault();
    setModalError("");

    if (!selectedBundle) return;

    const units = Number(topupForm.units);
    if (!Number.isFinite(units) || units <= 0) {
      setModalError("Units must be greater than zero.");
      return;
    }

    try {
      setSubmittingTopup(true);

      const currentBalance = Number(selectedBundle?.balance || 0);

      await UpdateAdminBundleCatalog(selectedBundle.bundle_type, {
        balance: currentBalance + units,
        ...(topupForm.expiresOn
          ? { expires_on: new Date(topupForm.expiresOn).toISOString() }
          : {}),
      });

      setIsTopUpOpen(false);
      setSelectedBundle(null);
      resetTopupForm();
      setSuccessMessage("Bundle balance updated successfully.");
      await fetchPageData();
    } catch (err) {
      console.error("Failed to top up bundle:", err);
      setModalError(
        err?.response?.data?.error || "Failed to top up bundle."
      );
    } finally {
      setSubmittingTopup(false);
    }
  }

  async function handleExtendBundle(e) {
    e.preventDefault();
    setModalError("");

    if (!selectedBundle) return;
    if (!topupForm.expiresOn) {
      setModalError("Please select a new expiry date.");
      return;
    }

    try {
      setSubmittingExtend(true);

      await UpdateAdminBundleCatalog(selectedBundle.bundle_type, {
        expires_on: new Date(topupForm.expiresOn).toISOString(),
      });

      setIsExtendOpen(false);
      setSelectedBundle(null);
      resetTopupForm();
      setSuccessMessage("Bundle expiry updated successfully.");
      await fetchPageData();
    } catch (err) {
      console.error("Failed to extend bundle expiry:", err);
      setModalError(
        err?.response?.data?.error || "Failed to extend bundle expiry."
      );
    } finally {
      setSubmittingExtend(false);
    }
  }

  const metrics = useMemo(() => {
    const successRate =
      totalDispatchCount > 0 ? (successCount / totalDispatchCount) * 100 : 0;

    return [
      {
        title: "Data Dispatches Today",
        value: formatNumber(summary?.data_dispatches_today),
        subtitle: "",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <ellipse
              cx="12"
              cy="5"
              rx="6"
              ry="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M6 5V12C6 13.6569 8.68629 15 12 15C15.3137 15 18 13.6569 18 12V5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M6 12V19C6 20.6569 8.68629 22 12 22C15.3137 22 18 20.6569 18 19V12"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        ),
      },
      {
        title: "Success Rate",
        value: `${successRate.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}%`,
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
        title: "Scheduled Dispatches",
        value: formatNumber(scheduledCount),
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
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 16H12.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ];
  }, [summary, scheduledCount, successCount, totalDispatchCount]);

  const bundleRows = useMemo(() => {
    return (Array.isArray(bundles) ? bundles : []).map((item) => ({
      id: item?.bundle_type,
      bundle: parseBundleName(item),
      unitsBalance: formatNumber(item?.balance),
      validity: formatDate(item?.expires_on || item?.expiresOn),
      status: getBundleStatus(item),
      raw: item,
    }));
  }, [bundles]);

  const dispatchRows = useMemo(() => {
    return (Array.isArray(dispatches) ? dispatches : []).map((item) => ({
      id: item?.id || "—",
      organization: item?.organization_name || "—",
      recipient: item?.msisdn || item?.recipient || "—",
      bundle: item?.bundle_amount || item?.bundle || "—",
      status: item?.status || "—",
      provider: item?.provider || item?.network || "—",
      timestamp: formatDateTime(item?.created_at || item?.timestamp),
    }));
  }, [dispatches]);

  const expiringBundles = useMemo(() => {
    return (Array.isArray(bundles) ? bundles : [])
      .filter((item) => {
        const expiresOn = item?.expires_on || item?.expiresOn;
        if (!expiresOn) return false;

        const expiryDate = new Date(expiresOn);
        if (Number.isNaN(expiryDate.getTime())) return false;

        const now = new Date();
        const diffDays = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return diffDays <= 7;
      })
      .sort((a, b) => {
        return (
          new Date(a?.expires_on || a?.expiresOn).getTime() -
          new Date(b?.expires_on || b?.expiresOn).getTime()
        );
      });
  }, [bundles]);

  const usageRows = useMemo(() => {
    const grouped = {};

    (Array.isArray(dispatches) ? dispatches : []).forEach((item) => {
      const org = item?.organization_name || "Unknown Organization";
      const bundle = item?.bundle_amount || item?.bundle || "Unknown";
      const key = `${org}-${bundle}`;
      const bundleGb = parseBundleAmountToGB(bundle);

      if (!grouped[key]) {
        grouped[key] = {
          organization: org,
          dataValue: bundle,
          unitsDispatched: 0,
          totalGb: 0,
        };
      }

      grouped[key].unitsDispatched += 1;
      grouped[key].totalGb += bundleGb;
    });

    return Object.values(grouped).sort((a, b) => b.totalGb - a.totalGb);
  }, [dispatches]);

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight text-gray-900">
              Bulk Data Management
            </h1>
            <p className="mt-2 text-[16px] text-gray-600">
              Manage data bundles and provisioning
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
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "bundleCatalog" && (
              <CardShell
                title="Data Bundle Catalog"
                rightAction={
                  <button
                    type="button"
                    onClick={() => {
                      resetBundleForm();
                      setIsAddBundleOpen(true);
                    }}
                    className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Add Bundle
                  </button>
                }
              >
                {bundleError ? (
                  <div className="px-6 py-4 text-sm text-amber-700">
                    {bundleError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Bundle ID
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Bundle Name
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Units Balance
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Validity
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
                      {bundleRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No bundles found
                          </td>
                        </tr>
                      ) : (
                        bundleRows.map((item) => (
                          <tr key={item.id}>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                              {item.id}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.bundle}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                              {item.unitsBalance}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {item.validity}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm">
                              <StatusPill value={item.status} />
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBundle(item.raw);
                                  resetTopupForm();
                                  setIsTopUpOpen(true);
                                }}
                                className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
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
              </CardShell>
            )}

            {activeTab === "dispatchLogs" && (
              <CardShell
                title="Data Dispatch Logs"
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
                {dispatchError ? (
                  <div className="px-6 py-4 text-sm text-amber-700">
                    {dispatchError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Dispatch ID
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Organization
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Recipient
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Bundle
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
                            No dispatch logs found
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
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {item.bundle}
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

                {dispatchMeta ? (
                  <div className="px-6 py-4 text-sm text-gray-500">
                    Page {dispatchMeta.page || 1} of {dispatchMeta.total_pages || 1}
                    {" • "}Total: {dispatchMeta.total_count || dispatchRows.length || 0}
                  </div>
                ) : null}
              </CardShell>
            )}

            {activeTab === "expiry" && (
              <div className="space-y-6">
                <CardShell title="Bundle Expiry Tracking">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Bundle ID
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Bundle
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Units Available
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Expiry Date
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bundleRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No bundle expiry data found
                            </td>
                          </tr>
                        ) : (
                          bundleRows.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                                {item.id}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {item.bundle}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {item.unitsBalance}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {item.validity}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <StatusPill value={item.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardShell>

                <div className="overflow-hidden rounded-2xl border border-yellow-300 bg-[#f7f4df] shadow-sm">
                  <div className="border-b border-yellow-300 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-600">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 8V12"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 16H12.01"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <h3 className="text-[18px] font-semibold text-gray-900">
                        Bundles Expiring in a Week
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    {expiringBundles.length === 0 ? (
                      <div className="rounded-2xl border border-yellow-400 bg-white px-4 py-4 text-sm text-gray-600">
                        No bundles are expiring within the next 7 days.
                      </div>
                    ) : (
                      expiringBundles.map((item) => (
                        <div
                          key={item.bundle_type}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-400 bg-white px-4 py-4"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-[16px] font-semibold text-gray-900">
                                {parseBundleName(item)}
                              </p>
                              <span className="inline-flex rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-gray-800">
                                {item.bundle_type}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-600">
                              {formatNumber(item.balance)} units available
                              <span className="mx-2">•</span>
                              Expires on {formatDate(item.expires_on || item.expiresOn)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBundle(item);
                              setTopupForm({
                                units: "",
                                expiresOn: item?.expires_on
                                  ? String(item.expires_on).slice(0, 10)
                                  : "",
                              });
                              setModalError("");
                              setIsExtendOpen(true);
                            }}
                            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Extend
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "usage" && (
              <CardShell
                title="Data Usage Data"
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
                        Total Usage (GB)
                      </p>
                      <p className="text-[20px] font-semibold leading-none text-gray-900">
                        {usageRows
                          .reduce((sum, item) => sum + Number(item.totalGb || 0), 0)
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
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
                          Data Value
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Units Dispatched
                        </th>
                        <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                          Total (GB)
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
                            No usage data found
                          </td>
                        </tr>
                      ) : (
                        usageRows.map((item, index) => (
                          <tr key={`${item.organization}-${index}`}>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {item.organization}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {item.dataValue}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                              {formatNumber(item.unitsDispatched)}
                            </td>
                            <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                              {Number(item.totalGb || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
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
          open={isAddBundleOpen}
          title="Add Bundle"
          onClose={() => {
            if (!submittingBundle) {
              setIsAddBundleOpen(false);
              resetBundleForm();
            }
          }}
        >
          {modalError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {modalError}
            </div>
          ) : null}

          <form onSubmit={handleCreateBundle} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Bundle Type
              </label>
              <input
                type="number"
                min="1"
                value={bundleForm.bundleType}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    bundleType: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="e.g. 20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Balance
              </label>
              <input
                type="number"
                min="0"
                value={bundleForm.balance}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    balance: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter opening balance"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Description
              </label>
              <input
                type="text"
                value={bundleForm.description}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                placeholder="e.g. 20 MB"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Expiry Date
              </label>
              <input
                type="date"
                value={bundleForm.expiresOn}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    expiresOn: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Status
              </label>
              <select
                value={bundleForm.status}
                onChange={(e) =>
                  setBundleForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddBundleOpen(false);
                  resetBundleForm();
                }}
                disabled={submittingBundle}
                className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submittingBundle}
                className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
                  submittingBundle
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {submittingBundle ? "Saving..." : "Save Bundle"}
              </button>
            </div>
          </form>
        </ModalShell>

        <ModalShell
          open={isTopUpOpen}
          title="Top Up Bundle"
          onClose={() => {
            if (!submittingTopup) {
              setIsTopUpOpen(false);
              setSelectedBundle(null);
              resetTopupForm();
            }
          }}
        >
          {modalError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {modalError}
            </div>
          ) : null}

          <form onSubmit={handleTopupBundle} className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {selectedBundle ? (
                <>
                  <div className="font-semibold text-gray-900">
                    {parseBundleName(selectedBundle)}
                  </div>
                  <div className="mt-1">
                    Current balance: {formatNumber(selectedBundle.balance)} units
                  </div>
                </>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Additional Units
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
                placeholder="Enter units to add"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Extend Expiry (optional)
              </label>
              <input
                type="date"
                value={topupForm.expiresOn}
                onChange={(e) =>
                  setTopupForm((prev) => ({
                    ...prev,
                    expiresOn: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setSelectedBundle(null);
                  resetTopupForm();
                }}
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
                {submittingTopup ? "Updating..." : "Top Up Bundle"}
              </button>
            </div>
          </form>
        </ModalShell>

        <ModalShell
          open={isExtendOpen}
          title="Extend Bundle Expiry"
          onClose={() => {
            if (!submittingExtend) {
              setIsExtendOpen(false);
              setSelectedBundle(null);
              resetTopupForm();
            }
          }}
        >
          {modalError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {modalError}
            </div>
          ) : null}

          <form onSubmit={handleExtendBundle} className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {selectedBundle ? (
                <>
                  <div className="font-semibold text-gray-900">
                    {parseBundleName(selectedBundle)}
                  </div>
                  <div className="mt-1">
                    Current expiry: {formatDate(selectedBundle.expires_on || selectedBundle.expiresOn)}
                  </div>
                </>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                New Expiry Date
              </label>
              <input
                type="date"
                value={topupForm.expiresOn}
                onChange={(e) =>
                  setTopupForm((prev) => ({
                    ...prev,
                    expiresOn: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsExtendOpen(false);
                  setSelectedBundle(null);
                  resetTopupForm();
                }}
                disabled={submittingExtend}
                className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submittingExtend}
                className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
                  submittingExtend
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {submittingExtend ? "Updating..." : "Extend"}
              </button>
            </div>
          </form>
        </ModalShell>
      </div>
    </div>
  );
}