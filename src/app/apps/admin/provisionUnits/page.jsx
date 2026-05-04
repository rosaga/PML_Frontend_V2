"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminOrganizations,
  GetAdminOrganizationProfile,
  GetAdminAllRecharges,
  AutoProvisionAdminBalance,
} from "@/app/api/actions/admin/admin";

const DEFAULT_FORM = {
  organizationId: "",
  service: "DATA",
  module: "",
  units: "",
  reason: "",
};

const ProvisionUnitsPage = () => {
  const [isClient, setIsClient] = useState(false);

  const [organizations, setOrganizations] = useState([]);
  const [recentProvisions, setRecentProvisions] = useState([]);
  const [selectedOrgProfile, setSelectedOrgProfile] = useState(null);

  const [form, setForm] = useState(DEFAULT_FORM);

  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchProvisionPageData();
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    if (!form.organizationId) {
      setSelectedOrgProfile(null);
      return;
    }

    fetchSelectedOrganizationProfile(form.organizationId);
  }, [isClient, form.organizationId]);

  async function fetchProvisionPageData() {
    try {
      setLoading(true);
      setPageError("");
      setSuccessMessage("");

      const [organizationsResult, allRechargesResult] =
        await Promise.allSettled([
          GetAdminOrganizations("limit=500"),
          GetAdminAllRecharges("page=1&page_size=50"),
        ]);

      if (organizationsResult.status === "fulfilled") {
        setOrganizations(organizationsResult.value?.data || []);
      } else {
        setOrganizations([]);
      }

      if (allRechargesResult.status === "fulfilled") {
        setRecentProvisions(
          allRechargesResult.value?.data?.items ||
            allRechargesResult.value?.data?.recharges ||
            allRechargesResult.value?.data?.records ||
            allRechargesResult.value?.data?.results ||
            allRechargesResult.value?.items ||
            allRechargesResult.value?.recharges ||
            allRechargesResult.value?.records ||
            allRechargesResult.value?.results ||
            allRechargesResult.value?.data ||
            []
        );
      } else {
        setRecentProvisions([]);
      }

      if (
        organizationsResult.status === "rejected" &&
        allRechargesResult.status === "rejected"
      ) {
        setPageError("Failed to load provisioning data.");
      } else if (organizationsResult.status === "rejected") {
        setPageError(
          organizationsResult.reason?.response?.data?.error ||
            "Failed to load organizations."
        );
      } else if (allRechargesResult.status === "rejected") {
        setPageError(
          allRechargesResult.reason?.response?.data?.error ||
            "Failed to load recent provisions."
        );
      }
    } catch (err) {
      console.error("Failed to load provision page:", err);
      setPageError(
        err?.response?.data?.error || "Failed to load provisioning data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchSelectedOrganizationProfile(orgId) {
    try {
      setLoadingProfile(true);
      const res = await GetAdminOrganizationProfile(orgId);
      setSelectedOrgProfile(res || null);
    } catch (err) {
      console.error("Failed to load selected organization profile:", err);
      setSelectedOrgProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setFormError("");
    setSuccessMessage("");
  }

  const accounts = useMemo(() => {
    return Array.isArray(selectedOrgProfile?.accounts)
      ? selectedOrgProfile.accounts
      : [];
  }, [selectedOrgProfile]);

  const serviceOptions = useMemo(() => {
    const existing = new Set(
      accounts
        .map((acc) => String(acc?.service || "").toUpperCase())
        .filter(Boolean)
    );

    if (existing.size === 0) return ["DATA", "AIRTIME", "SMS"];
    return Array.from(existing);
  }, [accounts]);

  const filteredModules = useMemo(() => {
    return accounts.filter(
      (acc) => String(acc?.service || "").toUpperCase() === form.service
    );
  }, [accounts, form.service]);

  const organizationsByExternalId = useMemo(() => {
    const map = {};
    organizations.forEach((org) => {
      if (org?.external_id) {
        map[String(org.external_id)] = org;
      }
    });
    return map;
  }, [organizations]);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;

      setForm((prev) => {
        const next = {
          ...prev,
          [field]: value,
        };

        if (field === "organizationId") {
          next.service = "DATA";
          next.module = "";
          next.units = "";
          next.reason = "";
        }

        if (field === "service") {
          next.module = "";
        }

        return next;
      });
    };
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
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

  function normalizeProvisionService(item) {
    const raw = String(
      item?.service ||
        item?.service_name ||
        item?.service_type ||
        item?.transaction_type ||
        item?.type ||
        item?.module ||
        item?.package ||
        ""
    )
      .trim()
      .toUpperCase();

    if (!raw) return "SMS";
    if (raw.includes("SMS") || raw.includes("PERSMS")) return "SMS";
    if (raw.includes("DATA") || raw.includes("GB") || raw.includes("MB"))
      return "DATA";
    if (raw.includes("AIRTIME")) return "AIRTIME";
    return raw;
  }

  function getProvisionUnits(item) {
    return Number(
      item?.units ??
        item?.amount ??
        item?.quantity ??
        item?.value ??
        item?.recharge_amount ??
        item?.credited_units ??
        0
    );
  }

  function getProvisionDate(item) {
    return (
      item?.created_at ||
      item?.createdat ||
      item?.requested_at ||
      item?.recharge_date ||
      item?.updated_at ||
      item?.updatedat ||
      item?.date ||
      item?.timestamp ||
      null
    );
  }

  function getProvisionAdmin(item) {
    return item?.created_by || item?.createdby || item?.updated_by || "Admin User";
  }

  const mappedRecentProvisions = useMemo(() => {
    return (Array.isArray(recentProvisions) ? recentProvisions : [])
      .map((item, index) => {
        const applicationId =
          item?.application_id ||
          item?.organization_external_id ||
          item?.org_id ||
          item?.organization_id ||
          "";

        const org = organizationsByExternalId[String(applicationId)] || null;
        const service = normalizeProvisionService(item);

        return {
          id: item?.id || item?.request_id || item?.recharge_id || `PRV-${index + 1}`,
          organization:
            org?.name ||
            item?.organization_name ||
            item?.organization?.name ||
            item?.organization ||
            item?.org_name ||
            item?.business_name ||
            item?.company_name ||
            applicationId ||
            "—",
          service,
          amount: `${formatNumber(getProvisionUnits(item))} units`,
          admin: getProvisionAdmin(item),
          datetime: formatDateTime(getProvisionDate(item)),
        };
      })
      .sort((a, b) => {
        const left = a.datetime ? new Date(a.datetime).getTime() : 0;
        const right = b.datetime ? new Date(b.datetime).getTime() : 0;
        return right - left;
      })
      .slice(0, 20);
  }, [recentProvisions, organizationsByExternalId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const unitsNumber = Number(form.units);

    if (!form.organizationId) {
      setFormError("Please select an organization.");
      return;
    }

    if (!form.service) {
      setFormError("Please select a service.");
      return;
    }

    if (!unitsNumber || unitsNumber <= 0) {
      setFormError("Units must be greater than zero.");
      return;
    }

    if (!form.module.trim()) {
      setFormError("Please enter a package or module.");
      return;
    }

    try {
      setSubmitting(true);

      await AutoProvisionAdminBalance({
        package: form.module.trim(),
        units: Math.floor(unitsNumber),
        service: form.service,
        org_id: form.organizationId,
        reason: form.reason.trim(),
      });

      setSuccessMessage("Balance provisioned successfully.");
      resetForm();
      await fetchProvisionPageData();
    } catch (err) {
      setFormError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Request failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
              Provision Units
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Provision balance units to organizations
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProvisionPageData}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Adjust Balance
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {formError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Organization
                </label>
                <select
                  value={form.organizationId}
                  onChange={handleChange("organizationId")}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  disabled={submitting || loading}
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.external_id} value={org.external_id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Service
                </label>
                <select
                  value={form.service}
                  onChange={handleChange("service")}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  disabled={submitting || loadingProfile}
                >
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {filteredModules.length > 0 ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Use Existing Module
                  </label>
                  <select
                    value={
                      filteredModules.some((acc) => acc.module === form.module)
                        ? form.module
                        : ""
                    }
                    onChange={handleChange("module")}
                    disabled={submitting}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">Custom / New Module</option>
                    {filteredModules.map((acc) => (
                      <option key={acc.id} value={acc.module || ""}>
                        {acc.module || "Unnamed module"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Package / Module
                </label>
                <input
                  type="text"
                  value={form.module}
                  onChange={handleChange("module")}
                  placeholder={
                    form.service === "DATA"
                      ? "e.g. 5GB"
                      : form.service === "AIRTIME"
                      ? "e.g. AIRTIME"
                      : "e.g. SMS"
                  }
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Units
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.units}
                  onChange={handleChange("units")}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Enter units"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Reason
                </label>
                <textarea
                  value={form.reason}
                  onChange={handleChange("reason")}
                  disabled={submitting}
                  rows={3}
                  placeholder="Optional for provisioning"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {loadingProfile ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  Loading organization modules...
                </div>
              ) : filteredModules.length > 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    Current {form.service} modules
                  </h4>
                  <div className="space-y-1">
                    {filteredModules.map((acc) => (
                      <p key={acc.id} className="text-sm text-gray-600">
                        {acc.module || "Unnamed module"} —{" "}
                        {formatNumber(acc.units)} units
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-4 ${
                    submitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300"
                  }`}
                >
                  {submitting ? "Provisioning..." : "Provision Balance"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-[22px] font-semibold text-gray-900">
              Recent Provisions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Provision ID
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Organization
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Service
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Admin
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Date & Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                    </td>
                  </tr>
                ) : mappedRecentProvisions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No recent provisions found
                    </td>
                  </tr>
                ) : (
                  mappedRecentProvisions.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                        {item.id}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-800">
                          {item.service}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.amount}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.admin}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.datetime}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionUnitsPage;