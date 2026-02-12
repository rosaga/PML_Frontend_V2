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
  period: string;     // "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
  recharged: number;  // present in API but NOT drawn
  consumed: number;   // bar
  balance: number;    // line
};

type Report = {
  consumed_all_time: number;
  consumed_in_range: number;

  recharged_all_time: number;
  recharged_in_range: number;

  balance_current: number;

  utilization_rate: number; // %
  remaining_rate: number;   // %
};

type ApiResponse = {
  report: Report;
  graph: GraphPoint[];
  meta?: any;
};

const nf = new Intl.NumberFormat("en-US");

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

  const monthNames = useMemo(
    () => [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    []
  );

  const getMonthName = (m: string) => {
    const idx = parseInt(m, 10) - 1;
    return monthNames[idx] ?? m;
  };

  const orgId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("selectedAccountId") || "";
  }, []);

  const apiUrlBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://messaging-peak-1048592730476.europe-west4.run.app/api/v1";

  const dateParams = useMemo(() => {
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
    if (!orgId) {
      setError("Organization ID not found in localStorage (selectedAccountId)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { group, startDate, endDate } = dateParams;

      const url =
        `${apiUrlBase}/organization/${orgId}/sms-utilization-report` +
        `?group=${group}&start_date=${startDate}&end_date=${endDate}&service_id=${serviceId}`;

      const config = await authHeaders();
      const res = await axios.get<ApiResponse>(url, config);

      setData(res.data);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to load SMS utilization report"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, serviceId, orgId]);

  // Build categories + consumed + balance, carry-forward balance for missing periods
  const chartPayload = useMemo(() => {
    const group = dateParams.group;
    const graph = data?.graph ?? [];

    let categories: string[] = [];
    let consumed: number[] = [];
    let balance: number[] = [];

    if (group === "yearly") {
      const years = Array.from(new Set(graph.map((g) => g.period))).sort();
      categories = years;

      consumed = new Array(categories.length).fill(0);
      balance = new Array(categories.length).fill(0);

      const idx: Record<string, number> = {};
      categories.forEach((c, i) => (idx[c] = i));

      const hasBal = new Array(categories.length).fill(false);

      graph.forEach((g) => {
        const i = idx[g.period];
        if (i === undefined) return;
        consumed[i] = Number(g.consumed ?? 0);
        balance[i] = Number(g.balance ?? 0);
        hasBal[i] = true;
      });

      let last = 0;
      for (let i = 0; i < balance.length; i++) {
        if (!hasBal[i]) balance[i] = last;
        last = balance[i];
      }
    }

    if (group === "monthly") {
      categories = monthNames;

      consumed = new Array(12).fill(0);
      balance = new Array(12).fill(0);
      const hasBal = new Array(12).fill(false);

      graph.forEach((g) => {
        const parts = (g.period || "").split("-");
        if (parts.length !== 2) return;
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx < 0 || mIdx > 11) return;

        consumed[mIdx] = Number(g.consumed ?? 0);
        balance[mIdx] = Number(g.balance ?? 0);
        hasBal[mIdx] = true;
      });

      let last = 0;
      for (let i = 0; i < 12; i++) {
        if (!hasBal[i]) balance[i] = last;
        last = balance[i];
      }
    }

    if (group === "daily") {
      const year = parseInt(selectedYear || "0", 10);
      const month = parseInt(selectedMonth || "0", 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      categories = Array.from(
        { length: daysInMonth },
        (_, i) => `${getMonthName(selectedMonth)} ${i + 1}`
      );

      consumed = new Array(daysInMonth).fill(0);
      balance = new Array(daysInMonth).fill(0);
      const hasBal = new Array(daysInMonth).fill(false);

      graph.forEach((g) => {
        const parts = (g.period || "").split("-");
        if (parts.length !== 3) return;
        const day = parseInt(parts[2], 10);
        if (day < 1 || day > daysInMonth) return;

        const i = day - 1;
        consumed[i] = Number(g.consumed ?? 0);
        balance[i] = Number(g.balance ?? 0);
        hasBal[i] = true;
      });

      let last = 0;
      for (let i = 0; i < daysInMonth; i++) {
        if (!hasBal[i]) balance[i] = last;
        last = balance[i];
      }
    }

    return { categories, consumed, balance, group };
  }, [data, dateParams.group, monthNames, selectedYear, selectedMonth]);

  const subtitle = useMemo(() => {
    if (!selectedYear) return "Consumed vs Balance (Yearly)";
    if (selectedYear && !selectedMonth) return `Consumed vs Balance (${selectedYear})`;
    return `Consumed vs Balance (${selectedYear}-${selectedMonth.padStart(2, "0")})`;
  }, [selectedYear, selectedMonth]);

  // cards: recharge shown here only
  const summary = useMemo(() => {
    const r = data?.report;
    return {
      rechargedInRange: Number(r?.recharged_in_range ?? 0),
      consumedInRange: Number(r?.consumed_in_range ?? 0),
      balanceCurrent: Number(r?.balance_current ?? 0),
      utilizationRatePct: Number(r?.utilization_rate ?? 0),
      remainingRatePct: Number(r?.remaining_rate ?? 0),
    };
  }, [data]);

  const createChart = () => {
    if (!chartRef.current || typeof window === "undefined") return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const { categories, consumed, balance } = chartPayload;

    const options: Highcharts.Options = {
      chart: {
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
      },
      title: {
        text: "SMS Utilization (Consumed vs Balance)",
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
          rotation: dateParams.group === "daily" ? -45 : 0,
        },
      },
      yAxis: [
        {
          title: {
            text: "SMS Units",
            style: { color: "#374151", fontWeight: "600" },
          },
          labels: {
            style: { color: "#6B7280" },
            formatter: function (this: any) {
              return Highcharts.numberFormat(Number(this.value ?? 0), 0);
            },
          },
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#E5E7EB",
        borderRadius: 8,
        shadow: true,
        formatter: function (this: any) {
          const idx = Number(this.x ?? 0);
          const label = categories[idx] ?? "";
          const pts = (this.points ?? []) as Array<any>;

          const getVal = (name: string) => {
            const p = pts.find((x) => x?.series?.name === name);
            return Number(p?.y ?? 0);
          };

          const c = getVal("Consumed");
          const b = getVal("Balance");

          return `
            <div style="padding:8px;">
              <div style="font-weight:600;margin-bottom:8px;color:#374151;">${label}</div>
              <div style="color:#374151;">Consumed: <strong>${nf.format(c)}</strong></div>
              <div style="color:#374151;">Balance: <strong>${nf.format(b)}</strong></div>
            </div>
          `;
        },
      },
      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 6,
          pointPadding: 0.18,
          groupPadding: 0.12,
        },
        series: {
          states: { inactive: { opacity: 1 } },
        },
      },
      series: [
        {
          name: "Consumed",
          type: "column",
          data: consumed,
          color: "#F58426",
        },
        {
          name: "Balance",
          type: "spline",
          data: balance,
          color: "#3B82F6",
          marker: { enabled: false },
          lineWidth: 3,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, subtitle, chartPayload.categories, chartPayload.consumed, chartPayload.balance]);

  const noData =
    !loading &&
    !error &&
    data &&
    (chartPayload.categories.length === 0 ||
      (chartPayload.consumed.every((v) => v === 0) &&
        chartPayload.balance.every((v) => v === 0)));

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
          <div
            ref={chartRef}
            style={{ height: "420px", width: "100%" }}
            suppressHydrationWarning
          />

          {/* Summary Cards (Recharge only here) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 font-medium">Recharged (Selected Period)</div>
              <div className="text-2xl font-bold text-green-800">
                {nf.format(summary.rechargedInRange)}
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-[#F58426] font-medium">Consumed (Selected Period)</div>
              <div className="text-2xl font-bold text-[#F58426]">
                {nf.format(summary.consumedInRange)}
              </div>
              <div className="text-xs text-[#F58426] mt-1">
                Utilization: {summary.utilizationRatePct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 font-medium">Current Balance</div>
              <div className="text-2xl font-bold text-blue-800">
                {nf.format(summary.balanceCurrent)}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Remaining: {summary.remainingRatePct.toFixed(1)}%
              </div>
            </div>

           
          </div>
        </>
      )}

      {noData && (
        <Alert severity="info" className="mt-4">
          No utilization data available for this period.
        </Alert>
      )}
    </div>
  );
}
