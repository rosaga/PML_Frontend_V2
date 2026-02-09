"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import axios from "axios";
import { Alert, Box } from "@mui/material";
import { authHeaders } from "@/app/api/utils/headers/headers";

interface SmsUtilizationVisualizationProps {
  selectedYear: string;
  selectedMonth: string; 
  serviceId?: string;
}

type GraphPoint = {
  period: string;
  total_dispatched: number;
};

type Report = {
  total_sms_all_time: number;
  total_dispatched: number;
  total_balance: number;
  utilization_rate: number;
  remaining_rate: number;
};

type ApiResponse = {
  report: Report;
  graph: GraphPoint[];
  meta?: any;
};

const nf = new Intl.NumberFormat("en-US");
const pf = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

export default function SmsUtilizationVisualization({
  selectedYear,
  selectedMonth,
  serviceId = "1",
}: SmsUtilizationVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  let org_id: string | null = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const apiUrlBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://messaging-staging-1048592730476.europe-west4.run.app/api/v1";

  const getDateParams = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

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

    const year = selectedYear;
    const month = selectedMonth.padStart(2, "0");
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();

    return {
      group: "daily",
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    if (!org_id) {
      setError("Organization ID not found in localStorage (selectedAccountId)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { group, startDate, endDate } = getDateParams;

      const url =
        `${apiUrlBase}/organization/${org_id}/sms-utilization-report` +
        `?group=${group}&start_date=${startDate}&end_date=${endDate}&service_id=${serviceId}`;

      const config = await authHeaders();
      const res = await axios.get<ApiResponse>(url, config);

      setData(res.data);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Failed to load SMS utilization report");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const processed = useMemo(() => {
    const r = data?.report;

    const dispatched = r?.total_dispatched ?? 0;
    const balance = r?.total_balance ?? 0;

    const total = dispatched + balance;

    const utilizationRate = total > 0 ? dispatched / total : 0;
    const remainingRate = total > 0 ? balance / total : 0;

    return {
      dispatched,
      balance,
      total,
      utilizationRate,
      remainingRate,
      utilizationRatePct: r?.utilization_rate ?? utilizationRate * 100,
      remainingRatePct: r?.remaining_rate ?? remainingRate * 100,
    };
  }, [data]);

  const subtitle = useMemo(() => {
    if (!selectedYear) return "Overall Utilization (Yearly View)";
    if (selectedYear && !selectedMonth) return `Overall Utilization (${selectedYear})`;
    return `Overall Utilization (${selectedYear}-${selectedMonth.padStart(2, "0")})`;
  }, [selectedYear, selectedMonth]);

  const createChart = () => {
    if (!chartRef.current || typeof window === "undefined") return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const dispatched = processed.dispatched;
    const balance = processed.balance;

    const options: Highcharts.Options = {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
      },
      title: {
        text: "SMS Utilization Overview",
        style: { fontSize: "18px", fontWeight: "600", color: "#374151" },
      },
      subtitle: {
        text: subtitle,
        style: { fontSize: "14px", color: "#6B7280" },
      },
      tooltip: {
        useHTML: true,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E7EB",
        borderRadius: 8,
        shadow: true,
        formatter: function () {
            const p = this as unknown as Highcharts.Point;
            const y = (p.y as number) ?? 0;
          const pct = (p.percentage as number) ?? 0;
          return `
            <div style="padding:8px;">
              <div style="font-weight:600;margin-bottom:8px;color:#374151;">${p.name}</div>
              <div style="color:#374151;">SMS: <strong>${nf.format(y)}</strong></div>
              <div style="color:#374151;">Share: <strong>${pct.toFixed(1)}%</strong></div>
            </div>
          `;
        },
      },
      plotOptions: {
        pie: {
          innerSize: "55%",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            distance: 18,
            formatter: function () {
                const p = this as unknown as Highcharts.Point;
                const pct = (p.percentage as number) ?? 0;
              return `<b>${p.name}</b><br/>${pct.toFixed(1)}%`;
            },
            style: { fontSize: "12px", color: "#111827" },
          },
        },
        series: {
          states: { inactive: { opacity: 1 } },
        },
      },
      series: [
        {
          type: "pie",
          name: "SMS Utilization",
          data: [
            { name: "SMS Dispatched", y: dispatched, color: "#F58426" },
            { name: "SMS Balance", y: balance, color: "#3B82F6" },
          ],
        },
      ],
      credits: { enabled: false },
      legend: {
        align: "center",
        verticalAlign: "bottom",
        itemStyle: { color: "#374151", fontSize: "14px" },
        itemHoverStyle: { color: "#111827" },
      },
    };

    chartInstance.current = Highcharts.chart(chartRef.current, options);
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, serviceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;

    const t = setTimeout(() => createChart(), 60);
    return () => {
      clearTimeout(t);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [loading, processed.dispatched, processed.balance, subtitle]);

  return (
    <div className="border-[1.5px] rounded-3xl p-6 mb-4 bg-white">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9800]" />
          <span className="ml-3 text-gray-600">Loading utilization...</span>
        </div>
      )}

      {!loading && error && (
        <Box className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️ Error loading report</div>
            <div className="text-sm text-gray-600">{error}</div>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-[#FF9800] text-white rounded hover:bg-[#F57C00] transition-colors"
            >
              Retry
            </button>
          </div>
        </Box>
      )}

      {!loading && !error && (
        <>
          <div ref={chartRef} style={{ height: "420px", width: "100%" }} suppressHydrationWarning />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-[#F58426] font-medium">SMS Dispatched</div>
              <div className="text-2xl font-bold text-[#F58426]">
                {nf.format(processed.dispatched)} SMS
              </div>
              <div className="text-xs text-[#F58426] mt-1">
                Utilization: {processed.utilizationRatePct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">SMS Balance</div>
              <div className="text-2xl font-bold text-blue-700">
                {nf.format(processed.balance)} SMS
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Remaining: {processed.remainingRatePct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Total SMS Available</div>
              <div className="text-2xl font-bold text-gray-700">
                {nf.format(processed.total)} SMS
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !error && data && processed.total === 0 && (
        <Alert severity="info" className="mt-4">
          No utilization data available for this period.
        </Alert>
      )}
    </div>
  );
}
