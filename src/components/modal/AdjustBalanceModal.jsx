"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AdjustAdminOrganizationBalance,
  AutoProvisionAdminBalance,
} from "@/app/api/actions/admin/admin";

const DEFAULT_FORM = {
  mode: "provision",
  service: "DATA",
  module: "",
  units: "",
  reason: "",
};

const AdjustBalanceModal = ({ open, onClose, orgId, accounts = [], onSuccess }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setSubmitting(false);
      setSuccessMessage("");
      setErrorMessage("");
    }
  }, [open]);

  useEffect(() => {
    const onClick = (e) => {
      if (e.target.id === "adjust-balance-modal" && !submitting) {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("click", onClick);
    }

    return () => window.removeEventListener("click", onClick);
  }, [open, onClose, submitting]);

  const serviceOptions = useMemo(() => {
    const existing = new Set(
      (accounts || [])
        .map((acc) => (acc?.service || "").toUpperCase())
        .filter(Boolean)
    );

    if (existing.size === 0) return ["DATA", "AIRTIME", "SMS"];
    return Array.from(existing);
  }, [accounts]);

  const filteredModules = useMemo(() => {
    return (accounts || []).filter(
      (acc) => (acc?.service || "").toUpperCase() === form.service
    );
  }, [accounts, form.service]);

  const isData = form.service === "DATA";
  const isReduce = form.mode === "reduce";

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const unitsNumber = Number(form.units);

    if (!form.service) {
      setErrorMessage("Please select a service.");
      return;
    }

    if (!unitsNumber || unitsNumber <= 0) {
      setErrorMessage("Units must be greater than zero.");
      return;
    }

    if (form.mode === "provision" && !form.module.trim()) {
      setErrorMessage("Please enter a package or module.");
      return;
    }

    if (isReduce && isData && !form.module.trim()) {
      setErrorMessage("Please select a data module.");
      return;
    }

    if (isReduce && !form.reason.trim()) {
      setErrorMessage("Reason is required when reducing balance.");
      return;
    }

    try {
      setSubmitting(true);

      if (form.mode === "provision") {
        await AutoProvisionAdminBalance({
          package: form.module.trim(),
          units: Math.floor(unitsNumber),
          service: form.service,
          org_id: orgId,
        });

        setSuccessMessage("Balance provisioned successfully.");
      } else {
        await AdjustAdminOrganizationBalance(orgId, {
          module: isData ? form.module.trim() : form.module.trim() || "",
          service: form.service,
          units: unitsNumber,
          reason: form.reason.trim(),
        });

        setSuccessMessage("Balance reduced successfully.");
      }

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Request failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const TabButton = ({ id, label }) => (
    <button
      type="button"
      onClick={() =>
        setForm((prev) => ({
          ...prev,
          mode: id,
          reason: id === "reduce" ? prev.reason : "",
        }))
      }
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        form.mode === id
          ? "text-orange-600 border-orange-600 bg-orange-50"
          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
      }`}
      disabled={submitting}
    >
      {label}
    </button>
  );

  return (
    <div
      id="adjust-balance-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative w-full max-w-2xl p-4 max-h-full">
        <div className="bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto">
          {successMessage ? (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-4 text-2xl font-semibold text-green-600">
                Success!
              </h2>
              <p className="mb-6 text-gray-900">{successMessage}</p>
              <button
                onClick={onClose}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-colors"
              >
                Close
              </button>
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mb-4 text-2xl font-semibold text-red-600">
                Oops!
              </h2>
              <p className="mb-6 text-gray-900">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage("")}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Adjust Balance
                </h3>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-4 pt-4">
                <div className="flex space-x-1 border-b border-gray-200">
                  <TabButton id="provision" label="Provision / Add" />
                  <TabButton id="reduce" label="Reduce" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Service
                    </label>
                    <select
                      value={form.service}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          service: e.target.value,
                          module: "",
                        }))
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                      disabled={submitting}
                    >
                      {serviceOptions.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.mode === "reduce" ? (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900">
                        {isData ? "Module" : "Module (optional)"}
                      </label>
                      <select
                        value={form.module}
                        onChange={handleChange("module")}
                        disabled={submitting || !isData}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5 disabled:bg-gray-100"
                      >
                        <option value="">
                          {isData ? "Select module..." : "Not required"}
                        </option>
                        {filteredModules.map((acc) => (
                          <option key={acc.id} value={acc.module || ""}>
                            {acc.module || "Unnamed module"} (
                            {Number(acc.units || 0).toLocaleString()} units)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      {filteredModules.length > 0 ? (
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900">
                            Use Existing Module
                          </label>
                          <select
                            value={
                              filteredModules.some(
                                (acc) => acc.module === form.module
                              )
                                ? form.module
                                : ""
                            }
                            onChange={handleChange("module")}
                            disabled={submitting}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                          >
                            <option value="">Custom / New Module</option>
                            {filteredModules.map((acc) => (
                              <option key={acc.id} value={acc.module || ""}>
                                {acc.module || "Unnamed module"}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">
                          Package / Module
                        </label>
                        <input
                          type="text"
                          value={form.module}
                          onChange={handleChange("module")}
                          placeholder={
                            form.service === "DATA"
                              ? "e.g. 5GB"
                              : form.service === "AIRTIME"
                              ? "e.g. AIRTIME"
                              : "e.g. SMS"
                          }
                          disabled={submitting}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Units
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.units}
                      onChange={handleChange("units")}
                      disabled={submitting}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                      placeholder="Enter units"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Reason {isReduce ? "*" : ""}
                    </label>
                    <textarea
                      value={form.reason}
                      onChange={handleChange("reason")}
                      disabled={submitting || !isReduce}
                      rows={3}
                      placeholder={
                        isReduce
                          ? "Required when reducing balance"
                          : "Optional for provisioning"
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5 disabled:bg-gray-100"
                    />
                  </div>

                  {filteredModules.length > 0 ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Current {form.service} modules
                      </h4>
                      <div className="space-y-1">
                        {filteredModules.map((acc) => (
                          <p key={acc.id} className="text-sm text-gray-600">
                            {acc.module || "Unnamed module"} —{" "}
                            {Number(acc.units || 0).toLocaleString()} units
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="w-full px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-4 transition-colors ${
                        submitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300"
                      }`}
                    >
                      {submitting
                        ? "Saving..."
                        : form.mode === "provision"
                        ? "Provision Balance"
                        : "Reduce Balance"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustBalanceModal;