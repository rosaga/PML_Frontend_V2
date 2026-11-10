"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Plus, Wallet } from "lucide-react";
import {
  CreateAdminSMSPurchase,
  GetAdminSMSBalance,
} from "@/app/api/actions/admin/admin";

const BALANCE_TYPES = [
  { value: "PROMOTIONAL", label: "Promotional", icon: MessageSquare, color: "bg-blue-100 text-blue-600" },
  { value: "TRANSACTIONAL", label: "Transactional", icon: Wallet, color: "bg-green-100 text-green-600" },
];

const EMPTY_FORM = { messageType: "PROMOTIONAL", units: "", expiresOn: "" };
const PAGE_SIZE = 10;
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

function toNairobiExpiry(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;

  const dateTime = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${dateTime}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 19) !== dateTime) return null;

  // The picker represents Nairobi wall time, regardless of the browser's timezone.
  return `${dateTime}+03:00`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatUnits(value) {
  return value == null ? "—" : Number(value).toLocaleString();
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const message = typeof data === "string" ? data : data?.error || data?.message;
  return typeof message === "string" ? message : fallback;
}

export default function GlobalSMSBalances({ isActive = true, refreshKey = 0 }) {
  const [monitoring, setMonitoring] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const typeInput = useRef(null);
  const unitsInput = useRef(null);
  const expiryInput = useRef(null);
  const addButton = useRef(null);

  const minimumExpiry = new Date(Date.now() + NAIROBI_OFFSET_MS).toISOString().slice(0, 16);
  const purchases = monitoring?.page === page ? monitoring.purchases : [];
  const pagination = monitoring?.pagination;
  const total = pagination?.total ?? pagination?.total_count ?? pagination?.count;
  const totalPages = pagination?.total_pages ?? (total != null ? Math.ceil(total / PAGE_SIZE) : null);
  const hasNextPage = totalPages != null ? page < totalPages : purchases.length === PAGE_SIZE;

  useEffect(() => {
    if (!isActive) return;

    const controller = new AbortController();
    async function loadBalances() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await GetAdminSMSBalance(page, PAGE_SIZE, controller.signal);
        if (controller.signal.aborted) return;

        const data = response?.data ?? response;
        const history = data?.purchases;
        const rows = Array.isArray(history) ? history : history?.items ?? history?.data ?? [];
        setMonitoring({
          page,
          summary: data?.summary || {},
          purchases: Array.isArray(rows) ? rows : [],
          pagination: data?.pagination ?? (Array.isArray(history) ? data : history),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(getErrorMessage(error, "Failed to load global SMS balances. Please try again."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadBalances();
    return () => controller.abort();
  }, [isActive, page, refreshKey, reloadKey]);

  useEffect(() => {
    if (isAdding) typeInput.current?.focus();
  }, [isAdding]);

  function closeForm() {
    setIsAdding(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError("");
    addButton.current?.focus();
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  }

  async function handleAddBalance(event) {
    event.preventDefault();
    if (saving) return;

    const units = Number(form.units);
    const expiresAt = toNairobiExpiry(form.expiresOn);
    const balanceType = BALANCE_TYPES.find((type) => type.value === form.messageType);
    const nextErrors = {};

    if (!balanceType) {
      nextErrors.messageType = "Choose Promotional or Transactional.";
    }

    if (!Number.isSafeInteger(units) || units <= 0) {
      nextErrors.units = "Enter a positive whole number of SMS units.";
    }

    if (!expiresAt) {
      nextErrors.expiresOn = "Choose a valid expiry date and time.";
    } else if (new Date(expiresAt).getTime() <= Date.now()) {
      nextErrors.expiresOn = "Choose a future expiry date and time in Nairobi.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.messageType) typeInput.current?.focus();
      else if (nextErrors.units) unitsInput.current?.focus();
      else expiryInput.current?.focus();
      return;
    }

    setSaving(true);
    setSubmitError("");
    setSuccessMessage("");
    try {
      await CreateAdminSMSPurchase({ message_type: form.messageType, units, expires_at: expiresAt });
      setSuccessMessage(`${units.toLocaleString()} ${balanceType.label.toLowerCase()} SMS units purchased with an expiry of ${formatDate(expiresAt)} (Nairobi).`);
      closeForm();
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Failed to purchase SMS units. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="global-sms-balances-title" aria-busy={loading} className="space-y-6">
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{loadError}</span>
          <button type="button" disabled={loading} onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline disabled:opacity-50">Retry</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {BALANCE_TYPES.map(({ value, label, icon: Icon, color }) => (
          <div key={value} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{label} SMS balance</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatUnits(monitoring?.summary[value]?.balance)} <span className="text-sm font-medium text-gray-500">units</span></p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[["purchased_units", "Purchased units"], ["consumed_units", "Consumed units"], ["expired_units", "Expired units"], ["unallocated_units", "Unallocated units"]].map(([field, title]) => (
                <div key={field}>
                  <dt className="text-gray-500">{title}</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatUnits(monitoring?.summary[value]?.[field])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h2 id="global-sms-balances-title" className="text-[22px] font-bold text-gray-900">Global SMS Monitoring</h2>
            <p className="mt-2 text-sm text-gray-500">Purchase history · All times shown in Nairobi (UTC+03:00).</p>
          </div>
          <button
            ref={addButton}
            type="button"
            aria-label="Add balance"
            title="Add balance"
            aria-expanded={isAdding}
            aria-controls="add-global-sms-balance-form"
            disabled={saving}
            onClick={() => {
              if (isAdding) closeForm();
              else {
                setSuccessMessage("");
                setIsAdding(true);
              }
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#02051d] text-white hover:bg-[#001F3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        {successMessage && (
          <div role="status" className="mx-6 mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
        )}

        <form id="add-global-sms-balance-form" hidden={!isAdding} noValidate onSubmit={handleAddBalance} className="border-b border-gray-200 bg-gray-50/60 px-6 py-5">
          <fieldset disabled={saving} className="min-w-0">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Purchase global SMS units</h3>
            {submitError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div>}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="global-sms-type" className="mb-2 block text-sm font-semibold text-gray-700">Balance type <span className="text-rose-600">*</span></label>
                <select
                  ref={typeInput}
                  id="global-sms-type"
                  required
                  value={form.messageType}
                  onChange={(event) => updateField("messageType", event.target.value)}
                  aria-invalid={Boolean(errors.messageType)}
                  aria-describedby={errors.messageType ? "global-sms-type-error" : undefined}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#001F3D] focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-rose-400"
                >
                  {BALANCE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                {errors.messageType && <p id="global-sms-type-error" role="alert" className="mt-2 text-sm text-rose-600">{errors.messageType}</p>}
              </div>
              <div>
                <label htmlFor="global-sms-units" className="mb-2 block text-sm font-semibold text-gray-700">SMS units <span className="text-rose-600">*</span></label>
                <input
                  ref={unitsInput}
                  id="global-sms-units"
                  type="number"
                  min="1"
                  max={Number.MAX_SAFE_INTEGER}
                  step="1"
                  required
                  value={form.units}
                  onChange={(event) => updateField("units", event.target.value)}
                  aria-invalid={Boolean(errors.units)}
                  aria-describedby={errors.units ? "global-sms-units-error" : undefined}
                  placeholder="Enter SMS units"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#001F3D] focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-rose-400"
                />
                {errors.units && <p id="global-sms-units-error" role="alert" className="mt-2 text-sm text-rose-600">{errors.units}</p>}
              </div>
              <div>
                <label htmlFor="global-sms-expiry" className="mb-2 block text-sm font-semibold text-gray-700">Expiry date and time <span className="text-rose-600">*</span></label>
                <input
                  ref={expiryInput}
                  id="global-sms-expiry"
                  type="datetime-local"
                  min={minimumExpiry}
                  step="1"
                  required
                  value={form.expiresOn}
                  onChange={(event) => updateField("expiresOn", event.target.value)}
                  aria-invalid={Boolean(errors.expiresOn)}
                  aria-describedby={`global-sms-expiry-help${errors.expiresOn ? " global-sms-expiry-error" : ""}`}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#001F3D] focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-rose-400"
                />
                <p id="global-sms-expiry-help" className="mt-2 text-xs text-gray-500">Enter a future time in Nairobi (UTC+03:00).</p>
                {errors.expiresOn && <p id="global-sms-expiry-error" role="alert" className="mt-2 text-sm text-rose-600">{errors.expiresOn}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D]">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#02051d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#001F3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Add Balance"}</button>
            </div>
          </fieldset>
        </form>

        {loading ? (
          <div role="status" className="px-6 py-12 text-center text-sm text-gray-500">Loading global SMS balances…</div>
        ) : !monitoring || monitoring.page !== page ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">Global SMS balances are unavailable.</p>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400"><Wallet size={26} aria-hidden="true" /></span>
            <h3 className="text-base font-semibold text-gray-900">No SMS purchases on this page</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">New purchases appear here after they are saved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <caption className="sr-only">Global SMS purchase history. Dates and times are in Nairobi.</caption>
              <thead>
                <tr>
                  {["ID", "Message type", "Units", "Remaining units", "Expires at", "Created at", "Created by"].map((title) => <th key={title} scope="col" className="whitespace-nowrap border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-600">{title}</th>)}
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">{purchase.id}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-gray-900">{purchase.message_type}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-gray-900">{formatUnits(purchase.units)}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-gray-900">{formatUnits(purchase.remaining_units)}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">{formatDate(purchase.expires_at)}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">{formatDate(purchase.created_at)}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">{purchase.created_by ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">Page {page}{totalPages != null ? ` of ${Math.max(1, totalPages)}` : ""}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPage((current) => current - 1)} disabled={loading || saving || page <= 1} className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={loading || saving || Boolean(loadError) || !hasNextPage} className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </section>
  );
}
