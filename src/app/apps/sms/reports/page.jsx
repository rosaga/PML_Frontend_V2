"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography, Box, CircularProgress } from "@mui/material";

// ✅ Update these imports to match your project structure/components
import SmsConsumptionVisualization from "@/components/dashboard/sms/SmsConsumptionVisualization";
import SmsBalanceVisualization from "@/components/dashboard/sms/SmsBalanceVisualization";
import SmsEfficiencyVisualization from "@/components/dashboard/sms/SmsEfficiencyVisualization";

const SmsReports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const generateYearOptions = () => {
    const options = [{ value: "", label: "All Years" }];
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    for (let year = startYear; year <= currentYear + 1; year++) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
  };

  const generateMonthOptions = () => {
    const options = [{ value: "", label: "All Months" }];
    const monthNames = [
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
    ];
    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthValue = monthNumber < 10 ? `0${monthNumber}` : `${monthNumber}`;
      options.push({ value: monthValue, label: monthNames[i] });
    }
    return options;
  };

  const yearOptions = generateYearOptions();
  const monthOptions = generateMonthOptions();

  const handleReportSelect = (report) => {
    if (selectedReport) return;
    setSelectedReport(report);
    setTimeout(() => {}, 1000);
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
  };

  const Filters = () => (
    <div className="mb-4 p-4 border rounded-lg flex space-x-4 items-center">
      <div>
        <label htmlFor="yearFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <select
          id="yearFilter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded"
        >
          {yearOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Month
        </label>
        <select
          id="monthFilter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 border rounded"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const Header = ({ title }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <button
          onClick={handleBackToReports}
          className="mr-4 p-2 text-[#FF9800] hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="mt-4 font-medium text-2xl">{title}</p>
      </div>
    </div>
  );

  // ✅ SMS Consumption Report
  if (selectedReport === "consumption") {
    return (
      <div className="p-4 lg:ml-64 h-screen">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              <Header title="SMS Consumption Report" />
              <Filters />

              <div className="flex flex-col">
                <div className="p-4 shadow-md rounded-lg">
                  <SmsConsumptionVisualization selectedYear={selectedYear} selectedMonth={selectedMonth} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SMS Balance Report
  if (selectedReport === "balance") {
    return (
      <div className="p-4 lg:ml-64 h-screen">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              <Header title="SMS Balance Report" />
              <Filters />

              <div className="flex flex-col">
                <div className="p-4 shadow-md rounded-lg">
                  <SmsBalanceVisualization selectedYear={selectedYear} selectedMonth={selectedMonth} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SMS Efficiency Report
  if (selectedReport === "efficiency") {
    return (
      <div className="p-4 lg:ml-64 h-screen">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
              <Header title="SMS Efficiency Report" />
              <Filters />

              <div className="flex flex-col">
                <div className="p-4 shadow-md rounded-lg">
                  <SmsEfficiencyVisualization selectedYear={selectedYear} selectedMonth={selectedMonth} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main SMS reports page (tiles)
  return (
    <div className="p-4 lg:ml-64 h-screen">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex flex-col items-center justify-center bg-white p-4">
              <Typography variant="h5" className="font-semi-bold mb-6">
                Please Select a Report
              </Typography>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl w-full">
                {/* SMS Consumption */}
                <Card
                  onClick={() => handleReportSelect("consumption")}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== "consumption"
                      ? "opacity-50 pointer-events-none"
                      : "hover:border-[#FF9800] hover:scale-105"
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: "center",
                    padding: 2,
                    background: "#4B465C0A",
                    border: "1px solid transparent",
                    boxShadow: "none",
                  }}
                >
                  <CardContent>
                    {selectedReport === "consumption" ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: "#FF9800" }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4C2.9 2 2 2.9 2 4v14c0 1.1.9 2 2 2h4l4 2 4-2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-4H6V8h12v2z" />
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Consumption Report
                        </Typography>
                        <Typography variant="body2" style={{ color: "#4B465C" }}>
                          Track SMS volume, recipients reached, and consumption trends
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* SMS Balance */}
                <Card
                  onClick={() => handleReportSelect("balance")}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== "balance"
                      ? "opacity-50 pointer-events-none"
                      : "hover:border-[#FF9800] hover:scale-105"
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: "center",
                    padding: 2,
                    background: "#4B465C0A",
                    border: "1px solid transparent",
                    boxShadow: "none",
                  }}
                >
                  <CardContent>
                    {selectedReport === "balance" ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: "#FF9800" }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 17.93c-2.83.48-5.49-.9-6.74-3.33l1.74-1c.9 1.73 2.86 2.79 5 2.43v1.9zM7.1 14.1a5.5 5.5 0 010-4.2l-1.74-1a7.5 7.5 0 000 6.2l1.74-1zm5.9-8.03c-2.14-.36-4.1.7-5 2.43l-1.74-1c1.25-2.44 3.9-3.81 6.74-3.33v1.9zm4.64 8.04l-1.74-1a5.5 5.5 0 000-4.2l1.74-1a7.5 7.5 0 010 6.2zM15 16h-2v-2h2v2zm0-4h-2V8h2v4z" />
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Balance Report
                        </Typography>
                        <Typography variant="body2" style={{ color: "#4B465C" }}>
                          Compare SMS dispatched vs remaining SMS balance
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* SMS Efficiency */}
                <Card
                  onClick={() => handleReportSelect("efficiency")}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== "efficiency"
                      ? "opacity-50 pointer-events-none"
                      : "hover:border-[#FF9800] hover:scale-105"
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: "center",
                    padding: 2,
                    background: "#4B465C0A",
                    border: "1px solid transparent",
                    boxShadow: "none",
                  }}
                >
                  <CardContent>
                    {selectedReport === "efficiency" ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: "#FF9800" }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8zm8.5-5.5l-1.5-1.5 1.5-1.5 1.5 1.5-1.5 1.5z" />
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Efficiency Report
                        </Typography>
                        <Typography variant="body2" style={{ color: "#4B465C" }}>
                          Compare successful vs failed SMS dispatches (delivery performance)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsReports;
