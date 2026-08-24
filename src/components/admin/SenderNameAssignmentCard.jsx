"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GetAllAdminOrganizationSenderNames,
  GetOrganizationSenderNames,
  RemoveAdminOrganizationSenderName,
} from "@/app/api/actions/adminSenderNames/adminSenderNames";
import { getToken } from "@/utils/auth";
import { hasRole } from "@/utils/decodeToken";

function getOptions(items, idKeys, labelKeys) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();

  return items.reduce((options, item) => {
    const id = idKeys.map((key) => item?.[key]).find(Boolean);
    const label = labelKeys.map((key) => item?.[key]).find(Boolean);

    if (!id || !label || seen.has(String(id))) return options;

    seen.add(String(id));
    options.push({ id: String(id), label: String(label) });

    return options;
  }, []);
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  return responseData?.error || responseData?.message || fallback;
}

function normalizeAssignment(item, fallbackAppId = "") {
  return {
    ...item,
    appid: item?.appid || fallbackAppId,
    service_id: item?.service_id,
    sendername: item?.sendername || "—",
    telco: item?.telco || "—",
    service_state: item?.service_state || "—",
  };
}

const SenderNameAssignmentCard = ({
  organizationId,
  organizationName,
  organizations = [],
}) => {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    organizationId ? String(organizationId) : ""
  );
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignmentToRemove, setAssignmentToRemove] = useState(null);
  const [removingKey, setRemovingKey] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setIsSuperAdmin(hasRole(getToken(), "SuperAdmin"));
  }, []);

  useEffect(() => {
    if (organizationId) {
      setSelectedOrganizationId(String(organizationId));
    }
  }, [organizationId]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const rows = organizationId
        ? await GetOrganizationSenderNames(organizationId, 1, 100)
        : await GetAllAdminOrganizationSenderNames();
      const fallbackAppId = organizationId ? String(organizationId) : "";

      setAssignments(
        rows.map((item) => normalizeAssignment(item, fallbackAppId))
      );
    } catch (err) {
      console.error("Failed to load sender-name assignments:", err);
      setAssignments([]);
      setError(
        getErrorMessage(err, "Failed to load sender-name assignments.")
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const organizationOptions = useMemo(() => {
    const assignmentOrganizations = assignments.map((item) => ({
      external_id: item.appid,
      name: item.appid,
    }));

    return getOptions(
      [...organizations, ...assignmentOrganizations],
      ["external_id", "id", "organization_id", "org_id"],
      ["name", "organization_name", "business_name", "company_name"]
    );
  }, [organizations, assignments]);

  const assignmentsByOrganization = useMemo(() => {
    return assignments.reduce((grouped, item) => {
      const appId = String(item.appid || "");

      if (!appId) return grouped;

      if (!grouped[appId]) {
        grouped[appId] = [];
      }

      grouped[appId].push(item);
      return grouped;
    }, {});
  }, [assignments]);

  const visibleAssignments = organizationId
    ? assignments
    : assignmentsByOrganization[selectedOrganizationId] || [];

  const selectedOrganizationName = organizationId
    ? organizationName || String(organizationId)
    : organizationOptions.find(
        (organization) => organization.id === selectedOrganizationId
      )?.label || selectedOrganizationId;

  async function handleRemoveAssignment() {
    if (!assignmentToRemove) return;

    const appId = String(
      assignmentToRemove.appid || organizationId || selectedOrganizationId
    );
    const serviceId = assignmentToRemove.service_id;

    if (!appId || serviceId === undefined || serviceId === null) {
      setError("The organization or service ID is missing.");
      return;
    }

    const assignmentKey = `${appId}:${serviceId}`;

    try {
      setRemovingKey(assignmentKey);
      setError("");
      setSuccess("");

      const response = await RemoveAdminOrganizationSenderName(
        appId,
        serviceId
      );

      setAssignments((currentAssignments) =>
        currentAssignments.filter(
          (item) =>
            !(
              String(item.appid) === appId &&
              String(item.service_id) === String(serviceId)
            )
        )
      );
      setAssignmentToRemove(null);
      setSuccess(
        response?.message || "Sender name removed from the organization."
      );
    } catch (err) {
      console.error("Failed to remove sender-name assignment:", err);
      setAssignmentToRemove(null);
      if (err?.response?.status === 403) {
        setIsSuperAdmin(false);
      }
      setError(
        getErrorMessage(err, "Failed to remove the sender-name assignment.")
      );
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-gray-900">
            Sender Name Assignments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and remove sender names assigned to an organization.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAssignments}
          disabled={loading || removingKey !== null}
          className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">
            Organization
          </span>
          {organizationId ? (
            <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-900">
              {organizationName || organizationId}
            </div>
          ) : (
            <select
              value={selectedOrganizationId}
              onChange={(event) => {
                setSelectedOrganizationId(event.target.value);
                setError("");
                setSuccess("");
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-400"
            >
              <option value="">Select organization</option>
              {organizationOptions.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.label}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                Sender Name
              </th>
              <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                Telco
              </th>
              <th className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-600">
                Service State
              </th>
              <th className="border-b border-gray-200 px-4 py-4 text-right text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Loading sender names...
                </td>
              </tr>
            ) : !organizationId && !selectedOrganizationId ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Select an organization to view its sender names.
                </td>
              </tr>
            ) : visibleAssignments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No active sender names are assigned to this organization.
                </td>
              </tr>
            ) : (
              visibleAssignments.map((item) => {
                const rowKey = `${item.appid}:${item.service_id}`;
                const canRemove =
                  isSuperAdmin &&
                  item.service_id !== undefined && item.service_id !== null;

                return (
                  <tr key={rowKey}>
                    <td className="border-b border-gray-100 px-4 py-4 text-sm font-semibold text-gray-900">
                      {item.sendername}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-600">
                      {item.telco}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-4 text-sm text-gray-600">
                      {item.service_state}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-4 text-right">
                      {canRemove ? (
                        <button
                          type="button"
                          disabled={removingKey !== null}
                          onClick={() => setAssignmentToRemove(item)}
                          className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {assignmentToRemove ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-sender-name-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <h3
                  id="remove-sender-name-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Remove Sender Name
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This removes the assignment from the organization.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close confirmation"
                disabled={removingKey !== null}
                onClick={() => setAssignmentToRemove(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-900">
                  {assignmentToRemove.sendername}
                </span>{" "}
                from {selectedOrganizationName || assignmentToRemove.appid}?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={removingKey !== null}
                  onClick={() => setAssignmentToRemove(null)}
                  className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={removingKey !== null}
                  onClick={handleRemoveAssignment}
                  className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingKey !== null ? "Removing..." : "Remove Sender Name"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default SenderNameAssignmentCard;
