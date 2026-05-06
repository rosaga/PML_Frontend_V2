"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminOrganizations,
  GetAdminOrganizationProfile,
  GetAdminAllRecharges,
} from "@/app/api/actions/admin/admin";
import AdjustBalanceModal from "@/components/modal/AdjustBalanceModal";

const DEFAULT_ORG_PAGE_SIZE = 10;

const ProvisionUnitsPage = () => {
  const [isClient, setIsClient] = useState(false);

  const [organizations, setOrganizations] = useState([]);
  const [recentProvisions, setRecentProvisions] = useState([]);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedOrgProfile, setSelectedOrgProfile] = useState(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const [organizationSearch, setOrganizationSearch] = useState("");
  const [appliedOrganizationSearch, setAppliedOrganizationSearch] = useState("");

  const [organizationPage, setOrganizationPage] = useState(1);
  const [organizationPageSize, setOrganizationPageSize] = useState(
    DEFAULT_ORG_PAGE_SIZE
  );

  const [loading, setLoading] = useState(true);
  const [loadingOrgProfileId, setLoadingOrgProfileId] = useState(null);

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchProvisionPageData();
  }, [isClient]);

  async function fetchProvisionPageData() {
    try {
      setLoading(true);
      setPageError("");
      setSuccessMessage("");

      const [organizationsResult, allRechargesResult] =
        await Promise.allSettled([
          GetAdminOrganizations("limit=1000"),
          GetAdminAllRecharges("page=1&page_size=50"),
        ]);

      if (organizationsResult.status === "fulfilled") {
        setOrganizations(normalizeOrganizationListPayload(organizationsResult.value));
      } else {
        setOrganizations([]);
      }

      if (allRechargesResult.status === "fulfilled") {
        setRecentProvisions(normalizeRechargeListPayload(allRechargesResult.value));
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
            organizationsResult.reason?.response?.data?.message ||
            "Failed to load organizations."
        );
      } else if (allRechargesResult.status === "rejected") {
        setPageError(
          allRechargesResult.reason?.response?.data?.error ||
            allRechargesResult.reason?.response?.data?.message ||
            "Failed to load recent provisions."
        );
      }
    } catch (err) {
      console.error("Failed to load provision page:", err);
      setPageError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load provisioning data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentProvisions() {
    try {
      const res = await GetAdminAllRecharges("page=1&page_size=50");
      setRecentProvisions(normalizeRechargeListPayload(res));
    } catch (err) {
      console.error("Failed to refresh recent provisions:", err);
    }
  }

  function normalizeOrganizationListPayload(payload) {
    const rows =
      payload?.data?.items ||
      payload?.data?.organizations ||
      payload?.data?.records ||
      payload?.data?.results ||
      payload?.items ||
      payload?.organizations ||
      payload?.records ||
      payload?.results ||
      payload?.data ||
      [];

    return Array.isArray(rows) ? rows : [];
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

  function getOrganizationId(org) {
    return org?.external_id || org?.id || org?.organization_id || org?.org_id || "";
  }

  function getOrganizationName(org) {
    return (
      org?.name ||
      org?.organization_name ||
      org?.business_name ||
      org?.company_name ||
      "Unnamed Organization"
    );
  }

  function getOrganizationEmail(org) {
    return org?.email || org?.contact_email || org?.admin_email || "—";
  }

  function getOrganizationPhone(org) {
    return org?.phone || org?.phone_number || org?.msisdn || org?.contact_phone || "—";
  }

  function getOrganizationStatus(org) {
    return org?.status || org?.status_code || org?.state || "—";
  }

  function getOrganizationApplicationId(org, profile = null) {
    return (
      profile?.application_id ||
      profile?.sms_application_id ||
      profile?.data?.application_id ||
      profile?.data?.sms_application_id ||
      org?.application_id ||
      org?.sms_application_id ||
      org?.external_id ||
      org?.id ||
      ""
    );
  }

  function getOrganizationAccounts(profile) {
    const accounts =
      profile?.accounts ||
      profile?.data?.accounts ||
      profile?.organization?.accounts ||
      [];

    return Array.isArray(accounts) ? accounts : [];
  }

  function getOrganizationBalances(profile) {
    return (
      profile?.balances ||
      profile?.balance ||
      profile?.data?.balances ||
      profile?.data?.balance ||
      profile?.data ||
      profile ||
      null
    );
  }

  async function handleOpenProvisionModal(org) {
    const orgId = getOrganizationId(org);

    if (!orgId) {
      setPageError("Organization ID is missing.");
      return;
    }

    try {
      setPageError("");
      setSuccessMessage("");
      setLoadingOrgProfileId(orgId);

      const profile = await GetAdminOrganizationProfile(orgId);

      setSelectedOrg(org);
      setSelectedOrgProfile(profile || null);
      setShowProvisionModal(true);
    } catch (err) {
      console.error("Failed to load organization profile:", err);
      setPageError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load organization profile."
      );
    } finally {
      setLoadingOrgProfileId(null);
    }
  }

  function handleCloseProvisionModal() {
    setShowProvisionModal(false);
    setSelectedOrg(null);
    setSelectedOrgProfile(null);
  }

  async function handleProvisionSuccess() {
    setSuccessMessage("Balance updated successfully.");

    await Promise.allSettled([
      fetchRecentProvisions(),
      selectedOrg ? GetAdminOrganizationProfile(getOrganizationId(selectedOrg)) : null,
    ]);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedOrganizationSearch(organizationSearch.trim());
    setOrganizationPage(1);
  }

  function handleResetSearch() {
    setOrganizationSearch("");
    setAppliedOrganizationSearch("");
    setOrganizationPage(1);
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
    if (raw.includes("DATA") || raw.includes("GB") || raw.includes("MB")) {
      return "DATA";
    }
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

  const organizationsByExternalId = useMemo(() => {
    const map = {};

    organizations.forEach((org) => {
      const externalId = org?.external_id;
      const id = org?.id;

      if (externalId) {
        map[String(externalId)] = org;
      }

      if (id) {
        map[String(id)] = org;
      }
    });

    return map;
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const search = appliedOrganizationSearch.trim().toLowerCase();

    if (!search) return organizations;

    return organizations.filter((org) => {
      const searchableText = [
        getOrganizationName(org),
        getOrganizationStatus(org),
        org?.kra_pin,
        org?.createdat,
        org?.updatedat,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [organizations, appliedOrganizationSearch]);

  const organizationTotalPages = useMemo(() => {
    if (filteredOrganizations.length === 0) return 1;
    return Math.ceil(filteredOrganizations.length / organizationPageSize);
  }, [filteredOrganizations.length, organizationPageSize]);

  const paginatedOrganizations = useMemo(() => {
    const safePage = Math.min(organizationPage, organizationTotalPages);
    const start = (safePage - 1) * organizationPageSize;
    const end = start + organizationPageSize;

    return filteredOrganizations.slice(start, end);
  }, [
    filteredOrganizations,
    organizationPage,
    organizationPageSize,
    organizationTotalPages,
  ]);

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
        const rawDate = getProvisionDate(item);

        return {
          id:
            item?.id ||
            item?.request_id ||
            item?.recharge_id ||
            `PRV-${index + 1}`,
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
          datetime: formatDateTime(rawDate),
          rawDate,
        };
      })
      .sort((a, b) => {
        const left = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const right = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return right - left;
      })
      .slice(0, 20);
  }, [recentProvisions, organizationsByExternalId]);

  const selectedOrgId = selectedOrg ? getOrganizationId(selectedOrg) : "";
  const selectedApplicationId = selectedOrg
    ? getOrganizationApplicationId(selectedOrg, selectedOrgProfile)
    : "";

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
              Search organizations, then provision or reduce DATA, AIRTIME, and SMS balances.
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

        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-[22px] font-semibold text-gray-900">
                Organizations
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Search for an organization, then click Provision to open the balance modal.
              </p>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full flex-wrap items-center gap-3 lg:w-auto"
            >
              <input
                type="text"
                value={organizationSearch}
                onChange={(e) => setOrganizationSearch(e.target.value)}
                placeholder="Search organization..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-orange-500 lg:w-80"
              />

              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-xl bg-[#02051d] px-4 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleResetSearch}
                disabled={loading}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
            </form>
          </div>

          {appliedOrganizationSearch ? (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 text-sm text-gray-600">
              Showing results for{" "}
              <span className="font-semibold text-gray-900">
                “{appliedOrganizationSearch}”
              </span>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full">
             <thead>
                <tr>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Organization
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Date Created
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-right text-sm font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                    </td>
                  </tr>
                ) : paginatedOrganizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  paginatedOrganizations.map((org) => {
                    const orgId = getOrganizationId(org);
                    const loadingThisOrg = String(loadingOrgProfileId) === String(orgId);

                    return (
                      <tr key={orgId || getOrganizationName(org)}>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                          {getOrganizationName(org)}
                        </td>

                        <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                          <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800">
                            {getOrganizationStatus(org)}
                          </span>
                        </td>

                        <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                          {formatDateTime(org?.createdat || org?.created_at)}
                        </td>

                        <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                          <button
                            type="button"
                            onClick={() => handleOpenProvisionModal(org)}
                            disabled={loadingThisOrg}
                            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {loadingThisOrg ? "Opening..." : "Provision"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
            <div className="text-sm text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(organizationPage, organizationTotalPages)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {organizationTotalPages}
              </span>
              {" • "}
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {filteredOrganizations.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={organizationPageSize}
                onChange={(e) => {
                  setOrganizationPageSize(Number(e.target.value));
                  setOrganizationPage(1);
                }}
                disabled={loading}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 disabled:opacity-60"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              <button
                type="button"
                onClick={() => setOrganizationPage((prev) => Math.max(prev - 1, 1))}
                disabled={loading || organizationPage <= 1}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setOrganizationPage((prev) =>
                    Math.min(prev + 1, organizationTotalPages)
                  )
                }
                disabled={loading || organizationPage >= organizationTotalPages}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-[22px] font-semibold text-gray-900">
                Recent Provisions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Latest provision and recharge activity across services.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRecentProvisions}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh List
            </button>
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
                        <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800">
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

      <AdjustBalanceModal
        open={showProvisionModal}
        onClose={handleCloseProvisionModal}
        orgId={selectedOrgId}
        applicationId={selectedApplicationId}
        accounts={getOrganizationAccounts(selectedOrgProfile)}
        balances={getOrganizationBalances(selectedOrgProfile)}
        onSuccess={handleProvisionSuccess}
      />
    </div>
  );
};

export default ProvisionUnitsPage;