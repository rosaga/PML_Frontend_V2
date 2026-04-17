"use client";

import React, { useMemo, useState } from "react";

const bundleCatalogData = [
  {
    id: "BDL-001",
    bundle: "20 MB",
    unitsBalance: "15,000",
    validity: "2026-03-14",
    status: "Expiring Soon",
  },
  {
    id: "BDL-002",
    bundle: "50 MB",
    unitsBalance: "28,500",
    validity: "2026-03-18",
    status: "Expiring Soon",
  },
  {
    id: "BDL-003",
    bundle: "100 MB",
    unitsBalance: "42,000",
    validity: "2026-04-10",
    status: "Active",
  },
  {
    id: "BDL-004",
    bundle: "500 MB",
    unitsBalance: "18,500",
    validity: "2026-03-25",
    status: "Active",
  },
  {
    id: "BDL-005",
    bundle: "1 GB",
    unitsBalance: "52,000",
    validity: "2026-03-16",
    status: "Expiring Soon",
  },
  {
    id: "BDL-006",
    bundle: "10 GB",
    unitsBalance: "8,200",
    validity: "2026-04-20",
    status: "Active",
  },
];

const dispatchLogsData = [
  {
    id: "DSP-7894",
    organization: "TechCorp Solutions",
    recipient: "+254901234567",
    bundle: "2GB Weekly",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:25",
  },
  {
    id: "DSP-7893",
    organization: "RetailMax Ltd",
    recipient: "+254902345678",
    bundle: "5GB Monthly",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:20",
  },
  {
    id: "DSP-7892",
    organization: "HealthPlus Network",
    recipient: "+254903456789",
    bundle: "1GB Daily",
    status: "Failed",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:15",
  },
  {
    id: "DSP-7891",
    organization: "EduLearn Platform",
    recipient: "+254904567890",
    bundle: "10GB Monthly",
    status: "Success",
    provider: "Safaricom",
    timestamp: "2026-03-09 14:10",
  },
];

const usageData = [
  {
    organization: "TechCorp Solutions",
    dataValue: "2",
    unitsDispatched: "1,500",
    total: "3,000",
  },
  {
    organization: "TechCorp Solutions",
    dataValue: "5",
    unitsDispatched: "800",
    total: "4,000",
  },
  {
    organization: "HealthPlus Network",
    dataValue: "1",
    unitsDispatched: "2,200",
    total: "2,200",
  },
  {
    organization: "RetailMax Ltd",
    dataValue: "10",
    unitsDispatched: "300",
    total: "3,000",
  },
  {
    organization: "EduLearn Platform",
    dataValue: "2",
    unitsDispatched: "1,800",
    total: "3,600",
  },
  {
    organization: "FinServe Corp",
    dataValue: "5",
    unitsDispatched: "650",
    total: "3,250",
  },
  {
    organization: "RetailMax Ltd",
    dataValue: "1",
    unitsDispatched: "3,500",
    total: "3,500",
  },
];

const expiringBundles = [
  {
    bundle: "20 MB",
    id: "BDL-001",
    unitsAvailable: "15,000 units available",
    expiry: "2026-03-14",
  },
  {
    bundle: "50 MB",
    id: "BDL-002",
    unitsAvailable: "28,500 units available",
    expiry: "2026-03-18",
  },
  {
    bundle: "1 GB",
    id: "BDL-005",
    unitsAvailable: "52,000 units available",
    expiry: "2026-03-16",
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
    { id: "bundleCatalog", label: "Bundle Catalog" },
    { id: "dispatchLogs", label: "Dispatch Logs" },
    { id: "expiry", label: "Expiry" },
    { id: "analytics", label: "Analytics" },
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

function CardShell({ title, subtitle, rightAction, children, headerClassName = "" }) {
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
  if (value === "Expiring Soon") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-800">
        Expiring Soon
      </span>
    );
  }

  if (value === "Failed") {
    return (
      <span className="inline-flex rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white">
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#02051d] px-4 py-1.5 text-sm font-semibold text-white">
      {value}
    </span>
  );
}

export default function BulkDataManagementPage() {
  const [activeTab, setActiveTab] = useState("bundleCatalog");

  const metrics = useMemo(
    () => [
      {
        title: "Data Dispatched Today",
        value: "2,847 GB",
        subtitle: "↑ 8% from yesterday",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <ellipse
              cx="12"
              cy="5"
              rx="6"
              ry="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M6 5V12C6 13.6569 8.68629 15 12 15C15.3137 15 18 13.6569 18 12V5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M6 12V19C6 20.6569 8.68629 22 12 22C15.3137 22 18 20.6569 18 19V12"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        ),
      },
      {
        title: "Success Rate",
        value: "98.2%",
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
        title: "Scheduled Dispatches",
        value: "45",
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
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 16H12.01"
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
            Bulk Data Management
          </h1>
          <p className="mt-2 text-[16px] text-gray-600">
            Manage data bundles and provisioning
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "bundleCatalog" && (
          <CardShell
            title="Data Bundle Catalog"
            rightAction={
              <button
                type="button"
                className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
              >
                Add Bundle
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Bundle ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Bundle Name
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Units Balance
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Validity
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
                  {bundleCatalogData.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                        {item.id}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.bundle}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                        {item.unitsBalance}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.validity}
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-sm">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="border-b border-gray-100 px-6 py-5 text-right text-sm">
                        <button
                          type="button"
                          className="rounded-xl bg-[#02051d] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
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

        {activeTab === "dispatchLogs" && (
          <CardShell
            title="Data Dispatch Logs"
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
                      Dispatch ID
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Organization
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Recipient
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Bundle
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
                      <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                        {item.bundle}
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

        {activeTab === "expiry" && (
          <div className="space-y-6">
            <CardShell title="Bundle Expiry Tracking">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                        Bundle ID
                      </th>
                      <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                        Bundle
                      </th>
                      <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                        Units Available
                      </th>
                      <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                        Expiry Date
                      </th>
                      <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundleCatalogData.map((item) => (
                      <tr key={item.id}>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                          {item.id}
                        </td>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                          {item.bundle}
                        </td>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                          {item.unitsBalance}
                        </td>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                          {item.validity}
                        </td>
                        <td className="border-b border-gray-100 px-6 py-5 text-sm">
                          <StatusPill value={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardShell>

            <div className="overflow-hidden rounded-2xl border border-yellow-300 bg-[#f7f4df] shadow-sm">
              <div className="border-b border-yellow-300 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-600">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M12 8V12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 16H12.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-[18px] font-semibold text-gray-900">
                    Bundles Expiring in a Week
                  </h3>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {expiringBundles.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-400 bg-white px-4 py-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[16px] font-semibold text-gray-900">
                          {item.bundle}
                        </p>
                        <span className="inline-flex rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-gray-800">
                          {item.id}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        {item.unitsAvailable}
                        <span className="mx-2">•</span>
                        Expires on {item.expiry}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Extend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <CardShell title="Data Analytics">
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Analytics content goes here
              </div>
            </div>
          </CardShell>
        )}

        {activeTab === "usage" && (
          <CardShell
            title="Data Usage Data"
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
                    Total Usage (GB)
                  </p>
                  <p className="text-[20px] font-semibold leading-none text-gray-900">
                    22,550
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
                      Data Value (GB)
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Units Dispatched
                    </th>
                    <th className="border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600">
                      Total (GB)
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
                        {item.dataValue}
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