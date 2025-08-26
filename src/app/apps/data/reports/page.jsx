"use client";
import React, { useState, useEffect } from "react";
import TrendsVisualization from '@/components/dashboard/TrendsVisualization';

const Reports = () => {
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

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <p className="mt-4 font-medium text-2xl">Reports</p>
            </div>

            {/* Filter section */}
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

            {/* Trends Visualization */}
            <div className="flex flex-col">
              <div className="p-4 shadow-md rounded-lg">
                <TrendsVisualization 
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                />
              </div>
            </div>

            {/* Additional reports sections can be added here */}
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Additional Reports</h3>
              <p className="text-gray-600">
                More reporting features will be added here in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;