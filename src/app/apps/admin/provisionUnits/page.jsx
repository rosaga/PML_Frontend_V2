"use client";

import React from "react";

const recentProvisions = [
  {
    id: "PRV-001",
    organization: "SunKing",
    service: "SMS",
    amount: "10,000 units",
    admin: "Admin User",
    datetime: "2026-03-09 14:30",
  },
  {
    id: "PRV-002",
    organization: "Epren Ltd",
    service: "Airtime",
    amount: "100,000",
    admin: "Admin User",
    datetime: "2026-03-09 13:45",
  },
  {
    id: "PRV-003",
    organization: "Savannah",
    service: "Data",
    amount: "200 GB",
    admin: "Admin User",
    datetime: "2026-03-09 12:20",
  },
  {
    id: "PRV-004",
    organization: "ArtCaffe",
    service: "WhatsApp",
    amount: "5,000 units",
    admin: "Admin User",
    datetime: "2026-03-09 11:15",
  },
];

export default function ProvisionUnitsPage() {
  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-6 md:ml-64">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Provision Units</h1>
          <p className="mt-1 text-sm text-gray-500">
            Provision balance units to organizations
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="mb-8 text-2xl font-semibold text-gray-900">
              New Provision
            </h2>

            <form className="max-w-4xl">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Organization <span className="text-gray-900">*</span>
                  </label>
                  <select className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-gray-400">
                    <option>Select organization...</option>
                    <option>SunKing</option>
                    <option>Epren Ltd</option>
                    <option>Savannah</option>
                    <option>ArtCaffe</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Service <span className="text-gray-900">*</span>
                  </label>
                  <select className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-gray-400">
                    <option>Select service...</option>
                    <option>SMS</option>
                    <option>Airtime</option>
                    <option>Data</option>
                    <option>WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount <span className="text-gray-900">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter amount to provision"
                  className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-gray-400"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Add notes about this provision"
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-gray-400"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-[#021b3a] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                >
                  Provision Units
                </button>

                <button
                  type="reset"
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Provisions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Provision ID
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Organization
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Service
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Admin
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Date & Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentProvisions.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-blue-600">
                      {item.id}
                    </td>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                      {item.organization}
                    </td>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                      <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-800">
                        {item.service}
                      </span>
                    </td>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                      {item.amount}
                    </td>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                      {item.admin}
                    </td>
                    <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                      {item.datetime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}