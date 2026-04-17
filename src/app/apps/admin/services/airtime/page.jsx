"use client";

import React, { useMemo, useState } from "react";

const dispatchLogsData = [
  {
    id: "AT-7894",
    organization: "TechCorp Solutions",
    recipient: "+254701234567",
    amount: "1,000",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:30",
  },
  {
    id: "AT-7893",
    organization: "RetailMax Ltd",
    recipient: "+254702345678",
    amount: "500",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:25",
  },
  {
    id: "AT-7892",
    organization: "HealthPlus Network",
    recipient: "+254703456789",
    amount: "2,000",
    status: "Failed",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:20",
  },
  {
    id: "AT-7891",
    organization: "EduLearn Platform",
    recipient: "+254704567890",
    amount: "1,500",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:15",
  },
];

const walletBalancesData = [
  {
    organization: "TechCorp Solutions",
    currentBalance: "250,000",
    threshold: "50,000",
    status: "Healthy",
  },
  {
    organization: "RetailMax Ltd",
    currentBalance: "500,000",
    threshold: "100,000",
    status: "Healthy",
  },
  {
    organization: "HealthPlus Network",
    currentBalance: "45,000",
    threshold: "50,000",
    status: "Low",
  },
  {
    organization: "EduLearn Platform",
    currentBalance: "180,000",
    threshold: "75,000",
    status: "Healthy",
  },
];

const scheduledCampaignsData = [
  {
    id: "ATC-001",
    organization: "TechCorp Solutions",
    name: "Employee Rewards",
    recipients: "150",
    totalAmount: "150,000",
    status: "Completed",
    date: "2026-03-09",
  },
  {
    id: "ATC-002",
    organization: "RetailMax Ltd",
    name: "Customer Incentives",
    recipients: "300",
    totalAmount: "150,000",
    status: "In Progress",
    date: "2026-03-09",
  },
  {
    id: "ATC-003",
    organization: "EduLearn Platform",
    name: "Student Support",
    recipients: "200",
    totalAmount: "200,000",
    status: "Scheduled",
    date: "2026-03-10",
  },
];

const usageData = [
  {
    organization: "TechCorp Solutions",
    airtimeValue: "1,000",
    unitsDispatched: "1,250",
    total: "1,250,000",
  },
  {
    organization: "TechCorp Solutions",
    airtimeValue: "5,000",
    unitsDispatched: "4,200",
    total: "21,000,000",
  },
  {
    organization: "HealthPlus Network",
    airtimeValue: "800",
    unitsDispatched: "400",
    total: "320,000",
  },
  {
    organization: "RetailMax Ltd",
    airtimeValue: "2,100",
    unitsDispatched: "1,000",
    total: "2,100,000",
  },
  {
    organization: "EduLearn Platform",
    airtimeValue: "1,500",
    unitsDispatched: "1,900",
    total: "2,850,000",
  },
  {
    organization: "FinServe Corp",
    airtimeValue: "950",
    unitsDispatched: "950",
    total: "902,500",
  },
  {
    organization: "RetailMax Ltd",
    airtimeValue: "3,200",
    unitsDispatched: "1,600",
    total: "5,120,000",
  },
];

function MetricCard({ title, value, subtitle, icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="mt-2 text-[28px] font-semibold leading-none text-gray-900">
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-4 text-sm font-semibold text-green-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dispatchLogs", label: "Dispatch Logs" },
    { id: "organizationBalances", label: "Organization Balances" },
    { id: "scheduledCampaigns", label: "Scheduled Campaigns" },
    { id: "usage", label: "Usage" },
  ];

  return (
    <div className="mb-8 inline-flex rounded-full bg-gray-200 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
  );
}

function CardShell({
  title,
  subtitle,
  rightAction,
  children,
  headerClassName = "",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className={`flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 ${headerClassName}`}
      >
        <div>
          <h2 className="text-[22px] font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ value }) {
  if (value === "Failed" || value === "Low") {
    return (
      <span className="inline-flex rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white">
        {value}
      </span>
    );
  }

  if (value === "In Progress" || value === "Scheduled") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-800">
        {value}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white">
      {value}
    </span>
  );
}

export default function BulkAirtimeManagementPage() {
  const [activeTab, setActiveTab] = useState("dispatchLogs");

  const metrics = useMemo(
    () => [
      {
        title: "Airtime Distributed Today",
        value: "4.2M",
        subtitle: "↑ 10% from yesterday",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92V19.92C22.0001 20.1985 21.9419 20.474 21.8293 20.7288C21.7167 20.9836 21.5521 21.2122 21.346 21.4C21.1398 21.5878 20.8969 21.7306 20.6327 21.8192C20.3685 21.9078 20.0886 21.9403 19.811 21.914C16.731 21.579 13.7727 20.5261 11.171 18.84C8.75083 17.3017 6.69829 15.2492 5.16 12.829C3.46782 10.2151 2.41469 7.24117 2.086 4.14603C2.06099 3.86929 2.09417 3.59032 2.18341 3.32718C2.27266 3.06404 2.41598 2.82287 2.60407 2.6175C2.79216 2.41213 3.02098 2.24717 3.27601 2.13352C3.53104 2.01987 3.80708 1.96002 4.086 1.95803H7.086C7.57302 1.95324 8.04517 2.11679 8.424 2.42003C8.80283 2.72327 9.06421 3.14755 9.164 3.62403C9.35091 4.51285 9.63891 5.37747 10.024 6.20003C10.1592 6.48581 10.2128 6.80338 10.1785 7.11817C10.1441 7.43296 10.0232 7.73205 9.829 7.98203L8.559 9.25203C9.98127 11.7534 12.0537 13.8258 14.555 15.248L15.825 13.978C16.075 13.7838 16.3741 13.6629 16.6889 13.6285C17.0037 13.5942 17.3212 13.6478 17.607 13.783C18.4296 14.1681 19.2942 14.4561 20.183 14.643C20.6647 14.7438 21.0938 15.0107 21.3978 15.3966C21.7019 15.7825 21.8614 16.2637 21.849 16.758L22 16.92Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Delivery Success Rate",
        value: "98.5%",
        subtitle: "↑ 2% from last week",
        iconBg: "#dcfce7",
        iconColor: "#16a34a",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.085V12C21.9988 14.1457 21.304 16.2331 20.0198 17.9503C18.7357 19.6675 16.9319 20.9267 14.8765 21.5396C12.8211 22.1525 10.6232 22.0862 8.60857 21.3505C6.59395 20.6148 4.86903 19.2489 3.69078 17.4571C2.51252 15.6652 1.94482 13.5403 2.07276 11.3981C2.20069 9.25587 3.01776 7.21385 4.40135 5.57455C5.78494 3.93526 7.66177 2.78583 9.74868 2.29708C11.8356 1.80833 14.022 2.00691 15.987 2.863"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 4L12 14.01L9 11.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Scheduled Dispatches",
        value: "12",
        subtitle: "",
        iconBg: "#f3e8ff",
        iconColor: "#9333ea",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M16 3V7M8 3V7M3 11H21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        title: "Low Balance Alerts",
        value: "3",
        subtitle: "",
        iconBg: "#fee2e2",
        iconColor: "#ef4444",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 9V13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 17H12.01"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
    []
  );

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-[34px] font-semibold leading-tight text-gray-900">
            Bulk Airtime Management
          </h1>
          <p className="mt-2 text-[16px] text-gray-600">
            Manage airtime distribution and wallet balances
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "dispatchLogs" && (
          <CardShell
            title="Airtime Dispatch Logs"
            rightAction={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Filter
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 10L12 15L17 10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15V3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Export
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Transaction ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Recipient
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Provider
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchLogsData.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                        {item.id}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.recipient}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.amount}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.provider}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}

        {activeTab === "organizationBalances" && (
          <CardShell title="Airtime Wallet Balances">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Current Balance
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Threshold
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-right text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {walletBalancesData.map((item) => (
                    <tr key={item.organization}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.currentBalance}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.threshold}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                        <button
                          type="button"
                          className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          Top Up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}

        {activeTab === "scheduledCampaigns" && (
          <CardShell title="Scheduled Airtime Campaigns">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Campaign ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Recipients
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Total Amount
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCampaignsData.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                        {item.id}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.recipients}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.totalAmount}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}

        {activeTab === "usage" && (
          <CardShell
            title="Airtime Usage Data"
            headerClassName="items-center"
            rightAction={
              <div className="flex flex-wrap items-center gap-4">
                <select className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 outline-none focus:border-gray-400">
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">
                    Total Usage
                  </p>
                  <p className="text-[20px] font-semibold leading-none text-gray-900">
                    33,542,500
                  </p>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Airtime Value
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Units Dispatched
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usageData.map((item, index) => (
                    <tr key={`${item.organization}-${index}`}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.airtimeValue}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.unitsDispatched}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}
      </div>
    </div>
  );
}