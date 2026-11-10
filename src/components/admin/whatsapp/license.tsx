"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  BILLING_CYCLES, getOrganizationWhatsAppLicense, licenseErrorMessage, licenseErrorStatus,
  saveOrganizationWhatsAppLicense, sendOrganizationWhatsAppLicenseReminder, validateWhatsAppLicenseSettings,
  type BillingCycle, type LicenseStatus, type WhatsAppLicense,
} from "@/app/api/actions/admin/whatsapp-licenses";
import { AdminCard, formatDate, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";
import { getToken } from "@/utils/auth";
import { hasRole } from "@/utils/decodeToken";

export const billingCycleLabels: Record<BillingCycle, string> = {
  ANNUAL: "Annual", HALF_YEAR: "Half year", QUARTERLY: "Quarterly",
};

export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  const classes = {
    SCHEDULED: "bg-gray-100 text-gray-600", ACTIVE: "bg-[#02051d] text-white",
    EXPIRING: "bg-amber-50 text-amber-700", EXPIRED: "bg-rose-50 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${classes[status] || classes.SCHEDULED}`}>{status}</span>;
}

function defaultForm() {
  return {
    billing_cycle: "ANNUAL" as BillingCycle,
    start_date: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
    renewal_date: "", reminder_days: "30", reminders_enabled: true,
  };
}

function licenseForm(license: WhatsAppLicense) {
  return {
    billing_cycle: license.billing_cycle,
    start_date: license.start_date.slice(0, 10),
    renewal_date: license.renewal_date?.slice(0, 10) ?? "",
    reminder_days: String(license.reminder_days ?? 30),
    reminders_enabled: license.reminders_enabled ?? true,
  };
}

export default function OrganizationWhatsAppLicense({ organizationExternalId, organizationName, onSaved, onClose }: {
  organizationExternalId: string;
  organizationName: string;
  onSaved?: () => void;
  onClose?: () => void;
}) {
  const [license, setLicense] = useState<WhatsAppLicense | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const savingRef = useRef(false);
  const sendingReminderRef = useRef(false);

  useEffect(() => {
    setIsSuperAdmin(hasRole(getToken(), "SuperAdmin"));
  }, []);

  const loadLicense = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoaded(false);
    setError("");
    try {
      const result = await getOrganizationWhatsAppLicense(organizationExternalId, signal);
      if (signal?.aborted) return;
      setLicense(result);
      setForm(licenseForm(result));
      setLoaded(true);
    } catch (err) {
      if (signal?.aborted) return;
      // This component is only mounted for a known organization.
      if (licenseErrorStatus(err) === 404) {
        setLicense(null);
        setForm(defaultForm());
        setLoaded(true);
      } else {
        setError(licenseErrorMessage(err, "Failed to load the WhatsApp license."));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [organizationExternalId]);

  useEffect(() => {
    const controller = new AbortController();
    setSuccess("");
    void loadLicense(controller.signal);
    return () => controller.abort();
  }, [loadLicense]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || sendingReminderRef.current || !loaded) return;
    setError("");
    setSuccess("");
    const settings = {
      billing_cycle: form.billing_cycle, start_date: form.start_date,
      renewal_date: form.renewal_date || undefined,
      reminder_days: form.reminder_days.trim() ? Number(form.reminder_days) : NaN,
      reminders_enabled: form.reminders_enabled,
    };
    const validationError = validateWhatsAppLicenseSettings(settings);
    if (validationError) { setError(validationError); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await saveOrganizationWhatsAppLicense(organizationExternalId, settings);
      setLicense(saved);
      setForm(licenseForm(saved));
      setSuccess("WhatsApp license saved successfully.");
      onSaved?.();
      await loadLicense();
    } catch (err) {
      setError(licenseErrorMessage(err, "Failed to save the WhatsApp license."));
      if ([401, 403, 404].includes(licenseErrorStatus(err) ?? 0)) setLoaded(false);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleSendReminder() {
    if (sendingReminderRef.current || savingRef.current || !loaded || !license || !isSuperAdmin) return;
    sendingReminderRef.current = true;
    setSendingReminder(true);
    setError("");
    setSuccess("");
    try {
      const result = await sendOrganizationWhatsAppLicenseReminder(organizationExternalId);
      await loadLicense();
      onSaved?.();
      const message = `Renewal reminder for ${organizationName}: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`;
      if (result.partialFailure || result.failed > 0) setError(message);
      else setSuccess(message);
    } catch (err) {
      await loadLicense();
      onSaved?.();
      setError(licenseErrorMessage(err, "Failed to send the renewal reminder."));
      if ([401, 403].includes(licenseErrorStatus(err) ?? 0)) setIsSuperAdmin(false);
    } finally {
      sendingReminderRef.current = false;
      setSendingReminder(false);
    }
  }

  return <div id="whatsapp-license">
    <AdminCard title="WhatsApp License" description={`Configure renewal and email reminders for ${organizationName}.`} action={<div className="flex gap-2">
      <button type="button" className={secondaryButtonClass} disabled={loading || saving || sendingReminder} onClick={() => { setSuccess(""); void loadLicense(); }}>Refresh</button>
      {onClose && <button type="button" className={secondaryButtonClass} disabled={saving || sendingReminder} onClick={onClose}>Close</button>}
    </div>}>
      <div className="p-5 sm:p-6" aria-busy={loading || saving || sendingReminder}>
        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}
        {loading ? <p role="status" className="py-6 text-center text-sm text-gray-500">Loading WhatsApp license...</p> : loaded && <>
          {license ? <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <LicenseStatusBadge status={license.status} />
            <span>Renewal: {formatDate(license.renewal_date ?? null)}</span>
            <span>Days to renewal: {license.days_to_renewal ?? "—"}</span>
          </div> : <p className="mb-5 text-sm text-gray-500">No WhatsApp license is configured. Save the settings below to create one.</p>}
          <form onSubmit={handleSave}>
            <fieldset disabled={saving || sendingReminder} className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-gray-700">Billing cycle
                <select className={`${inputClass} mt-2`} value={form.billing_cycle} onChange={(event) => setForm({ ...form, billing_cycle: event.target.value as BillingCycle })} required>
                  {BILLING_CYCLES.map((cycle) => <option key={cycle} value={cycle}>{billingCycleLabels[cycle]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Start date
                <input className={`${inputClass} mt-2`} type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required />
              </label>
              <label className="block text-sm font-medium text-gray-700">Renewal date (optional)
                <input className={`${inputClass} mt-2`} type="date" value={form.renewal_date} onChange={(event) => setForm({ ...form, renewal_date: event.target.value })} aria-describedby="license-renewal-hint" />
                <span id="license-renewal-hint" className="mt-2 block text-xs font-normal text-gray-500">Leave blank to calculate from the billing cycle.</span>
              </label>
              <label className="block text-sm font-medium text-gray-700">Reminder days before renewal
                <input className={`${inputClass} mt-2`} type="number" min={0} max={365} step={1} value={form.reminder_days} onChange={(event) => setForm({ ...form, reminder_days: event.target.value })} required />
              </label>
              <label className="flex items-center gap-3 self-start pt-8 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 accent-[#02051d]" checked={form.reminders_enabled} onChange={(event) => setForm({ ...form, reminders_enabled: event.target.checked })} />
                Enable email reminders
              </label>
            </fieldset>
            <div className="mt-6 flex justify-end"><button type="submit" className={primaryButtonClass} disabled={saving || sendingReminder}>{saving ? "Saving..." : license ? "Save License" : "Create License"}</button></div>
          </form>
          {isSuperAdmin && license && <div className="mt-6 border-t border-gray-200 pt-5">
            <p id="license-reminder-help" className="mb-3 text-sm text-gray-500">Email a renewal reminder for {organizationName} to the configured billing team.</p>
            <button type="button" className={secondaryButtonClass} disabled={sendingReminder || saving} onClick={handleSendReminder} aria-describedby="license-reminder-help">
              {sendingReminder ? "Sending reminder..." : "Send renewal reminder"}
            </button>
          </div>}
        </>}
      </div>
    </AdminCard>
  </div>;
}
