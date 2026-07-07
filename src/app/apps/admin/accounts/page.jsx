"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GetAdminBalancesSummary,
  GetAdminAllRecharges,
  AutoProvisionAdminBalance,
} from "@/app/api/actions/admin/admin";

const DEFAULT_TOPUP_FORM = {
  service: "SMS",
  units: "",
  amountSpent: "",
};

const SERVICE_LABELS = {
  SMS: "Bulk SMS",
  DATA: "Data",
  AIRTIME: "Airtime",
  WHATSAPP: "WhatsApp",
  USSD: "USSD Flows",
};

const AccountsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isClient, setIsClient] = useState(false);

  const [summary, setSummary] = useState(null);
  const [recharges, setRecharges] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rechargesError, setRechargesError] = useState("");

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("SMS");
  const [topUpForm, setTopUpForm] = useState(DEFAULT_TOPUP_FORM);
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpError, setTopUpError] = useState("");

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
      setError("");
      setRechargesError("");

      const [summaryResult, rechargeResult] = await Promise.allSettled([
        GetAdminBalancesSummary(),
        GetAdminAllRecharges("page=1&page_size=100"),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value?.data || null);
      } else {
        setSummary(null);
        setError(
          summaryResult.reason?.response?.data?.error ||
            summaryResult.reason?.message ||
            "Failed to load balances summary."
        );
      }

      if (rechargeResult.status === "fulfilled") {
        setRecharges(
          rechargeResult.value?.data?.items ||
            rechargeResult.value?.data?.recharges ||
            rechargeResult.value?.data?.records ||
            rechargeResult.value?.data?.results ||
            rechargeResult.value?.items ||
            rechargeResult.value?.recharges ||
            rechargeResult.value?.records ||
            rechargeResult.value?.results ||
            rechargeResult.value?.data ||
            []
        );
      } else {
        setRecharges([]);
        setRechargesError(
          rechargeResult.reason?.response?.data?.error ||
            rechargeResult.reason?.message ||
            "Failed to load recharge history."
        );
      }
    } catch (err) {
      console.error("Failed to load accounts page:", err);
      setError(err?.response?.data?.error || "Failed to load accounts data.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeService(rawItem) {
    const value = String(
      rawItem?.service ||
        rawItem?.service_name ||
        rawItem?.service_type ||
        rawItem?.transaction_type ||
        rawItem?.type ||
        rawItem?.module ||
        rawItem?.package ||
        ""
    )
      .trim()
      .toUpperCase();

    if (!value) return "SMS";

    if (
      value.includes("SMS") ||
      value.includes("PERSMS") ||
      value.includes("SENDERNAME")
    ) {
      return "SMS";
    }

    if (value.includes("DATA") || value.includes("GB") || value.includes("MB")) {
      return "DATA";
    }

    if (value.includes("AIRTIME")) {
      return "AIRTIME";
    }

    if (value.includes("WHATSAPP")) {
      return "WHATSAPP";
    }

    if (value.includes("USSD")) {
      return "USSD";
    }

    return value;
  }

  function getRechargeDate(item) {
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

  function getRechargeUnits(item) {
    const value =
      item?.units ??
      item?.quantity ??
      item?.amount_units ??
      item?.top_up_units ??
      item?.recharge_amount ??
      item?.credited_units ??
      0;

    return Number(value || 0);
  }

  function getRechargeCashValue(item) {
    const value =
      item?.amount_spent ??
      item?.amountSpent ??
      item?.amount ??
      item?.cash_value ??
      item?.cashValue ??
      item?.cost ??
      item?.price ??
      item?.total_amount ??
      item?.value ??
      0;

    return Number(value || 0);
  }

  function getRechargeStatus(item) {
    return String(
      item?.status ||
        item?.status_code ||
        item?.approval_status ||
        item?.request_status ||
        "APPROVED"
    ).toUpperCase();
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

  function formatCurrency(value, currency = "KES") {
    return `${currency} ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-CA");
  }

  function openTopUpModal(service) {
    setSelectedService(service);
    setTopUpForm({
      service,
      units: "",
      amountSpent: "",
    });
    setTopUpError("");
    setIsTopUpModalOpen(true);
  }

  function closeTopUpModal() {
    setIsTopUpModalOpen(false);
    setTopUpForm(DEFAULT_TOPUP_FORM);
    setTopUpError("");
    setSubmittingTopUp(false);
  }

  async function handleTopUpSubmit() {
    try {
      setSubmittingTopUp(true);
      setTopUpError("");

      const parsedUnits = Number(topUpForm.units);
      const parsedAmountSpent = Number(topUpForm.amountSpent);

      if (!topUpForm.service) {
        setTopUpError("Please select a service.");
        return;
      }

      if (!Number.isFinite(parsedUnits) || parsedUnits <= 0) {
        setTopUpError("Please enter valid units greater than zero.");
        return;
      }

      if (!Number.isFinite(parsedAmountSpent) || parsedAmountSpent <= 0) {
        setTopUpError("Please enter a valid amount spent greater than zero.");
        return;
      }

      const payload = {
        service: topUpForm.service,
        units: parsedUnits,
        amount_spent: parsedAmountSpent,
        amount: parsedAmountSpent,
      };

      await AutoProvisionAdminBalance(payload);
      closeTopUpModal();
      await fetchPageData();
    } catch (err) {
      console.error("Failed to top up service wallet:", err);
      setTopUpError(
        err?.response?.data?.error || "Failed to provision balance."
      );
    } finally {
      setSubmittingTopUp(false);
    }
  }

  const filteredApprovedRecharges = useMemo(() => {
    return (Array.isArray(recharges) ? recharges : []).filter((item) => {
      const status = getRechargeStatus(item);
      return ["APPROVED", "SUCCESS", "COMPLETED", "RCG200"].includes(status);
    });
  }, [recharges]);

  const groupedByService = useMemo(() => {
    const grouped = {
      SMS: {
        service: "SMS",
        label: "Bulk SMS",
        rechargeCount: 0,
        units: 0,
        cashValue: 0,
        lastTopUpUnits: 0,
        lastTopUpCashValue: 0,
        lastTopUpDate: null,
      },
      DATA: {
        service: "DATA",
        label: "Data",
        rechargeCount: 0,
        units: 0,
        cashValue: 0,
        lastTopUpUnits: 0,
        lastTopUpCashValue: 0,
        lastTopUpDate: null,
      },
      AIRTIME: {
        service: "AIRTIME",
        label: "Airtime",
        rechargeCount: 0,
        units: 0,
        cashValue: 0,
        lastTopUpUnits: 0,
        lastTopUpCashValue: 0,
        lastTopUpDate: null,
      },
    };

    filteredApprovedRecharges.forEach((item) => {
      const service = normalizeService(item);
      if (!grouped[service]) {
        grouped[service] = {
          service,
          label: SERVICE_LABELS[service] || service,
          rechargeCount: 0,
          units: 0,
          cashValue: 0,
          lastTopUpUnits: 0,
          lastTopUpCashValue: 0,
          lastTopUpDate: null,
        };
      }

      const units = getRechargeUnits(item);
      const cashValue = getRechargeCashValue(item);
      const dateValue = getRechargeDate(item);

      grouped[service].rechargeCount += 1;
      grouped[service].units += units;
      grouped[service].cashValue += cashValue;

      if (
        !grouped[service].lastTopUpDate ||
        new Date(dateValue).getTime() >
          new Date(grouped[service].lastTopUpDate).getTime()
      ) {
        grouped[service].lastTopUpDate = dateValue;
        grouped[service].lastTopUpUnits = units;
        grouped[service].lastTopUpCashValue = cashValue;
      }
    });

    return grouped;
  }, [filteredApprovedRecharges]);

  const walletRows = useMemo(() => {
    return [
      {
        service: "SMS",
        label: "Bulk SMS",
        currentBalance: Number(summary?.total_sms_units || 0),
        currentBalanceSuffix: "",
        totalSpent: groupedByService.SMS?.cashValue || 0,
        lastTopUpUnits: groupedByService.SMS?.lastTopUpUnits || 0,
        lastTopUpCashValue: groupedByService.SMS?.lastTopUpCashValue || 0,
        lastTopUpDate: groupedByService.SMS?.lastTopUpDate || null,
      },
      {
        service: "DATA",
        label: "Data",
        currentBalance: Number(summary?.total_data_gb || 0),
        currentBalanceSuffix: " GB",
        totalSpent: groupedByService.DATA?.cashValue || 0,
        lastTopUpUnits: groupedByService.DATA?.lastTopUpUnits || 0,
        lastTopUpCashValue: groupedByService.DATA?.lastTopUpCashValue || 0,
        lastTopUpDate: groupedByService.DATA?.lastTopUpDate || null,
      },
      {
        service: "AIRTIME",
        label: "Airtime",
        currentBalance: Number(summary?.total_airtime_units || 0),
        currentBalanceSuffix: "",
        totalSpent: groupedByService.AIRTIME?.cashValue || 0,
        lastTopUpUnits: groupedByService.AIRTIME?.lastTopUpUnits || 0,
        lastTopUpCashValue: groupedByService.AIRTIME?.lastTopUpCashValue || 0,
        lastTopUpDate: groupedByService.AIRTIME?.lastTopUpDate || null,
      },
    ];
  }, [summary, groupedByService]);

  const overviewCards = useMemo(() => {
    return [
      {
        label: "Total SMS Balances",
        value: formatNumber(summary?.total_sms_units),
        accent: "#dbeafe",
      },
      {
        label: "Total Data Balance",
        value: `${formatDecimal(summary?.total_data_gb)} GB`,
        accent: "#fef3c7",
      },
      {
        label: "Total Airtime Balance",
        value: formatNumber(summary?.total_airtime_units),
        accent: "#dcfce7",
      },
      {
        label: "Total Organizations",
        value: formatNumber(summary?.total_organizations),
        accent: "#f3e8ff",
      },
    ];
  }, [summary]);

  const revenueCards = useMemo(() => {
    const totalRevenue = walletRows.reduce(
      (sum, row) => sum + Number(row.totalSpent || 0),
      0
    );

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(totalRevenue),
        accent: "#eef2ff",
      },
      {
        label: "SMS Revenue",
        value: formatCurrency(groupedByService.SMS?.cashValue || 0),
        accent: "#dbeafe",
      },
      {
        label: "Data Revenue",
        value: formatCurrency(groupedByService.DATA?.cashValue || 0),
        accent: "#fef3c7",
      },
      {
        label: "Airtime Revenue",
        value: formatCurrency(groupedByService.AIRTIME?.cashValue || 0),
        accent: "#dcfce7",
      },
    ];
  }, [walletRows, groupedByService]);

  const expenditureCards = useMemo(() => {
    const totalExpenditure = walletRows.reduce(
      (sum, row) => sum + Number(row.totalSpent || 0),
      0
    );

    return [
      {
        label: "Total Expenditure",
        value: formatCurrency(totalExpenditure),
        accent: "#fee2e2",
      },
      {
        label: "SMS Expenditure",
        value: formatCurrency(groupedByService.SMS?.cashValue || 0),
        accent: "#dbeafe",
      },
      {
        label: "Data Expenditure",
        value: formatCurrency(groupedByService.DATA?.cashValue || 0),
        accent: "#fef3c7",
      },
      {
        label: "Airtime Expenditure",
        value: formatCurrency(groupedByService.AIRTIME?.cashValue || 0),
        accent: "#dcfce7",
      },
    ];
  }, [walletRows, groupedByService]);

  const topUpHistory = useMemo(() => {
    return filteredApprovedRecharges
      .map((item, index) => ({
        id: item?.id || item?.request_id || item?.recharge_id || index,
        service: normalizeService(item),
        serviceLabel: SERVICE_LABELS[normalizeService(item)] || normalizeService(item),
        units: getRechargeUnits(item),
        cashValue: getRechargeCashValue(item),
        status: getRechargeStatus(item),
        date: getRechargeDate(item),
        package:
          item?.package ||
          item?.module ||
          item?.service_name ||
          item?.service ||
          item?.service_type ||
          "—",
      }))
      .sort((a, b) => {
        const left = a.date ? new Date(a.date).getTime() : 0;
        const right = b.date ? new Date(b.date).getTime() : 0;
        return right - left;
      });
  }, [filteredApprovedRecharges]);

  if (!isClient) return null;

  const activeCards =
    activeTab === "overview"
      ? overviewCards
      : activeTab === "revenue"
      ? revenueCards
      : expenditureCards;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-5 md:ml-64">
      <div className="w-full">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
              Accounts & Wallet Balances
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor and manage Peak company wallet balances
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPageData}
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

        {rechargesError ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {rechargesError}
          </div>
        ) : null}

        <div className="mb-5 inline-flex rounded-full bg-gray-200 p-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "revenue", label: "Revenue" },
            { id: "expenditure", label: "Expenditure" },
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {activeCards.map((card) => (
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

            {activeTab === "overview" && (
              <>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                    <h2 className="text-[18px] font-semibold text-gray-900">
                      Company Service Wallets
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                            Service
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                            Current Balance
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                            Total Spent
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                            Last Top Up Units
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                            Last Top Up Date
                          </th>
                          <th className="border-b border-gray-200 px-4 py-4 text-center text-[13px] font-semibold text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletRows.map((row) => (
                          <tr key={row.service}>
                            <td className="border-b border-gray-100 px-4 py-4 text-[14px] font-semibold text-gray-900">
                              {row.label}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-900">
                              {formatNumber(row.currentBalance)}
                              {row.currentBalanceSuffix}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatCurrency(row.totalSpent)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatNumber(row.lastTopUpUnits)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatDate(row.lastTopUpDate)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => openTopUpModal(row.service)}
                                className="rounded-xl bg-[#02051d] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                              >
                                Top Up
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-4 py-4">
                    <h2 className="text-[18px] font-semibold text-gray-900">
                      Low Balance Alerts
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {walletRows.filter((row) => row.currentBalance <= 0).length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-500">
                        No low balance alerts right now
                      </div>
                    ) : (
                      walletRows
                        .filter((row) => row.currentBalance <= 0)
                        .map((row) => (
                          <div
                            key={row.service}
                            className="flex items-center justify-between px-4 py-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {row.label}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                Current balance is low
                              </p>
                            </div>
                            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                              Low Balance
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "revenue" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Revenue by Service
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Service
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Recharge Count
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Units
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Revenue Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletRows.map((row) => (
                        <tr key={row.service}>
                          <td className="border-b border-gray-100 px-4 py-4 text-[14px] font-semibold text-gray-900">
                            {row.label}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                            {formatNumber(groupedByService[row.service]?.rechargeCount || 0)}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                            {formatNumber(groupedByService[row.service]?.units || 0)}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-4 text-[13px] font-semibold text-gray-900">
                            {formatCurrency(groupedByService[row.service]?.cashValue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "expenditure" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Top Up History
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Service
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Units
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Amount Spent
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Package / Type
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUpHistory.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No top up history found
                          </td>
                        </tr>
                      ) : (
                        topUpHistory.map((row) => (
                          <tr key={row.id}>
                            <td className="border-b border-gray-100 px-4 py-4 text-[14px] font-semibold text-gray-900">
                              {row.serviceLabel}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatNumber(row.units)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] font-semibold text-gray-900">
                              {formatCurrency(row.cashValue)}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {row.package}
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4">
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[12px] font-semibold text-gray-800">
                                {row.status}
                              </span>
                            </td>
                            <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                              {formatDate(row.date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {isTopUpModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    Top Up {SERVICE_LABELS[selectedService] || selectedService}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Add units and capture amount of money spent
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeTopUpModal}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {topUpError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {topUpError}
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Service
                  </label>
                  <select
                    value={topUpForm.service}
                    onChange={(e) =>
                      setTopUpForm((prev) => ({
                        ...prev,
                        service: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
                  >
                    <option value="SMS">Bulk SMS</option>
                    <option value="DATA">Data</option>
                    <option value="AIRTIME">Airtime</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={topUpForm.units}
                    onChange={(e) =>
                      setTopUpForm((prev) => ({
                        ...prev,
                        units: e.target.value,
                      }))
                    }
                    placeholder="Enter units"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Amount Spent (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={topUpForm.amountSpent}
                    onChange={(e) =>
                      setTopUpForm((prev) => ({
                        ...prev,
                        amountSpent: e.target.value,
                      }))
                    }
                    placeholder="Enter amount spent"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTopUpModal}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleTopUpSubmit}
                  disabled={submittingTopUp}
                  className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingTopUp ? "Submitting..." : "Top Up"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AccountsPage;