"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BILLING_CYCLES, LICENSE_STATUSES, getWhatsAppSubscriptions, isOrganizationExternalId,
  licenseErrorMessage, licenseErrorStatus, processWhatsAppLicenseReminders,
  type BillingCycle, type LicenseStatus, type WhatsAppSubscription,
} from "@/app/api/actions/admin/whatsapp-licenses";
import OrganizationWhatsAppLicense, { billingCycleLabels, LicenseStatusBadge } from "./license";
import { AdminCard, AdminTable, formatDate, inputClass, primaryButtonClass, secondaryButtonClass, type TableColumn } from "./ui";

export default function WhatsAppLicenses() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LicenseStatus | "UNCONFIGURED" | "">("");
  const [cycle, setCycle] = useState<BillingCycle | "">("");
  const [dueBefore, setDueBefore] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<WhatsAppSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [selected, setSelected] = useState<WhatsAppSubscription | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState<"selected" | "all" | null>(null);
  const [reminderResult, setReminderResult] = useState<{ message: string; warning: boolean } | null>(null);
  const [reminderError, setReminderError] = useState("");
  const processingRef = useRef(false);
  const licenseTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function loadLicenses() {
      try {
        const result = await getWhatsAppSubscriptions({ search: query }, controller.signal);
        if (controller.signal.aborted) return;
        setRows(result);
        setAccessDenied(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        setRows([]);
        setError(licenseErrorMessage(err, "Failed to load WhatsApp organizations and their licenses."));
        setAccessDenied([401, 403].includes(licenseErrorStatus(err) ?? 0));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    const timer = window.setTimeout(() => { void loadLicenses(); }, query.trim() ? 300 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [revision, query]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const license = row.license;
    if (status === "UNCONFIGURED" && license) return false;
    if (status && status !== "UNCONFIGURED" && license?.status !== status) return false;
    if (cycle && license?.billing_cycle !== cycle) return false;
    if (dueBefore && (!license?.renewal_date || license.renewal_date.slice(0, 10) >= dueBefore)) return false;
    return true;
  }), [rows, status, cycle, dueBefore]);
  const count = filteredRows.length;
  const currentOffset = Math.min(offset, Math.max(0, Math.ceil(count / limit) - 1) * limit);
  const visibleRows = filteredRows.slice(currentOffset, currentOffset + limit);
  const selectedOrganizationIds = filteredRows.filter((row) => row.license && selectedIds.includes(row.organization_external_id)).map((row) => row.organization_external_id);

  useEffect(() => { setOffset(currentOffset); }, [currentOffset]);
  useEffect(() => { setSelectedIds([]); }, [query, status, cycle, dueBefore]);

  async function handleProcessReminders(scope: "selected" | "all") {
    if (processingRef.current || loading || accessDenied || (scope === "selected" && !selectedOrganizationIds.length)) return;
    if (scope === "all" && !window.confirm("Send renewal reminder emails for all due renewals? This includes organizations outside the current filters.")) return;
    processingRef.current = true;
    setProcessing(scope);
    setReminderError("");
    setReminderResult(null);
    try {
      const result = await processWhatsAppLicenseReminders(scope === "all" ? { all: true } : { organization_ids: selectedOrganizationIds });
      const warning = result.partialFailure || result.failed > 0;
      setReminderResult({ message: `${warning ? "Reminders processed with failures" : "Reminders processed"}: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`, warning });
    } catch (err) {
      setReminderError(licenseErrorMessage(err, "Failed to process renewal reminders."));
      if ([401, 403].includes(licenseErrorStatus(err) ?? 0)) setAccessDenied(true);
    } finally {
      processingRef.current = false;
      setProcessing(null);
      setRevision((value) => value + 1);
    }
  }

  const columns: TableColumn<WhatsAppSubscription>[] = [
    { key: "select", label: "Select", render: (row) => <input type="checkbox" className="h-4 w-4 accent-[#02051d]" aria-label={`Select ${row.organization_name} for a renewal reminder`} checked={selectedIds.includes(row.organization_external_id)} disabled={Boolean(processing) || accessDenied || !row.license || !isOrganizationExternalId(row.organization_external_id)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, row.organization_external_id] : ids.filter((id) => id !== row.organization_external_id))} /> },
    { key: "organization_name", label: "Organization", render: (row) => isOrganizationExternalId(row.organization_external_id)
      ? <Link href={`/apps/admin/organizations/${encodeURIComponent(row.organization_external_id)}`} className="font-semibold text-[#001F3D] underline underline-offset-4">{row.organization_name}</Link>
      : <span className="font-semibold">{row.organization_name || "—"}</span> },
    { key: "billing_cycle", label: "Billing Cycle", render: (row) => row.license ? billingCycleLabels[row.license.billing_cycle] || row.license.billing_cycle : "—" },
    { key: "renewal_date", label: "Renewal Date", render: (row) => <span className="whitespace-nowrap">{formatDate(row.license?.renewal_date ?? null)}</span> },
    { key: "status", label: "Status", render: (row) => row.license ? <LicenseStatusBadge status={row.license.status} /> : <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">Unconfigured</span> },
    { key: "days_to_renewal", label: "Days to Renewal", render: (row) => row.license?.days_to_renewal ?? "—" },
    { key: "reminders_enabled", label: "Email Reminders", render: (row) => row.license ? row.license.reminders_enabled ? "Enabled" : "Disabled" : "—" },
    { key: "reminder_days", label: "Reminder Days", render: (row) => row.license ? <span className="whitespace-nowrap">{row.license.reminder_days} days before</span> : "—" },
    { key: "actions", label: "Actions", render: (row) => <button type="button" className={`${secondaryButtonClass} whitespace-nowrap`} disabled={Boolean(processing) || !isOrganizationExternalId(row.organization_external_id)} aria-haspopup="dialog" onClick={(event) => { licenseTrigger.current = event.currentTarget; setSelected(row); }}>{row.license ? "Edit License" : "Configure License"}</button> },
  ];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="min-w-0 flex-1 basis-60 text-sm font-medium text-gray-700">Search WhatsApp organizations
        <input className={`${inputClass} mt-2`} type="search" placeholder="Organization name or UUID" value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); }} />
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-44">Status
        <select className={`${inputClass} mt-2`} value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setOffset(0); }}><option value="">All Statuses</option><option value="UNCONFIGURED">Unconfigured</option>{LICENSE_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-44">Billing cycle
        <select className={`${inputClass} mt-2`} value={cycle} onChange={(event) => { setCycle(event.target.value as BillingCycle | ""); setOffset(0); }}><option value="">All Cycles</option>{BILLING_CYCLES.map((value) => <option key={value} value={value}>{billingCycleLabels[value]}</option>)}</select>
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-44">Due before
        <input className={`${inputClass} mt-2`} type="date" value={dueBefore} onChange={(event) => { setDueBefore(event.target.value); setOffset(0); }} />
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-32">Per page
        <select className={`${inputClass} mt-2`} value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setOffset(0); }}>{[50, 100, 200].map((value) => <option key={value}>{value}</option>)}</select>
      </label>
      <button type="button" className={secondaryButtonClass} disabled={!query && !status && !cycle && !dueBefore} onClick={() => { setQuery(""); setStatus(""); setCycle(""); setDueBefore(""); setOffset(0); }}>Clear Filters</button>
    </div>

    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[61] max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none"
          onCloseAutoFocus={(event) => { event.preventDefault(); licenseTrigger.current?.focus(); }}
        >
          <Dialog.Title className="sr-only">Configure WhatsApp License</Dialog.Title>
          <Dialog.Description className="sr-only">View and update renewal settings for {selected?.organization_name}.</Dialog.Description>
          {selected && <OrganizationWhatsAppLicense key={selected.organization_external_id} organizationExternalId={selected.organization_external_id} organizationName={selected.organization_name} onSaved={() => setRevision((value) => value + 1)} onClose={() => setSelected(null)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <AdminCard title="WhatsApp Subscriptions" description="WhatsApp organizations and their licenses. Configure or edit a license directly from this list." action={<div className="flex flex-wrap gap-2">
      <button type="button" className={secondaryButtonClass} disabled={loading || Boolean(processing)} onClick={() => setRevision((value) => value + 1)}>Refresh</button>
    </div>}>
      {error && <p role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading ? <p role="status" className="px-6 py-10 text-center text-sm text-gray-500">Loading WhatsApp organizations...</p> : !error && <AdminTable columns={columns} rows={visibleRows} emptyMessage="No WhatsApp organizations match these filters." pagination={{ offset: currentOffset, limit, count, onPageChange: setOffset }} />}
    </AdminCard>

    <AdminCard title="Renewal Reminders" description="Send reminder emails for selected organizations or all due renewals. All due renewals includes organizations outside the current filters.">
      <div className="p-5 sm:p-6" aria-busy={Boolean(processing)}>
        {reminderError && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{reminderError}</p>}
        {reminderResult && <p role={reminderResult.warning ? "alert" : "status"} className={`mb-4 rounded-xl border px-4 py-3 text-sm ${reminderResult.warning ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"}`}>{reminderResult.message}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={primaryButtonClass} disabled={Boolean(processing) || loading || accessDenied || !selectedOrganizationIds.length} onClick={() => handleProcessReminders("selected")}>{processing === "selected" ? "Sending Reminders..." : `Send Selected (${selectedOrganizationIds.length})`}</button>
          <button type="button" className={secondaryButtonClass} disabled={Boolean(processing) || loading || accessDenied} onClick={() => handleProcessReminders("all")}>{processing === "all" ? "Sending Reminders..." : "Send All Due Renewals"}</button>
          <button type="button" className={secondaryButtonClass} disabled={Boolean(processing) || !selectedIds.length} onClick={() => setSelectedIds([])}>Clear Selection</button>
        </div>
      </div>
    </AdminCard>
  </div>;
}
