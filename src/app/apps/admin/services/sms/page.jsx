"use client";

import React, { useMemo, useState } from "react";

const campaignsData = [
  {
    id: "CMP-001",
    name: "Product Launch Promo",
    organization: "Sunking",
    totalSent: "15,000",
    delivered: "14,750",
    failed: "250",
    date: "2026-03-09",
    deliveryTime: "2.3 min",
  },
  {
    id: "CMP-002",
    name: "Weekly Newsletter",
    organization: "Epren",
    totalSent: "25,000",
    delivered: "24,500",
    failed: "500",
    date: "2026-03-09",
    deliveryTime: "3.8 min",
  },
  {
    id: "CMP-003",
    name: "Appointment Reminders",
    organization: "Cheers Bakery",
    totalSent: "8,000",
    delivered: "7,920",
    failed: "80",
    date: "2026-03-08",
    deliveryTime: "1.5 min",
  },
  {
    id: "CMP-004",
    name: "Payment Alerts",
    organization: "FinServe Pro",
    totalSent: "12,000",
    delivered: "11,880",
    failed: "120",
    date: "2026-03-08",
    deliveryTime: "2.1 min",
  },
];

const senderApprovals = [
  {
    senderId: "HealthPlus",
    organization: "HealthPlus Clinic",
    status: "Pending",
    requestDate: "2026-03-12",
    approvedDate: "-",
  },
  {
    senderId: "FinServe",
    organization: "FinServe Pro",
    status: "Pending",
    requestDate: "2026-03-11",
    approvedDate: "-",
  },
  {
    senderId: "MegaMart",
    organization: "MegaMart Ltd",
    status: "Pending",
    requestDate: "2026-03-10",
    approvedDate: "-",
  },
  {
    senderId: "Stepwing",
    organization: "Stepwing Resort",
    status: "Pending",
    requestDate: "2026-03-08",
    approvedDate: "-",
  },
  {
    senderId: "TechHub",
    organization: "TechHub Solutions",
    status: "Approved",
    requestDate: "2026-02-25",
    approvedDate: "2026-02-26",
  },
  {
    senderId: "Epren",
    organization: "Epren Ltd",
    status: "Approved",
    requestDate: "2026-02-10",
    approvedDate: "2026-02-11",
  },
  {
    senderId: "SunKing",
    organization: "SunKing",
    status: "Approved",
    requestDate: "2026-01-15",
    approvedDate: "2026-01-16",
  },
  {
    senderId: "CheersBakery",
    organization: "Cheers Bakery",
    status: "Approved",
    requestDate: "2025-11-22",
    approvedDate: "2025-11-23",
  },
];

const MetricCard = ({ title, value, subtitle, iconBg, iconColor, icon }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="mt-2 text-[28px] font-bold leading-none text-gray-900">
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-4 text-sm font-medium text-green-600">{subtitle}</p>
          ) : null}
        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "campaigns", label: "Campaigns" },
    { id: "messageSearch", label: "Message Search" },
    { id: "senderIdApprovals", label: "Sender ID Approvals" },
    { id: "analytics", label: "Analytics" },
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
  );
};

const CardShell = ({ title, subtitle, rightAction, children }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  );
};

export default function BulkSMSManagementPage() {
  const [activeTab, setActiveTab] = useState("campaigns");

  const metrics = useMemo(
    () => [
      {
        title: "Messages Sent Today",
        value: "73,245",
        subtitle: "↑ 15% from yesterday",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 10H16M8 14H12M7 19L3 21V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H8.2C7.77996 20 7.56994 20 7.40901 19.9183C7.26744 19.8464 7.15359 19.7326 7.08165 19.591C7 19.4301 7 19.2201 7 18.8V19Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Delivery Success Rate",
        value: "97.8%",
        subtitle: "",
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
        title: "Failed Messages",
        value: "2,200",
        subtitle: "",
        iconBg: "#fee2e2",
        iconColor: "#ef4444",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M15 9L9 15M9 9L15 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        title: "Pending Delivery from dispatch/scheduled",
        value: "1,045",
        subtitle: "",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 7V12L15 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
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
          <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
            Bulk SMS Management
          </h1>
          <p className="mt-2 text-[16px] text-gray-600">
            Monitor SMS campaigns, delivery logs, and analytics
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "campaigns" && (
          <CardShell
            title="SMS Campaigns"
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
                      Campaign ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Total Sent
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Delivered
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Failed
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Delivery Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsData.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                        {item.id}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.totalSent}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-medium text-green-600">
                        {item.delivered}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-medium text-red-500">
                        {item.failed}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.date}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.deliveryTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}

        {activeTab === "messageSearch" && (
          <CardShell title="Search Messages">
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-600">
                    Message ID
                  </label>
                  <input
                    type="text"
                    placeholder="MSG-12345"
                    className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-600">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+254901234567"
                    className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-600">
                    Campaign ID
                  </label>
                  <input
                    type="text"
                    placeholder="CMP-001"
                    className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="rounded-xl bg-[#02051d] px-6 py-4 text-[15px] font-semibold text-white hover:opacity-95"
                >
                  Search Messages
                </button>
              </div>
            </div>
          </CardShell>
        )}

        {activeTab === "senderIdApprovals" && (
          <CardShell
            title="Sender ID Approvals"
            subtitle="Showing all pending requests and last 5 approved requests"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Sender ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Request Date
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Approved Date
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-right text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {senderApprovals.map((item) => (
                    <tr key={`${item.senderId}-${item.requestDate}`}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                        {item.senderId}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.organization}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm">
                        {item.status === "Pending" ? (
                          <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-900">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white">
                            Approved
                          </span>
                        )}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.requestDate}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.approvedDate}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                        {item.status === "Pending" ? (
                          <button
                            type="button"
                            className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                          >
                            Approve
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>
        )}

        {activeTab === "analytics" && (
          <CardShell title="Analytics">
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Analytics content goes here
              </div>
            </div>
          </CardShell>
        )}
      </div>
    </div>
  );
}