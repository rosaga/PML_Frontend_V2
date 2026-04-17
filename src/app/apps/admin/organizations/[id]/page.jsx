"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    if (!isClient || !orgId) return;
    if (!["campaigns", "activity"].includes(activeTab)) return;
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

  const dataModules = useMemo(() => {
    return accounts.map((account) => ({
      id: account.id,
      module: account.module || "-",
      units: Number(account.units || 0),
      expires_on: account.expires_on || null,
      service: (account.service || "DATA").toUpperCase(),
    }));
  }, [accounts]);

  const enabledServices = useMemo(() => {
    const services = [];

    if (profile?.sms && !profile?.sms?.error) services.push("Bulk SMS");
    if (Number(profile?.whatsapp_balance || profile?.whatsapp?.balance || 0) > 0)
      services.push("WhatsApp Business");
    if (accounts.length > 0 || Number(profile?.total_data_units || 0) > 0)
      services.push("Bulk Data");
    if (Number(profile?.airtime_balance || 0) > 0) services.push("Bulk Airtime");
    if (organization?.ussd_enabled) services.push("USSD Flows");

    return services;
  }, [accounts, profile, organization]);

  const serviceRates = useMemo(() => {
    const rows = [];

    if (enabledServices.includes("Bulk SMS")) {
      rows.push({
        service: "Bulk SMS",
        rate: "KES 0.80",
        unit: "per SMS",
      });
    }

    if (enabledServices.includes("WhatsApp Business")) {
      rows.push({
        service: "WhatsApp Business",
        rate: "KES 1.20",
        unit: "per message",
      });
    }

    if (enabledServices.includes("Bulk Data")) {
      rows.push({
        service: "Bulk Data",
        rate: "KES 5.00",
        unit: "per GB",
      });
    }

    if (enabledServices.includes("Bulk Airtime")) {
      rows.push({
        service: "Bulk Airtime",
        rate: "KES 1.00",
        unit: "per unit",
      });
    }

    return rows;
  }, [enabledServices]);

  const recentActivity = useMemo(() => {
    const activities = [];

    if (profile?.airtime_balance) {
      activities.push({
        title: "Balance top-up",
        description: `Current airtime wallet balance is ${formatNumber(
          profile.airtime_balance
        )}`,
        time: relativeTime(organization?.updated_at || new Date().toISOString()),
      });
    }

    if (dispatches?.[0]) {
      activities.push({
        title: "Campaign launched",
        description:
          dispatches[0]?.bundle_amount || dispatches[0]?.bundleAmount
            ? `Bundle dispatch of ${
                dispatches[0]?.bundle_amount || dispatches[0]?.bundleAmount
              } recorded`
            : "A recent dispatch was recorded",
        time: relativeTime(dispatches[0]?.created_at || dispatches[0]?.createdAt),
      });
    }

    activities.push({
      title: "Template approved",
      description: enabledServices.includes("WhatsApp Business")
        ? "WhatsApp template approved"
        : "Organization profile updated",
      time: relativeTime(organization?.created_at || new Date().toISOString()),
    });

    return activities.slice(0, 3);
  }, [dispatches, profile, organization, enabledServices]);

  function formatNumber(value) {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toLocaleString() : "0";
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTableDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-CA");
  }

  function relativeTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";

    const diffMs = Date.now() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  function getStatusPill(status) {
    const normalized = (status || "").toUpperCase();

    if (
      ["ACTIVE", "SUCCESS", "COMPLETED", "HEALTHY", "VERIFIED"].includes(
        normalized
      )
    ) {
      return "bg-[#02051d] text-white";
    }

    if (["FAILED", "ERROR", "LOW", "INACTIVE"].includes(normalized)) {
      return "bg-rose-600 text-white";
    }

    return "bg-gray-100 text-gray-900";
  }

  function getContactEmail() {
    return (
      organization?.email ||
      organization?.contact_email ||
      organization?.created_by ||
      "—"
    );
  }

  function getPhone() {
    return (
      organization?.phone ||
      organization?.phone_number ||
      organization?.mobile ||
      "—"
    );
  }

  function getLocation() {
    const parts = [
      organization?.city,
      organization?.state,
      organization?.country,
      organization?.location,
    ].filter(Boolean);

    if (parts.length === 0) return "—";
    return [...new Set(parts)].join(", ");
  }

  const metricCards = [
    {
      label: "SMS Balance",
      value: formatNumber(profile?.sms?.balance),
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M7 8H17M7 12H14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Data Balance",
      value: `${formatNumber(profile?.total_data_units)} GB`,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <ellipse
            cx="12"
            cy="5"
            rx="6"
            ry="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M6 5V12C6 13.6569 8.68629 15 12 15C15.3137 15 18 13.6569 18 12V5"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M6 12V19C6 20.6569 8.68629 22 12 22C15.3137 22 18 20.6569 18 19V12"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      ),
    },
    {
      label: "Airtime Balance",
      value: formatNumber(profile?.airtime_balance),
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="4"
            width="13"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M17 8H20V16H17"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M8 8H13"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "WhatsApp Balance",
      value: formatNumber(profile?.whatsapp_balance || profile?.whatsapp?.balance),
      iconBg: "#f3e8ff",
      iconColor: "#9333ea",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="4"
            width="13"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M17 8H20V16H17"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M8 8H13"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight text-gray-900">
              {loadingProfile ? "Loading..." : organization?.name || "Organization"}
            </h1>
            <p className="mt-2 text-[16px] text-gray-600">
              Organization ID: {orgId || "—"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Edit Profile
            </button>

            <button
              type="button"
              onClick={() => setIsBalanceModalOpen(true)}
              className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Provision Balance
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loadingProfile ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 21H16M12 17V21M7 3H17C18.1046 3 19 3.89543 19 5V17H5V5C5 3.89543 5.89543 3 7 3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 8H15M9 12H15M9 16H12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-[22px] font-semibold text-gray-900">
                      Company Information
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusPill(
                          organization?.status || "ACTIVE"
                        )}`}
                      >
                        {organization?.status || "Active"}
                      </span>

                      {(organization?.verified ||
                        organization?.is_verified ||
                        organization?.kyc_status === "VERIFIED") && (
                        <span className="inline-flex rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-900">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-[18px] font-semibold text-gray-900">
                    {formatDate(organization?.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 6L12 13L20 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                    <span className="text-[16px]">{getContactEmail()}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 16.92V19.92C22.0001 20.1985 21.9419 20.474 21.8293 20.7288C21.7167 20.9836 21.5521 21.2122 21.346 21.4C21.1398 21.5878 20.8969 21.7306 20.6327 21.8192C20.3685 21.9078 20.0886 21.9403 19.811 21.914C16.731 21.579 13.7727 20.5261 11.171 18.84C8.75083 17.3017 6.69829 15.2492 5.16 12.829C3.46782 10.2151 2.41469 7.24117 2.086 4.14603C2.06099 3.86929 2.09417 3.59032 2.18341 3.32718C2.27266 3.06404 2.41598 2.82287 2.60407 2.6175C2.79216 2.41213 3.02098 2.24717 3.27601 2.13352C3.53104 2.01987 3.80708 1.96002 4.086 1.95803H7.086C7.57302 1.95324 8.04517 2.11679 8.424 2.42003C8.80283 2.72327 9.06421 3.14755 9.164 3.62403C9.35091 4.51285 9.63891 5.37747 10.024 6.20003C10.1592 6.48581 10.2128 6.80338 10.1785 7.11817C10.1441 7.43296 10.0232 7.73205 9.829 7.98203L8.559 9.25203C9.98127 11.7534 12.0537 13.8258 14.555 15.248L15.825 13.978C16.075 13.7838 16.3741 13.6629 16.6889 13.6285C17.0037 13.5942 17.3212 13.6478 17.607 13.783C18.4296 14.1681 19.2942 14.4561 20.183 14.643C20.6647 14.7438 21.0938 15.0107 21.3978 15.3966C21.7019 15.7825 21.8614 16.2637 21.849 16.758L22 16.92Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[16px]">{getPhone()}</span>
                  </div>
                </div>

                <div className="space-y-4 md:pl-8">
                  <div className="flex items-center gap-3 text-gray-700">
                    <span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 21C16 17 19 13.5 19 9.5C19 5.91015 15.866 3 12 3C8.13401 3 5 5.91015 5 9.5C5 13.5 8 17 12 21Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="9.5"
                          r="2.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                    <span className="text-[16px]">{getLocation()}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                    </span>
                    <span className="text-[16px]">
                      Last Updated: {relativeTime(organization?.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {item.label}
                      </p>
                      <p className="mt-2 text-[28px] font-semibold leading-none text-gray-900">
                        {item.value}
                      </p>
                    </div>

                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: item.iconBg,
                        color: item.iconColor,
                      }}
                    >
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-[18px] font-semibold text-gray-900">
                Enabled Services
              </h3>

              <div className="mt-6 flex flex-wrap gap-2">
                {enabledServices.length > 0 ? (
                  enabledServices.map((service) => (
                    <span
                      key={service}
                      className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
                        ["Bulk Airtime", "USSD Flows"].includes(service)
                          ? "border border-gray-200 bg-white text-gray-900"
                          : "bg-[#02051d] text-white"
                      }`}
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No enabled services available.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-8 inline-flex rounded-full bg-gray-200 p-1">
              {[
                { id: "campaigns", label: "Campaign History" },
                { id: "activity", label: "Activity Log" },
                { id: "settings", label: "Settings" },
              ].map((tab) => {
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

            {activeTab === "campaigns" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    Campaign History
                  </h2>
                </div>

                {loadingDispatches ? (
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
                            Service
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Name
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Date
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Messages Sent
                          </th>
                          <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatches.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No campaign history found
                            </td>
                          </tr>
                        ) : (
                          dispatches.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                                {item.id}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-900">
                                  {(item.service || "SMS").toUpperCase()}
                                </span>
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {item.name ||
                                  item.campaign_name ||
                                  item.bundle_amount ||
                                  "Campaign Dispatch"}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatTableDate(item.created_at || item.createdAt)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {formatNumber(
                                  item.messages_sent ||
                                    item.bundle_amount ||
                                    item.bundleAmount ||
                                    0
                                )}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <span
                                  className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusPill(
                                    item.status || "Completed"
                                  )}`}
                                >
                                  {item.status || "Completed"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {dispatchMeta ? (
                  <div className="px-6 py-4 text-sm text-gray-500">
                    Page {dispatchMeta.page} of {dispatchMeta.total_pages || 1}
                    {" • "}Total: {dispatchMeta.total_count || 0}
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-[22px] font-semibold text-gray-900">
                  Recent Activity
                </h2>

                <div className="mt-8 space-y-6">
                  {recentActivity.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded-2xl bg-gray-50 px-4 py-5"
                    >
                      <div className="flex items-start gap-4">
                        <span className="mt-2 h-3 w-3 rounded-full bg-blue-600" />
                        <div>
                          <p className="text-[16px] font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-[16px] text-gray-600">
                            {item.description}
                          </p>
                          <p className="mt-2 text-sm text-gray-500">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[22px] font-semibold text-gray-900">
                      Organization Settings
                    </h2>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-900">
                      Service Rates
                    </h3>
                    <p className="mt-1 text-[16px] text-gray-600">
                      Configure pricing rates for each service
                    </p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    Add Rate
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Service
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Rate
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Unit
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-right text-sm font-semibold text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRates.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-sm text-gray-500"
                            >
                              No service rates available yet
                            </td>
                          </tr>
                        ) : (
                          serviceRates.map((row) => (
                            <tr key={row.service}>
                              <td className="border-b border-gray-200 px-4 py-5 text-[16px] font-semibold text-gray-900">
                                {row.service}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-5 text-[16px] text-gray-900">
                                {row.rate}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-5 text-[16px] text-gray-600">
                                {row.unit}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-5">
                                <div className="flex justify-end gap-4">
                                  <button
                                    type="button"
                                    className="text-gray-900 hover:opacity-70"
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M12 20H21M16.5 3.5C16.8978 3.10218 17.4374 2.87866 18 2.87866C18.5626 2.87866 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10218 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>

                                  <button
                                    type="button"
                                    className="text-rose-600 hover:opacity-70"
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M10 11V17M14 11V17"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-[18px] font-semibold text-gray-900">
                    Configure Service Rate
                  </h3>

                  <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-600">
                        Service
                      </label>
                      <select className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400">
                        <option>Select service...</option>
                        {enabledServices.map((service) => (
                          <option key={service}>{service}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-600">
                        Rate per Unit
                      </label>
                      <input
                        type="text"
                        placeholder="0.00"
                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-600">
                        Currency
                      </label>
                      <select className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400">
                        <option>KES</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                    >
                      Save Rate
                    </button>

                    <button
                      type="button"
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default OrganizationDetailPage;