"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GetAdminOrganizations } from "@/app/api/actions/admin/admin";

const OrganizationsPage = () => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setLoading(true);

        const query = searchTerm
          ? `search=${encodeURIComponent(searchTerm)}`
          : "";

        const response = await GetAdminOrganizations(query);
        setOrganizations(response?.data || []);
      } catch (error) {
        console.error("Error loading organizations:", error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    }

    if (isClient) {
      fetchOrganizations();
    }
  }, [searchTerm, isClient]);

  const handleOrganizationClick = (org) => {
    router.push(`/apps/admin/organizations/${org.external_id}`);
  };

  const getStatusClasses = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
        return "bg-[#02051d] text-white";
      case "SUSPENDED":
        return "bg-rose-600 text-white";
      case "INACTIVE":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-CA");
  };

  const totalPages = Math.ceil(organizations.length / itemsPerPage);

  const paginatedOrganizations = organizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isClient) return null;

  return (
    <div className="ml-0 min-h-screen bg-gray-50 p-5 md:ml-64">
      <div className="w-full">
        <div className="mb-5">
          <h1 className="text-[30px] font-semibold leading-tight text-gray-900">
            Organizations
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all registered organizations
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M20 20L17 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Filters
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                    Organization Name
                  </th>
                  <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                    Recharge Count
                  </th>
                  <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                    Last Recharge
                  </th>
                  <th className="border-b border-gray-200 px-4 py-4 text-left text-[13px] font-semibold text-gray-600">
                    Date Created
                  </th>
                  <th className="border-b border-gray-200 px-4 py-4 text-center text-[13px] font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-[#02051d]" />
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  paginatedOrganizations.map((org) => (
                    <tr
                      key={org.external_id}
                      onClick={() => handleOrganizationClick(org)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="border-b border-gray-100 px-4 py-4">
                        <div className="text-[14px] font-semibold text-blue-600">
                          {org.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-gray-400">
                          {org.external_id}
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getStatusClasses(
                            org.status
                          )}`}
                        >
                          {org.status || "UNKNOWN"}
                        </span>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-900">
                        {org.recharge_count || 0}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                        {org.last_recharge_at
                          ? formatDate(org.last_recharge_at)
                          : "-"}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-[13px] text-gray-600">
                        {org.created_at ? formatDate(org.created_at) : "-"}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 5V5.01M12 12V12.01M12 19V19.01"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && organizations.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, organizations.length)} of{" "}
              {organizations.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                        currentPage === page
                          ? "bg-[#02051d] text-white"
                          : "border border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationsPage;