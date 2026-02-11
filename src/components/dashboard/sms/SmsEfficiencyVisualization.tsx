"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import axios from "axios";

import { authHeaders } from "../../../app/api/utils/headers/headers";

interface SmsEfficiencyVisualizationProps {
  selectedYear: string; 
  selectedMonth: string;
}

type SmsEfficiencyReport = {
  absent_subscriber: number;
  accepted_for_processing: number;
  delivered_to_terminal: number;
  delivery_impossible: number;
  FAILED: number;
  invalid_msisdn: number;
  network_failure: number;
  received_pending_confirmation: number;
  recieved_pending_confirmation: number;
  sendername_blacklisted: number;
  success: number;
  SUCCESS: number;

  successful: number;
  failed: number;
  total: number;
  success_rate: number;
};

type SmsEfficiencyGraphPoint = {
  period: string;

  absent_subscriber?: number;
  accepted_for_processing?: number;
  delivered_to_terminal?: number;
  delivery_impossible?: number;
  FAILED?: number;
  invalid_msisdn?: number;
  network_failure?: number;
  received_pending_confirmation?: number;
  recieved_pending_confirmation?: number;
  sendername_blacklisted?: number;
  success?: number;
  SUCCESS?: number;

  successful?: number;
  failed?: number;
  total?: number;
  success_rate?: number;
};

type ApiResponse = {
  report: SmsEfficiencyReport;
  graph: SmsEfficiencyGraphPoint[];
  meta?: any;
};

const SmsEfficiencyVisualization: React.FC<SmsEfficiencyVisualizationProps> = ({
  selectedYear,
  selectedMonth,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  const monthNames = useMemo(
    () => [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ],
    []
  );

  const getMonthName = (month: string) => {
    const idx = parseInt(month, 10) - 1;
    return monthNames[idx] ?? "";
  };

  const STATUS_SERIES = useMemo(
    () => [
      { key: "absent_subscriber", label: "AbsentSubscriber" },
      { key: "accepted_for_processing", label: "Accepted for processing" },
      { key: "delivered_to_terminal", label: "DeliveredToTerminal" },
      { key: "delivery_impossible", label: "DeliveryImpossible" },
      { key: "FAILED", label: "FAILED" },
      { key: "invalid_msisdn", label: "InvalidMsisdn" },
      { key: "network_failure", label: "Network Failure" },
      { key: "received_pending_confirmation", label: "Received Pending Confirmation" },
      { key: "recieved_pending_confirmation", label: "Recieved Pending Confirmation" },
      { key: "sendername_blacklisted", label: "SenderName Blacklisted" },
      { key: "success", label: "Success" },
      { key: "SUCCESS", label: "SUCCESS" },
    ],
    []
  );

  const orgId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("selectedAccountId") || "";
  }, []);

  const API_BASE = useMemo(() => {

    return process.env.NEXT_PUBLIC_SMS_API_URL || "https://messaging-peak-1048592730476.europe-west4.run.app/api/v1";
  }, []);

  const getDateParams = () => {
    const currentYear = new Date().getFullYear();

    if (!selectedYear) {
      return {
        group: "yearly",
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear}-12-31`,
      };
    }

    if (selectedYear && !selectedMonth) {
      return {
        group: "monthly",
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }

    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);
    const lastDay = new Date(year, month, 0).getDate();

    return {
      group: "daily",
      startDate: `${selectedYear}-${selectedMonth.padStart(2, "0")}-01`,
      endDate: `${selectedYear}-${selectedMonth.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  };

  const fetchEfficiency = async () => {
    if (!orgId) {
      setError("Organization ID not found (selectedAccountId missing).");
      return;
    }

    setLoading(true);
    setError(null);

    const { group, startDate, endDate } = getDateParams();

    try {
      const url = `${API_BASE}/organization/${orgId}/sms-efficiency-report?group=${group}&start_date=${startDate}&end_date=${endDate}`;

      const config = await authHeaders();
      const res = await axios.get(url, config);

      if (res.status === 200 && res.data) {
        setApiData(res.data);
      } else {
        setError("Unexpected response while loading SMS efficiency report.");
      }
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch SMS efficiency report.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEfficiency();
  }, [selectedYear, selectedMonth, orgId]);

  const chartPayload = useMemo(() => {
    const { group } = getDateParams();

    let categories: string[] = [];
    const seriesMap: Record<string, number[]> = {};
    STATUS_SERIES.forEach((s) => (seriesMap[s.key] = []));

    const safeGraph = apiData?.graph || [];

    if (group === "yearly") {
      const years = Array.from(new Set(safeGraph.map((g) => g.period))).sort();
      categories = years.length ? years : [];

      STATUS_SERIES.forEach((s) => (seriesMap[s.key] = new Array(categories.length).fill(0)));

      const idxByYear: Record<string, number> = {};
      categories.forEach((y, i) => (idxByYear[y] = i));

      safeGraph.forEach((row) => {
        const i = idxByYear[row.period];
        if (i === undefined) return;
        STATUS_SERIES.forEach((s) => {
          const v = (row as any)[s.key];
          seriesMap[s.key][i] = typeof v === "number" ? v : 0;
        });
      });
    }

    if (group === "monthly") {
      categories = monthNames;

      STATUS_SERIES.forEach((s) => (seriesMap[s.key] = new Array(12).fill(0)));

      safeGraph.forEach((row) => {
        const period = row.period;
        const parts = period.split("-");
        if (parts.length !== 2) return;
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex < 0 || monthIndex > 11) return;

        STATUS_SERIES.forEach((s) => {
          const v = (row as any)[s.key];
          seriesMap[s.key][monthIndex] += typeof v === "number" ? v : 0;
        });
      });
    }

    if (group === "daily") {
      const year = parseInt(selectedYear || "0", 10);
      const month = parseInt(selectedMonth || "0", 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      categories = Array.from({ length: daysInMonth }, (_, i) => `${getMonthName(selectedMonth)} ${i + 1}`);

      STATUS_SERIES.forEach((s) => (seriesMap[s.key] = new Array(daysInMonth).fill(0)));

      safeGraph.forEach((row) => {
        const period = row.period; // YYYY-MM-DD
        const parts = period.split("-");
        if (parts.length !== 3) return;
        const day = parseInt(parts[2], 10);
        if (day < 1 || day > daysInMonth) return;

        const idx = day - 1;
        STATUS_SERIES.forEach((s) => {
          const v = (row as any)[s.key];
          seriesMap[s.key][idx] += typeof v === "number" ? v : 0;
        });
      });
    }

    return { categories, seriesMap, group };
  }, [apiData, STATUS_SERIES, monthNames, selectedYear, selectedMonth]);

  const subtitle = useMemo(() => {
    if (!selectedYear) return "Yearly Efficiency Overview";
    if (selectedYear && !selectedMonth) return `Monthly Efficiency for ${selectedYear}`;
    return `Daily Efficiency for ${getMonthName(selectedMonth)} ${selectedYear}`;
  }, [selectedYear, selectedMonth, monthNames]);

  const summary = useMemo(() => {
    const r = apiData?.report;
    return {
      successful: r?.successful ?? 0,
      failed: r?.failed ?? 0,
      total: r?.total ?? 0,
      successRate: r?.success_rate ?? 0,
    };
  }, [apiData]);

  const createChart = () => {
    if (!chartRef.current || typeof window === "undefined") return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const { categories, seriesMap } = chartPayload;

    const series: Highcharts.SeriesOptionsType[] = STATUS_SERIES.map((s) => ({
      name: s.label,
      type: "column",
      data: (seriesMap[s.key] || []).map((v) => v),
    }));

    const options: Highcharts.Options = {
      chart: {
        type: "column",
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
      },
      title: {
        text: "SMS Delivery Status Breakdown",
        style: { fontSize: "18px", fontWeight: "600", color: "#374151" },
      },
      subtitle: {
        text: subtitle,
        style: { fontSize: "14px", color: "#6B7280" },
      },
      xAxis: {
        categories,
        crosshair: true,
        labels: {
          style: { color: "#6B7280" },
          rotation: selectedMonth ? -45 : 0,
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: "Number of Messages",
          style: { color: "#374151", fontWeight: "600" },
        },
        labels: {
          style: { color: "#6B7280" },
          formatter: function () {
            return Highcharts.numberFormat(this.value as number, 0);
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#E5E7EB",
        borderRadius: 8,
        shadow: true,
        formatter: function () {
          const points = this.points || [];
          const idx = this.x as number;
          const label = categories[idx] ?? "";

          let total = 0;
          const counts: { name: string; y: number; color: string }[] = [];

          points.forEach((p) => {
            const y = (p.y as number) || 0;
            total += y;
            counts.push({
              name: p.series.name,
              y,
              color: (p.series.color as string) || "#999",
            });
          });


          const succNames = new Set(["DeliveredToTerminal", "Success", "SUCCESS", "Accepted for processing", "Received Pending Confirmation", "Recieved Pending Confirmation"]);
          const successful = counts
            .filter((c) => succNames.has(c.name))
            .reduce((a, b) => a + b.y, 0);
          const failed = total - successful;
          const rate = total > 0 ? (successful / total) * 100 : 0;

          let t = `<div style="padding:8px;">`;
          t += `<div style="font-weight:600;margin-bottom:8px;color:#374151;">${label}</div>`;

          // show top statuses first
          const sorted = counts.slice().sort((a, b) => b.y - a.y);

          if (total === 0) {
            t += `<div style="color:#6B7280;font-style:italic;">No message data for this period</div>`;
          } else {
            sorted.forEach((c) => {
              if (c.y === 0) return;
              t += `<div style="margin:4px 0; display:flex; align-items:center;">`;
              t += `<span style="display:inline-block;width:10px;height:10px;background:${c.color};border-radius:2px;margin-right:8px;"></span>`;
              t += `<span style="color:#374151;">${c.name}: <strong>${Highcharts.numberFormat(c.y, 0)}</strong></span>`;
              t += `</div>`;
            });

            t += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">`;
            t += `<div style="color:#374151;"><strong>Total:</strong> ${Highcharts.numberFormat(total, 0)}</div>`;
            t += `<div style="color:#374151;"><strong>Successful:</strong> ${Highcharts.numberFormat(successful, 0)}</div>`;
            t += `<div style="color:#374151;"><strong>Failed:</strong> ${Highcharts.numberFormat(failed, 0)}</div>`;
            t += `<div style="color:#374151;font-weight:600;margin-top:4px;">Success Rate: ${rate.toFixed(1)}%</div>`;
            t += `</div>`;
          }

          t += `</div>`;
          return t;
        },
      },
      plotOptions: {
        column: {
          stacking: "normal",
          borderWidth: 0,
          borderRadius: 6,
          groupPadding: 0.12,
          pointPadding: 0.05,
        },
        series: {
          states: { inactive: { opacity: 1 } },
        },
      },
      series,
      credits: { enabled: false },
      legend: {
        align: "center",
        verticalAlign: "bottom",
        borderWidth: 0,
        itemStyle: { color: "#374151", fontSize: "12px" },
      },
    };

    chartInstance.current = Highcharts.chart(chartRef.current, options);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!apiData || loading || error) return;

    const t = setTimeout(() => createChart(), 60);

    return () => {
      clearTimeout(t);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [apiData, loading, error, chartPayload, selectedYear, selectedMonth]);

  return (
    <div className="border-[1.5px] rounded-3xl p-6 mb-4 bg-white">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9800]" />
          <span className="ml-3 text-gray-600">Loading SMS efficiency...</span>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️ Error loading data</div>
            <div className="text-sm text-gray-600">{error}</div>
            <button
              onClick={fetchEfficiency}
              className="mt-3 px-4 py-2 bg-[#FF9800] text-white rounded hover:bg-[#F57C00] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div
          ref={chartRef}
          style={{ height: "420px", width: "100%" }}
          suppressHydrationWarning={true}
        />
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-[#F58426] font-medium">Successful</div>
            <div className="text-2xl font-bold text-[#F58426]">
              {Highcharts.numberFormat(summary.successful, 0)}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Failed</div>
            <div className="text-2xl font-bold text-red-700">
              {Highcharts.numberFormat(summary.failed, 0)}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Total Messages</div>
            <div className="text-2xl font-bold text-gray-700">
              {Highcharts.numberFormat(summary.total, 0)}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Success Rate</div>
            <div className="text-2xl font-bold text-blue-700">
              {Number(summary.successRate).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsEfficiencyVisualization;
