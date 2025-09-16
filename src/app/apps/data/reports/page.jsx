"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import TrendsVisualization from '@/components/dashboard/TrendsVisualization';

const Reports = () => {
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
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
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

    setTimeout(() => {
    }, 1000);
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
  };

  // If a report is selected, show the report content
  if (selectedReport === 'consumer') {
    return (
      <div className="p-4 sm:ml-64 h-screen">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
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
                  <p className="mt-4 font-medium text-2xl">Consumer Report</p>
                </div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For other reports (utilization, efficiency, financial) - show coming soon page
  if (selectedReport) {
    const reportTitles = {
      'utilization': 'Utilization Rate Report',
      'efficiency': 'Efficiency Report', 
      'financial': 'Financial Report'
    };

    return (
      <div className="p-4 sm:ml-64 h-screen">
        <div className="flex flex-col h-full">
          <div className="flex flex-col">
            <div className="p-4">
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
                  <p className="mt-4 font-medium text-lg">{reportTitles[selectedReport]}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-screen text-center p-6">
                <h1 className="text-4xl font-bold mb-4">🛠️ Oops! 🚧</h1>
                <p className="text-xl mb-4">
                  We are busy brewing up something awesome here!
                </p>
                <img
                  src="https://via.placeholder.com/400x300?text=Under+Construction"
                  alt="Under Construction!"
                  className="mb-4"
                />
                <p className="text-lg text-gray-700 mb-2">
                  Our developers are working like elves on double espresso. Please
                  check back soon!
                </p>
                <p className="text-lg text-gray-700">
                  In the meantime, feel free to enjoy this placeholder text and
                  imagine the possibilities!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main reports page with tiles
  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            

            <div className="flex flex-col items-center justify-center bg-white p-4">
              <Typography variant="h5" className="font-semi-bold mb-6">
                Please Select a Report
              </Typography>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl w-full">

                {/* Consumer Report */}
                <Card
                  onClick={() => handleReportSelect('consumer')}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== 'consumer'
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:border-[#FF9800] hover:scale-105'
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: 'center',
                    padding: 2,
                    background: '#4B465C0A',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    {selectedReport === 'consumer' ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: '#FF9800' }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Consumer Report
                        </Typography>
                        <Typography variant="body2" style={{ color: '#4B465C' }}>
                          Track recipients reached and data consumption trends
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Utilization Rate */}
                <Card
                  onClick={() => handleReportSelect('utilization')}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== 'utilization'
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:border-[#FF9800] hover:scale-105'
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: 'center',
                    padding: 2,
                    background: '#4B465C0A',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    {selectedReport === 'utilization' ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: '#FF9800' }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11,2V22C5.9,21.5 2,17.2 2,12S5.9,2.5 11,2M13,2V11H22C22,6.8 18.2,3 13,2M13,13V22C17.7,21.5 21.5,17.7 22,13H13Z"/>
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Utilization Rate
                        </Typography>
                        <Typography variant="body2" style={{ color: '#4B465C' }}>
                          Compare data dispatched vs data balance with pie charts
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Efficiency Report */}
                <Card
                  onClick={() => handleReportSelect('efficiency')}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== 'efficiency'
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:border-[#FF9800] hover:scale-105'
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: 'center',
                    padding: 2,
                    background: '#4B465C0A',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    {selectedReport === 'efficiency' ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: '#FF9800' }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Efficiency Report
                        </Typography>
                        <Typography variant="body2" style={{ color: '#4B465C' }}>
                          Compare successful dispatches vs failed dispatches
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Report */}
                <Card
                  onClick={() => handleReportSelect('financial')}
                  className={`cursor-pointer transition duration-300 transform ${
                    selectedReport && selectedReport !== 'financial'
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:border-[#FF9800] hover:scale-105'
                  }`}
                  sx={{
                    borderRadius: 1,
                    textAlign: 'center',
                    padding: 2,
                    background: '#4B465C0A',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    {selectedReport === 'financial' ? (
                      <Box className="flex justify-center items-center h-32">
                        <CircularProgress size={40} sx={{ color: '#FF9800' }} />
                      </Box>
                    ) : (
                      <Box className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-[#FF9800]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                        </svg>
                        <Typography variant="h6" className="font-semi-bold mt-2">
                          Financial Report
                        </Typography>
                        <Typography variant="body2" style={{ color: '#4B465C' }}>
                          Average cost per user and monthly rate comparisons
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

export default Reports;