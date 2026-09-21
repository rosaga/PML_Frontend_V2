"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminBalancesSummary,
  GetAdminBundleCatalog,
  UpdateAdminBundleCatalog,
} from "@/app/api/actions/admin/admin";

const DATA_BUNDLE_OPTIONS = [10, 20, 50, 100, 150, 200, 500, 1000, 1024, 1025];

const DEFAULT_DATA_TOPUP_FORM = {
  bundleType: "1024",
  units: "",
};

function normalizeList(payload) {
  const source = payload?.data ?? payload;

  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.items)) return source.items;
  if (Array.isArray(source?.records)) return source.records;
  if (Array.isArray(source?.results)) return source.results;
  if (Array.isArray(source?.bundles)) return source.bundles;

  return [];
}

function getSummaryPayload(payload) {
  if (
    payload?.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload || null;
}

const AccountsPage = () => {
  const [isClient, setIsClient] = useState(false);

  const [summary, setSummary] = useState(null);
  const [bundles, setBundles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submittingDataTopUp, setSubmittingDataTopUp] = useState(false);

  const [error, setError] = useState("");
  const [bundleError, setBundleError] = useState("");
  const [dataTopUpError, setDataTopUpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [dataTopUpForm, setDataTopUpForm] = useState(DEFAULT_DATA_TOPUP_FORM);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchPageData();
  }, [isClient]);

  async function fetchPageData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setError("");
      setBundleError("");

      const [summaryResult, bundleResult] = await Promise.allSettled([
        GetAdminBalancesSummary(),
        GetAdminBundleCatalog("limit=200"),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(getSummaryPayload(summaryResult.value));
      } else {
        setSummary(null);
        setError(
          summaryResult.reason?.response?.data?.error ||
            summaryResult.reason?.message ||
            "Failed to load balances summary."
        );
      }

      if (bundleResult.status === "fulfilled") {
        setBundles(normalizeList(bundleResult.value));
      } else {
        setBundles([]);
        setBundleError(
          bundleResult.reason?.response?.data?.error ||
            bundleResult.reason?.message ||
            "Failed to load data bundle catalog."
        );
      }
    } catch (err) {
      console.error("Failed to load accounts page:", err);
      setError(err?.response?.data?.error || "Failed to load accounts data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function handleDataTopUpSubmit(e) {
    e.preventDefault();
    setDataTopUpError("");
    setSuccessMessage("");

    const bundleType = Number(dataTopUpForm.bundleType);
    const units = Number(dataTopUpForm.units);

    if (!Number.isFinite(bundleType) || bundleType <= 0) {
      setDataTopUpError("Please select a valid bundle size.");
      return;
    }

    if (!Number.isFinite(units) || units <= 0) {
      setDataTopUpError("Please enter units greater than zero.");
      return;
    }

    try {
      setSubmittingDataTopUp(true);

      const existingBundle = bundleLookup.get(String(bundleType));
      const currentBalance = Number(
        existingBundle?.balance ?? existingBundle?.global_units ?? 0
      );
      const nextBalance = currentBalance + Math.floor(units);

      await UpdateAdminBundleCatalog(bundleType, {
        balance: nextBalance,
      });

      setDataTopUpForm((prev) => ({ ...prev, units: "" }));
      setSuccessMessage("Bundle config updated successfully.");
      await fetchPageData(false);
    } catch (err) {
      console.error("Failed to update bundle config:", err);
      setDataTopUpError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to update bundle config."
      );
    } finally {
      setSubmittingDataTopUp(false);
    }
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

  function formatBundleSize(value) {
    const mb = Number(value || 0);
    if (!Number.isFinite(mb) || mb <= 0) return "-";

    if (mb >= 1024) {
      return `${formatNumber(mb)} MB (${formatDecimal(mb / 1024)} GB)`;
    }

    return `${formatNumber(mb)} MB`;
  }

  const bundleLookup = useMemo(() => {
    const lookup = new Map();

    (Array.isArray(bundles) ? bundles : []).forEach((item) => {
      const key = item?.bundle_type ?? item?.bundle_size ?? item?.module;
      if (key !== undefined && key !== null) {
        lookup.set(String(key), item);
      }
    });

    return lookup;
  }, [bundles]);

  const bundleOptions = useMemo(() => {
    const values = new Set(DATA_BUNDLE_OPTIONS.map((item) => String(item)));

    (Array.isArray(bundles) ? bundles : []).forEach((item) => {
      const key = item?.bundle_type ?? item?.bundle_size ?? item?.module;
      if (key !== undefined && key !== null) values.add(String(key));
    });

    return Array.from(values).sort((a, b) => Number(a) - Number(b));
  }, [bundles]);

  const bundleRows = useMemo(() => {
    return (Array.isArray(bundles) ? bundles : [])
      .map((item) => {
        const bundleType = Number(
          item?.bundle_type ?? item?.bundle_size ?? item?.module ?? 0
        );
        const units = Number(item?.balance ?? item?.global_units ?? 0);

        return {
          id: item?.id || bundleType,
          bundleType,
          units,
          gb: (units * bundleType) / 1024,
          status: item?.status || "ACTIVE",
        };
      })
      .sort((a, b) => a.bundleType - b.bundleType);
  }, [bundles]);

  const selectedBundle = bundleLookup.get(String(dataTopUpForm.bundleType));
  const selectedBundleUnits = Number(
    selectedBundle?.balance ?? selectedBundle?.global_units ?? 0
  );
  const selectedBundleGb =
    (selectedBundleUnits * Number(dataTopUpForm.bundleType || 0)) / 1024;

  const summaryCards = useMemo(() => {
    return [
      {
        label: "SMS Units",
        value: formatNumber(summary?.total_sms_units),
        accent: "#dbeafe",
      },
      {
        label: "Data Account Balance",
        value: `${formatDecimal(summary?.total_data_gb)} GB`,
        accent: "#fef3c7",
      },
      {
        label: "Airtime Units",
        value: formatNumber(summary?.total_airtime_units),
        accent: "#dcfce7",
      },
      {
        label: "Organizations",
        value: formatNumber(summary?.total_organizations),
        accent: "#eef2ff",
      },
    ];
  }, [summary]);

  if (!isClient) return null;

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50 p-5 ">
      <div className="w-full">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
              Accounts & Wallet Balances
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update bundle configs and review the data bundle catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPageData()}
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

        {bundleError ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {bundleError}
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
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-gray-600">
                        {card.label}
                      </p>
                      <p className="mt-2 text-[18px] font-semibold leading-none text-gray-900">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: card.accent }}
                    >
                      <span className="h-4 w-4 rounded-full bg-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-4">
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Update Bundle Configs
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update the existing global units for a specific data bundle size.
                </p>
              </div>

              <form onSubmit={handleDataTopUpSubmit} className="p-4">
                {dataTopUpError ? (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {dataTopUpError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-600">
                      Bundle Size
                    </label>
                    <select
                      value={dataTopUpForm.bundleType}
                      onChange={(e) =>
                        setDataTopUpForm((prev) => ({
                          ...prev,
                          bundleType: e.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
                    >
                      {bundleOptions.map((value) => (
                        <option key={value} value={value}>
                          {formatBundleSize(value)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-600">
                      Number of Units
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={dataTopUpForm.units}
                      onChange={(e) =>
                        setDataTopUpForm((prev) => ({
                          ...prev,
                          units: e.target.value,
                        }))
                      }
                      placeholder="Number of units"
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 divide-y divide-gray-100 border-y border-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Current Global Units
                    </p>
                    <p className="mt-2 text-[20px] font-semibold text-gray-900">
                      {formatNumber(selectedBundleUnits)}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Current Global GB
                    </p>
                    <p className="mt-2 text-[20px] font-semibold text-gray-900">
                      {formatDecimal(selectedBundleGb)} GB
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingDataTopUp}
                    className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingDataTopUp ? "Updating..." : "Update Bundle Config"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-4">
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Data Bundle Catalog
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Bundle Size
                      </th>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Units
                      </th>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Size in GB
                      </th>
                      <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No data bundles found
                        </td>
                      </tr>
                    ) : (
                      bundleRows.map((row) => (
                        <tr key={row.id}>
                          <td className="border-b border-gray-100 px-4 py-4 text-[14px] font-semibold text-gray-900">
                            {formatBundleSize(row.bundleType)}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                            {formatNumber(row.units)}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                            {formatDecimal(row.gb)} GB
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                              {row.status}
                            </span>
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

export default AccountsPage;
