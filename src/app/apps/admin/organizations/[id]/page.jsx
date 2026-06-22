"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  GetAdminOrganizationProfile,
  GetAdminOrganizationDataDispatches,
  GetAdminOrganizationRates,
  CreateAdminOrganizationRate,
  UpdateAdminOrganizationRate,
  DeleteAdminOrganizationRate,
  GetAdminOrganizationRecharges,
  GetAdminOrganizationRevenue,
  GetAllSMSs,
} from "@/app/api/actions/admin/admin";
import AdjustBalanceModal from "@/components/modal/AdjustBalanceModal";

const DEFAULT_RATE_FORM = {
  service: "",
  rate: "",
  currency: "KES",
};

const OrganizationDetailPage = () => {
  const params = useParams();

  const [activeTab, setActiveTab] = useState("campaigns");
  const [dispatchServiceFilter, setDispatchServiceFilter] = useState("DATA");
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
  const [smsDispatches, setSmsDispatches] = useState([]);
  const [dispatchMeta, setDispatchMeta] = useState(null);
  const [smsDispatchMeta, setSmsDispatchMeta] = useState(null);
  const [recharges, setRecharges] = useState(null);
  const [revenue, setRevenue] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDispatches, setLoadingDispatches] = useState(false);
  const [loadingRecharges, setLoadingRecharges] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [dispatchError, setDispatchError] = useState("");
  const [rates, setRates] = useState([]);
  const [savingRate, setSavingRate] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [editingRateId, setEditingRateId] = useState(null);
  const [rateForm, setRateForm] = useState(DEFAULT_RATE_FORM);

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

  useEffect(() => {
    if (!isClient || !orgId) return;
    if (activeTab !== "activity") return;
    fetchRecharges();
  }, [isClient, orgId, activeTab]);

  useEffect(() => {
    if (!isClient || !orgId) return;
    if (activeTab !== "settings") return;
    fetchRates();
    fetchRevenue();
  }, [isClient, orgId, activeTab]);

  async function fetchProfile() {
    try {
      setLoadingProfile(true);
      setError("");

      const res = await GetAdminOrganizationProfile(orgId);
      setProfile(res || null);
    } catch (err) {
      console.error("Failed to load organization profile:", err);
      setError(
        err?.response?.data?.error || "Failed to load organization profile."
      );
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function fetchDispatches() {
    try {
      setLoadingDispatches(true);
      setDispatchError("");

      const smsApplicationId = getSmsApplicationId();
      const smsQuery = "limit=10";

      const results = await Promise.allSettled([
        GetAdminOrganizationDataDispatches(orgId, "page=1&page_size=20"),
        smsApplicationId
          ? GetAllSMSs(smsApplicationId, smsQuery)
          : Promise.resolve({ data: [] }),
      ]);

      const [dataDispatchesResult, smsDispatchesResult] = results;

      if (dataDispatchesResult.status === "fulfilled") {
        setDispatches(normalizeListPayload(dataDispatchesResult.value));
        setDispatchMeta(getPaginationPayload(dataDispatchesResult.value));
      } else {
        setDispatches([]);
        setDispatchMeta(null);
      }

      if (smsDispatchesResult.status === "fulfilled") {
        setSmsDispatches(normalizeListPayload(smsDispatchesResult.value));
        setSmsDispatchMeta(getPaginationPayload(smsDispatchesResult.value));
      } else {
        setSmsDispatches([]);
        setSmsDispatchMeta(null);
      }

      const dispatchErrors = [];

      if (dataDispatchesResult.status === "rejected") {
        dispatchErrors.push(
          dataDispatchesResult.reason?.response?.data?.error ||
            dataDispatchesResult.reason?.message ||
            "Failed to load data dispatches"
        );
      }

      if (smsDispatchesResult.status === "rejected") {
        dispatchErrors.push(
          smsDispatchesResult.reason?.response?.data?.error ||
            smsDispatchesResult.reason?.message ||
            "Failed to load SMS dispatches"
        );
      }

      if (dispatchErrors.length > 0) {
        setDispatchError(dispatchErrors.join(" | "));
      }
    } catch (err) {
      console.error("Failed to load dispatches:", err);
      setDispatches([]);
      setSmsDispatches([]);
      setDispatchMeta(null);
      setSmsDispatchMeta(null);
      setDispatchError(
        err?.response?.data?.error || "Failed to load dispatch history."
      );
    } finally {
      setLoadingDispatches(false);
    }
  }

  async function fetchRecharges() {
    try {
      setLoadingRecharges(true);
      setActivityError("");

      const res = await GetAdminOrganizationRecharges(orgId);
      setRecharges(res || null);
    } catch (err) {
      console.error("Failed to load organization recharges:", err);
      setRecharges(null);
      setActivityError(
        err?.response?.data?.error || "Failed to load organization activity."
      );
    } finally {
      setLoadingRecharges(false);
    }
  }

  async function fetchRates() {
    try {
      setLoadingRates(true);
      setRatesError("");

      const res = await GetAdminOrganizationRates(orgId);
      setRates(res?.data || []);
    } catch (err) {
      console.error("Failed to load organization rates:", err);
      setRates([]);
      setRatesError(
        err?.response?.data?.error || "Failed to load organization rates."
      );
    } finally {
      setLoadingRates(false);
    }
  }

  async function fetchRevenue() {
    try {
      setLoadingRevenue(true);

      const res = await GetAdminOrganizationRevenue(orgId);
      setRevenue(res?.data || res || null);
    } catch (err) {
      console.error("Failed to load organization revenue:", err);
      setRevenue(null);
    } finally {
      setLoadingRevenue(false);
    }
  }

  function normalizeListPayload(payload) {
    const rows =
      payload?.data?.items ||
      payload?.data?.dispatches ||
      payload?.data?.campaigns ||
      payload?.data?.accounts ||
      payload?.data?.records ||
      payload?.data?.results ||
      payload?.items ||
      payload?.dispatches ||
      payload?.campaigns ||
      payload?.accounts ||
      payload?.records ||
      payload?.results ||
      payload?.data ||
      [];

    return Array.isArray(rows) ? rows : [];
  }

  function getPaginationPayload(payload) {
    return (
      payload?.pagination ||
      payload?.data?.pagination ||
      payload?.meta ||
      payload?.data?.meta ||
      null
    );
  }

  function getSmsApplicationId() {
    return (
      profile?.sms?.application_id ||
      profile?.sms?.app_id ||
      profile?.sms?.id ||
      organization?.application_id ||
      organization?.app_id ||
      organization?.external_id ||
      orgId
    );
  }

  function resetRateForm() {
    setEditingRateId(null);
    setRateForm(DEFAULT_RATE_FORM);
    setRatesError("");
  }

  function handleEditRate(row) {
    setEditingRateId(row.id);
    setRateForm({
      service: row.service || "",
      rate: row.rate ?? "",
      currency: row.currency || "KES",
    });
    setRatesError("");
  }

  async function handleDeleteRate(row) {
    const confirmed = window.confirm(
      `Delete rate for ${row.service_label || row.service}?`
    );
    if (!confirmed) return;

    try {
      setRatesError("");
      await DeleteAdminOrganizationRate(orgId, row.id);
      if (editingRateId === row.id) resetRateForm();
      await Promise.allSettled([fetchRates(), fetchRevenue()]);
    } catch (err) {
      console.error("Failed to delete rate:", err);
      setRatesError(err?.response?.data?.error || "Failed to delete rate.");
    }
  }

  async function handleSaveRate() {
    try {
      setSavingRate(true);
      setRatesError("");

      const parsedRate = Number(rateForm.rate);

      if (!rateForm.service) {
        setRatesError("Please select a service.");
        return;
      }

      if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        setRatesError("Please enter a valid rate greater than zero.");
        return;
      }

      const payload = {
        service: rateForm.service,
        rate: parsedRate,
        currency: rateForm.currency || "KES",
      };

      if (editingRateId) {
        await UpdateAdminOrganizationRate(orgId, editingRateId, payload);
      } else {
        await CreateAdminOrganizationRate(orgId, payload);
      }

      resetRateForm();
      await Promise.allSettled([fetchRates(), fetchRevenue()]);
    } catch (err) {
      console.error("Failed to save rate:", err);
      setRatesError(err?.response?.data?.error || "Failed to save rate.");
    } finally {
      setSavingRate(false);
    }
  }

  const organization = profile?.organization || {};
  const accounts = Array.isArray(profile?.accounts) ? profile.accounts : [];

  const dataModules = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return accounts
      .map((account) => ({
        id: account.id,
        module: account.module || "-",
        units: Number(account.units || 0),
        expires_on: account.expires_on || null,
        service: (account.service || "DATA").toUpperCase(),
      }))
      .filter((account) => {
        if (!account.expires_on) return false;

        const expiryDate = new Date(account.expires_on);
        if (Number.isNaN(expiryDate.getTime())) return false;

        expiryDate.setHours(0, 0, 0, 0);

        return expiryDate >= threeMonthsAgo;
      });
  }, [accounts]);

  const enabledServices = useMemo(() => {
    const services = [];

    if (profile?.sms && !profile?.sms?.error) services.push("Bulk SMS");
    if (accounts.length > 0 || Number(profile?.total_data_units || 0) > 0)
      services.push("Bulk Data");
    if (Number(profile?.airtime_balance || 0) > 0) services.push("Bulk Airtime");

    return services;
  }, [accounts, profile]);

  const serviceRates = useMemo(() => {
    return (Array.isArray(rates) ? rates : []).map((row) => ({
      id: row.id,
      service: row.service,
      serviceLabel: row.service_label || row.service,
      rate: row.rate,
      currency: row.currency || "KES",
      unit: row.unit || "—",
      rateDisplay: `${row.currency || "KES"} ${Number(row.rate || 0).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`,
    }));
  }, [rates]);

  const revenueServices = useMemo(() => {
    const services = Array.isArray(revenue?.services) ? revenue.services : [];

    return services.map((row) => ({
      service: row.service,
      serviceLabel: row.service_label || row.service,
      revenue: Number(row.revenue || 0),
      rechargeCount: Number(row.recharge_count || 0),
      rechargeUnits: Number(row.recharge_units || 0),
      rate: Number(row.rate || 0),
      currency: row.currency || revenue?.currency || "KES",
      unit: row.unit || "—",
    }));
  }, [revenue]);

  const visibleDispatches = useMemo(() => {
    return dispatchServiceFilter === "SMS" ? smsDispatches : dispatches;
  }, [dispatchServiceFilter, smsDispatches, dispatches]);

  const visibleDispatchMeta = useMemo(() => {
    return dispatchServiceFilter === "SMS" ? smsDispatchMeta : dispatchMeta;
  }, [dispatchServiceFilter, smsDispatchMeta, dispatchMeta]);

  const recentActivity = useMemo(() => {
    const activityItems = [];

    const dataRecharges = Array.isArray(recharges?.data_recharges)
      ? recharges.data_recharges
      : [];

    const smsRecharges = Array.isArray(recharges?.sms_recharges)
      ? recharges.sms_recharges
      : [];

    dataRecharges.forEach((item, index) => {
      activityItems.push({
        id: `data-${item?.id || index}`,
        title: "Data Recharge",
        description: `${formatNumber(item?.units)} units added`,
        timeValue: item?.created_at || item?.createdAt,
        time: relativeTime(item?.created_at || item?.createdAt),
        status: item?.status || "Approved",
      });
    });

    smsRecharges.forEach((item, index) => {
      const smsCreatedAt = item?.createdat || item?.created_at || item?.CreatedAt;

      
      activityItems.push({
        id: `sms-${item?.id || index}`,
        title: "SMS Recharge",
        description: `${formatNumber(item?.units)} SMS units added`,
        timeValue: smsCreatedAt,
        time: formatTableDateTime(smsCreatedAt),
        status: item?.status_code || item?.status || "Approved",
      });
    });

    dispatches.forEach((item, index) => {
      activityItems.push({
        id: `dispatch-${item?.id || index}`,
        title: "Dispatch Recorded",
        description:
          item?.bundle_amount || item?.bundleAmount
            ? `Dispatch of ${item?.bundle_amount || item?.bundleAmount} recorded`
            : item?.status
            ? `Dispatch status: ${item.status}`
            : "A dispatch record was created",
        timeValue: item?.created_at || item?.createdAt,
        time: relativeTime(item?.created_at || item?.createdAt),
        status: item?.status || "Completed",
      });
    });

    return activityItems
      .sort((a, b) => {
        const timeA = a.timeValue ? new Date(a.timeValue).getTime() : 0;
        const timeB = b.timeValue ? new Date(b.timeValue).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 8);
  }, [recharges, dispatches]);

  function formatNumber(value) {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toLocaleString() : "0";
  }

  function formatCurrency(value, currency = "KES") {
    const num = Number(value || 0);
    return `${currency} ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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

  function formatTableDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
    const normalized = String(status || "").toUpperCase();

    if (
      ["ACTIVE", "SUCCESS", "COMPLETED", "HEALTHY", "VERIFIED", "APPROVED"].includes(
        normalized
      )
    ) {
      return "bg-[#02051d] text-white";
    }

    if (["FAILED", "ERROR", "LOW", "INACTIVE", "REJECTED"].includes(normalized)) {
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

  function getDispatchId(item) {
    return (
      item?.id ||
      item?.campaign_id ||
      item?.request_id ||
      item?.requestid ||
      item?.service_id ||
      item?.sid ||
      "—"
    );
  }

  function getDispatchService(item) {
    if (dispatchServiceFilter === "SMS") return "SMS";
    return (item?.service || "DATA").toUpperCase();
  }

  function getDispatchDescription(item) {
    if (dispatchServiceFilter === "SMS") {
      return (
        item?.status_desc ||
        item?.status_description ||
        item?.delivery_status ||
        item?.metadata?.status_desc ||
        item?.metadata?.deliveryStatus ||
        "SMS Dispatch Record"
      );
    }

    return (
      item?.name ||
      item?.campaign_name ||
      item?.bundle_amount ||
      "Dispatch Record"
    );
  }

  function getDispatchDate(item) {
    return (
      item?.created_at ||
      item?.createdAt ||
      item?.createdat ||
      item?.date ||
      item?.first_message_at ||
      item?.last_message_at ||
      item?.updated_at ||
      item?.updatedAt
    );
  }

  function getDispatchVolume(item) {
    return (
      item?.messages_sent ||
      item?.total_messages ||
      item?.message_count ||
      item?.successful_messages ||
      item?.success_count ||
      item?.delivered_count ||
      item?.accepted_count ||
      item?.bundle_amount ||
      item?.bundleAmount ||
      0
    );
  }

  function getDispatchStatus(item) {
    return (
      item?.status ||
      item?.status_code ||
      item?.delivery_status ||
      item?.campaign_status ||
      "Completed"
    );
  }

  function getDispatchSource(item) {
    return item?.source || item?.sender || item?.sender_id || item?.from || "—";
  }

  function getDispatchDestination(item) {
    return (
      item?.destination ||
      item?.recipient ||
      item?.msisdn ||
      item?.metadata?.msisdn ||
      item?.metadata?.Msisdn ||
      "—"
    );
  }

  function getDispatchStatusDesc(item) {
    return (
      item?.status_desc ||
      item?.status_description ||
      item?.delivery_status ||
      item?.metadata?.status_desc ||
      item?.metadata?.DeliveryStatus ||
      item?.metadata?.deliveryStatus ||
      item?.status ||
      "—"
    );
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
      label: "Messages Sent Today",
      value: formatNumber(profile?.sms?.messages_sent_today),
      iconBg: "#f3e8ff",
      iconColor: "#9333ea",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H15.2C16.8802 2 17.7202 2 18.362 2.32698C18.9265 2.6146 19.3854 3.07354 19.673 3.63803C20 4.27976 20 6.11984 20 6.8V12.2C20 13.8802 20 14.7202 19.673 15.362C19.3854 15.9265 18.9265 16.3854 18.362 16.673C17.7202 17 16.8802 17 15.2 17H9L4 21V6.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 7H16M8 11H13"
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
              onClick={fetchProfile}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Refresh Profile
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
                </div>

                <div className="space-y-4 md:pl-8">
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
                      className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white"
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
                { id: "campaigns", label: "Dispatch History" },
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
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    Dispatch History
                  </h2>

                  <div className="inline-flex rounded-full bg-gray-100 p-1">
                    {[
                      { id: "DATA", label: "Data" },
                      { id: "SMS", label: "SMS" },
                    ].map((filter) => {
                      const active = dispatchServiceFilter === filter.id;

                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setDispatchServiceFilter(filter.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-[#02051d] text-white"
                              : "text-gray-700 hover:bg-white"
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dispatchError ? (
                  <div className="mx-6 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {dispatchError}
                  </div>
                ) : null}

                {loadingDispatches ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        {dispatchServiceFilter === "SMS" ? (
                          <tr>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              ID
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Source
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Destination
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Status Desc
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Created At
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Status
                            </th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Dispatch ID
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Service
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Description
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Date
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Volume
                            </th>
                            <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                              Status
                            </th>
                          </tr>
                        )}
                      </thead>

                      <tbody>
                        {visibleDispatches.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-10 text-center text-sm text-gray-500"
                            >
                              No {dispatchServiceFilter === "SMS" ? "SMS" : "data"} dispatch history found
                            </td>
                          </tr>
                        ) : dispatchServiceFilter === "SMS" ? (
                          visibleDispatches.map((item, index) => (
                            <tr key={item?.id || item?.campaign_id || item?.request_id || index}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                                {getDispatchId(item)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {getDispatchSource(item)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {getDispatchDestination(item)}
                              </td>
                              <td className="max-w-[420px] border-b border-gray-100 px-6 py-5 text-sm text-gray-700">
                                <span className="line-clamp-2">
                                  {getDispatchStatusDesc(item)}
                                </span>
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatTableDateTime(getDispatchDate(item))}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <span
                                  className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusPill(
                                    getDispatchStatus(item)
                                  )}`}
                                >
                                  {getDispatchStatus(item)}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          visibleDispatches.map((item, index) => (
                            <tr key={item?.id || item?.campaign_id || item?.request_id || index}>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                                {getDispatchId(item)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-900">
                                  {getDispatchService(item)}
                                </span>
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {getDispatchDescription(item)}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                                {formatTableDate(getDispatchDate(item))}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                                {formatNumber(getDispatchVolume(item))}
                              </td>
                              <td className="border-b border-gray-100 px-6 py-5 text-sm">
                                <span
                                  className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusPill(
                                    getDispatchStatus(item)
                                  )}`}
                                >
                                  {getDispatchStatus(item)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {visibleDispatchMeta ? (
                  <div className="px-6 py-4 text-sm text-gray-500">
                    Page {visibleDispatchMeta.page} of {visibleDispatchMeta.total_pages || 1}
                    {" • "}Total: {visibleDispatchMeta.total_count || 0}
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-[22px] font-semibold text-gray-900">
                  Recent Activity
                </h2>

                {activityError ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {activityError}
                  </div>
                ) : null}

                {loadingRecharges ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    {recentActivity.length === 0 ? (
                      <div className="rounded-2xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        No recent activity found
                      </div>
                    ) : (
                      recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-gray-50 px-4 py-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <span className="mt-2 h-3 w-3 rounded-full bg-blue-600" />
                              <div>
                                <p className="text-[16px] font-semibold text-gray-900">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-[16px] text-gray-600">
                                  {item.description}
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                  {item.time}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusPill(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[22px] font-semibold text-gray-900">
                        Revenue Summary
                      </h2>
                      <p className="mt-1 text-[16px] text-gray-600">
                        Revenue based on approved recharges and configured rates
                      </p>
                    </div>
                  </div>

                  {loadingRevenue ? (
                    <div className="mt-6 text-sm text-gray-500">Loading revenue...</div>
                  ) : revenue ? (
                    <>
                      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Revenue
                          </p>
                          <p className="mt-2 text-[24px] font-semibold text-gray-900">
                            {formatCurrency(revenue?.total_revenue, revenue?.currency)}
                          </p>
                        </div>

                        {revenueServices.slice(0, 3).map((item) => (
                          <div key={item.service} className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-600">
                              {item.serviceLabel}
                            </p>
                            <p className="mt-2 text-[20px] font-semibold text-gray-900">
                              {formatCurrency(item.revenue, item.currency)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.rechargeCount} recharge(s) • {formatNumber(item.rechargeUnits)} units
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 overflow-x-auto">
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
                                Recharge Count
                              </th>
                              <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                                Units
                              </th>
                              <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                                Revenue
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueServices.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-8 text-center text-sm text-gray-500"
                                >
                                  No revenue data available
                                </td>
                              </tr>
                            ) : (
                              revenueServices.map((row) => (
                                <tr key={row.service}>
                                  <td className="border-b border-gray-200 px-4 py-4 text-sm font-semibold text-gray-900">
                                    {row.serviceLabel}
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-600">
                                    {formatCurrency(row.rate, row.currency)} / {row.unit}
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-900">
                                    {formatNumber(row.rechargeCount)}
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-900">
                                    {formatNumber(row.rechargeUnits)}
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-4 text-sm font-semibold text-gray-900">
                                    {formatCurrency(row.revenue, row.currency)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {revenue?.sms_error ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          SMS revenue could not be fully loaded: {revenue.sms_error}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-6 text-sm text-gray-500">
                      Revenue data not available.
                    </div>
                  )}
                </div>

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
                      onClick={resetRateForm}
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

                  {ratesError ? (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {ratesError}
                    </div>
                  ) : null}

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
                          {loadingRates ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-8 text-center text-sm text-gray-500"
                              >
                                Loading rates...
                              </td>
                            </tr>
                          ) : serviceRates.length === 0 ? (
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
                              <tr key={row.id}>
                                <td className="border-b border-gray-200 px-4 py-5 text-[16px] font-semibold text-gray-900">
                                  {row.serviceLabel}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-5 text-[16px] text-gray-900">
                                  {row.rateDisplay}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-5 text-[16px] text-gray-600">
                                  {row.unit}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-5">
                                  <div className="flex justify-end gap-4">
                                    <button
                                      type="button"
                                      onClick={() => handleEditRate(row)}
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
                                      onClick={() => handleDeleteRate(row)}
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
                      {editingRateId ? "Edit Service Rate" : "Configure Service Rate"}
                    </h3>

                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-600">
                          Service
                        </label>
                        <select
                          value={rateForm.service}
                          onChange={(e) =>
                            setRateForm((prev) => ({
                              ...prev,
                              service: e.target.value,
                            }))
                          }
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400"
                        >
                          <option value="">Select service...</option>
                          <option value="SMS">Bulk SMS</option>
                          <option value="DATA">Bulk Data</option>
                          <option value="AIRTIME">Bulk Airtime</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-600">
                          Rate per Unit
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rateForm.rate}
                          onChange={(e) =>
                            setRateForm((prev) => ({
                              ...prev,
                              rate: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-600">
                          Currency
                        </label>
                        <select
                          value={rateForm.currency}
                          onChange={(e) =>
                            setRateForm((prev) => ({
                              ...prev,
                              currency: e.target.value,
                            }))
                          }
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400"
                        >
                          <option value="KES">KES</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveRate}
                        disabled={savingRate}
                        className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingRate
                          ? editingRateId
                            ? "Updating..."
                            : "Saving..."
                          : editingRateId
                          ? "Update Rate"
                          : "Save Rate"}
                      </button>

                      <button
                        type="button"
                        onClick={resetRateForm}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    Data Bundle Expiry
                  </h2>
                  <p className="mt-1 text-[16px] text-gray-600">
                    Expiry comes from the organization profile accounts data
                  </p>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Module
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Units
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Service
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                            Expires On
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataModules.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-sm text-gray-500"
                            >
                              No account modules available
                            </td>
                          </tr>
                        ) : (
                          dataModules.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-gray-200 px-4 py-4 text-sm font-semibold text-gray-900">
                                {item.module}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-900">
                                {formatNumber(item.units)}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-600">
                                {item.service}
                              </td>
                              <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-600">
                                {item.expires_on ? formatDate(item.expires_on) : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
          applicationId={orgId}
          accounts={dataModules}
          balances={{
            sms_balance: profile?.sms?.balance || 0,
            data_balance: profile?.total_data_units || 0,
            airtime_balance: profile?.airtime_balance || 0,
          }}
          organization={organization}
          onSuccess={async () => {
            await fetchProfile();

            if (activeTab === "settings") {
              await Promise.allSettled([fetchRates(), fetchRevenue()]);
            }

            if (activeTab === "activity") {
              await fetchRecharges();
            }
          }}
        />
      </div>
    </div>
  );
};

export default OrganizationDetailPage;