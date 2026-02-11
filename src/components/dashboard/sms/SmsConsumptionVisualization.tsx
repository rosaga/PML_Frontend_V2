"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import { Alert, Box } from "@mui/material";
import axios from "axios";
import { authHeaders } from "@/app/api/utils/headers/headers";

interface SmsConsumptionVisualizationProps {
  selectedYear: string;
  selectedMonth: string;
}

type GraphPoint = {
  period: string;
  customer_reach: number;
};

type Report = {
  total_unique_consumers: number;
};

type ApiResponse = {
  report: Report;
  graph: GraphPoint[];
  meta?: any;
};

const nf = new Intl.NumberFormat("en-US");

const SmsConsumptionVisualization: React.FC<SmsConsumptionVisualizationProps> = ({
  selectedYear,
  selectedMonth,
}) => {
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
    "https://messaging-peak-1048592730476.europe-west4.run.app/api/v1";

  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  const getMonthName = (m: string) => {
    const idx = parseInt(m, 10) - 1;
    return monthNames[idx] ?? "";
  };

  const parsePeriod = (p: string): Date | null => {
    const d = new Date(p);
    if (!Number.isNaN(d.getTime())) return d;

    if (/^\d{4}-\d{2}$/.test(p)) {
      const d2 = new Date(`${p}-01T00:00:00Z`);
      if (!Number.isNaN(d2.getTime())) return d2;
    }

    if (/^\d{4}$/.test(p)) {
      const d3 = new Date(`${p}-01-01T00:00:00Z`);
      if (!Number.isNaN(d3.getTime())) return d3;
    }

    return null;
  };

  const getDateParams = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (!selectedYear) {
      return {
        granularity: "yearly",
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear}-12-31`,
      };
    }

    if (selectedYear && !selectedMonth) {
      return {
        granularity: "monthly",
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }

    const year = selectedYear;
    const month = selectedMonth.padStart(2, "0");
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();

    return {
      granularity: "daily",
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
      const { granularity, startDate, endDate } = getDateParams;

      const url =
        `${apiUrlBase}/organization/${org_id}/sms-consumer-report` +
        `?granularity=${granularity}&start_date=${startDate}&end_date=${endDate}`;

      const config = await authHeaders();
      const res = await axios.get<ApiResponse>(url, config);

      setData(res.data);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to load SMS consumption report"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const processed = useMemo(() => {
    const graph = data?.graph ?? [];

    const categories: string[] = [];
    const values: number[] = [];

    for (const p of graph) {
      const dt = parsePeriod(p.period);

      if (!selectedYear) {
        // yearly label
        if (dt) categories.push(String(dt.getUTCFullYear()));
        else categories.push(p.period);
      } else if (selectedYear && !selectedMonth) {
        // monthly label
        if (dt) categories.push(monthNames[dt.getUTCMonth()]);
        else {
          const parts = p.period.split("-");
          categories.push(getMonthName(parts[1] ?? ""));
        }
      } else {
        // daily label
        if (dt) categories.push(`${monthNames[dt.getUTCMonth()]} ${dt.getUTCDate()}`);
        else {
          const parts = p.period.split("-");
          const month = parts[1] ?? "";
          const day = (parts[2] ?? "").split("T")[0];
          categories.push(`${getMonthName(month)} ${parseInt(day || "0", 10)}`);
        }
      }

      values.push(Number(p.customer_reach ?? 0));
    }

    const total = Number(data?.report?.total_unique_consumers ?? 0);

    return { categories, values, total };
  }, [data, selectedYear, selectedMonth, monthNames]);

  const getSubtitleText = () => {
    if (!selectedYear) return "Yearly Unique Recipients Reached";
    if (selectedYear && !selectedMonth) return `Monthly Unique Recipients for ${selectedYear}`;
    return `Daily Unique Recipients for ${getMonthName(selectedMonth)} ${selectedYear}`;
  };

  const createChart = () => {
    if (!chartRef.current || typeof window === "undefined") return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const options: Highcharts.Options = {
      chart: {
        type: "column",
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
      },
      title: {
        text: "Consumer Reach (Unique Destinations)",
        style: { fontSize: "18px", fontWeight: "600", color: "#374151" },
      },
      subtitle: {
        text: getSubtitleText(),
        style: { fontSize: "14px", color: "#6B7280" },
      },
      xAxis: {
        categories: processed.categories,
        labels: {
          style: { color: "#6B7280" },
          rotation: selectedMonth ? -45 : 0,
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: "Unique Recipients",
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
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E7EB",
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        formatter: function () {
          const idx = (this.x as number) ?? 0;
          const label = processed.categories[idx] ?? "";
          const value = (this.y as number) ?? 0;

          return `
            <div style="padding:8px;">
              <div style="font-weight:600;margin-bottom:8px;color:#374151;">${label}</div>
              <div style="color:#374151;">
                Unique reached: <strong>${nf.format(value)}</strong>
              </div>
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
        series: { states: { inactive: { opacity: 1 } } },
      },
      series: [
        {
          name: "Unique Reached",
          type: "column",
          data: processed.values.map((v) => ({
            y: v,
            color: v === 0 ? "rgba(245, 132, 38, 0.25)" : "#F58426",
          })),
        },
      ],
      credits: { enabled: false },
      legend: { enabled: false },
    };

    chartInstance.current = Highcharts.chart(chartRef.current, options);
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

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
  }, [processed.categories, processed.values, loading]);

  return (
    <div className="border-[1.5px] rounded-3xl p-6 mb-4 bg-white">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9800]"></div>
          <span className="ml-3 text-gray-600">Loading consumer reach...</span>
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
            style={{ height: "400px", width: "100%" }}
            suppressHydrationWarning={true}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-[#F58426] font-medium">Total Unique Reached</div>
              <div className="text-2xl font-bold text-[#F58426]">
                {nf.format(processed.total)}
              </div>
            </div>

            

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Max Reached (Single Bar)</div>
              <div className="text-2xl font-bold text-blue-700">
                {nf.format(processed.values.length ? Math.max(...processed.values) : 0)}
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !error && data?.graph?.length === 0 && (
        <Alert severity="info" className="mt-4">
          No data available for this period.
        </Alert>
      )}
    </div>
  );
};

export default SmsConsumptionVisualization;
