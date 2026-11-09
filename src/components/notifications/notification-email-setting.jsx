"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { GetOrganization, UpdateOrganizationNotificationEmail } from "@/app/api/actions/accounts/accounts";
import { getActiveOrganizationId, resolveAirtimeOrganization } from "@/lib/airtime/organization";
import { useActiveOrganization } from "@/lib/airtime/useOrganizationQuery";
import { getToken } from "@/utils/auth";

const emailSchema = z.string().email();
const initialSetting = (orgId = null) => ({ orgId, externalId: "", organization: null, email: "", loading: !!orgId, saving: false, error: "", invalid: false, saved: false });

function errorMessage(error, fallback) {
  const body = error?.response?.data;
  const message = [body?.error, body?.message].find((value) => typeof value === "string" && value.trim());
  if (message) return message;
  if (error?.response?.status === 403) return "You do not have permission to manage notification email for this organization.";
  if (error?.response?.status === 401) return "Your session is no longer authorized. Please sign in again.";
  return typeof error?.message === "string" && error.message.trim() ? error.message : fallback;
}

function organizationFromResponse(response) {
  const body = response?.data;
  const organization = body?.data ?? body;
  if (body?.error || !organization || (typeof organization.notification_email !== "string" && typeof organization.created_by !== "string")) {
    throw new Error(typeof body?.error === "string" ? body.error : "The organization response is invalid. Please try again.");
  }
  return organization;
}

function customEmail(organization) {
  return typeof organization?.notification_email === "string" ? organization.notification_email.trim() : "";
}

function recipientEmail(organization) {
  return customEmail(organization) || (typeof organization?.created_by === "string" ? organization.created_by.trim() : "");
}

export default function NotificationEmailSetting() {
  const orgId = useActiveOrganization();
  const [setting, setSetting] = useState(() => initialSetting());
  const [attempt, setAttempt] = useState(0);
  const sequence = useRef({ version: 0 });
  const inFlight = useRef(false);

  useEffect(() => {
    const counter = sequence.current;
    const version = ++counter.version;
    const current = () => version === counter.version && getActiveOrganizationId() === orgId;
    inFlight.current = false;
    setSetting(initialSetting(orgId));

    async function load() {
      try {
        if (!getToken()) throw new Error("Sign in to manage notification email.");
        const externalId = await resolveAirtimeOrganization(orgId);
        if (!current()) return;
        const organization = organizationFromResponse(await GetOrganization(externalId));
        if (current()) setSetting({ ...initialSetting(orgId), externalId, organization, email: recipientEmail(organization), loading: false });
      } catch (error) {
        if (current()) setSetting((previous) => ({ ...previous, loading: false, error: errorMessage(error, "Unable to load notification email. Please try again.") }));
      }
    }
    if (orgId) load();
    return () => { counter.version++; };
  }, [orgId, attempt]);

  const active = !!orgId && setting.orgId === orgId;
  const ready = active && !!setting.organization && !setting.loading;
  const busy = !!orgId && (!active || setting.loading || setting.saving);

  const save = async (event) => {
    event.preventDefault();
    if (!ready || setting.saving || inFlight.current || getActiveOrganizationId() !== orgId) return;
    const email = setting.email.trim();
    setSetting((previous) => ({ ...previous, error: "", invalid: false, saved: false }));
    if (email && !emailSchema.safeParse(email).success) {
      setSetting((previous) => ({ ...previous, error: "Enter a single valid email address.", invalid: true }));
      return;
    }
    if (!getToken()) return;

    const version = sequence.current.version;
    const current = () => version === sequence.current.version && getActiveOrganizationId() === orgId;
    inFlight.current = true;
    setSetting((previous) => ({ ...previous, saving: true }));
    try {
      const organization = organizationFromResponse(await UpdateOrganizationNotificationEmail(setting.externalId, email));
      if (current()) setSetting((previous) => ({ ...previous, organization, email: recipientEmail(organization), saved: true }));
    } catch (error) {
      if (current()) setSetting((previous) => ({ ...previous, error: errorMessage(error, "Unable to save notification email. Please try again.") }));
    } finally {
      if (current()) {
        inFlight.current = false;
        setSetting((previous) => ({ ...previous, saving: false }));
      }
    }
  };

  return (
    <section className="my-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-700" aria-label="Notification email" aria-busy={busy}>
      {!orgId ? <p className="text-sm text-gray-500">Select an organization to manage notification email.</p> : (
        <form onSubmit={save} noValidate className="space-y-3">
          <label htmlFor="notification-email" className="block text-sm font-medium text-gray-900 dark:text-white">Notification email</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="notification-email"
              name="notification_email"
              type="email"
              autoComplete="email"
              value={active ? setting.email : ""}
              disabled={busy || !ready}
              onChange={(event) => setSetting((previous) => ({ ...previous, email: event.target.value, error: "", invalid: false, saved: false }))}
              aria-invalid={active && setting.invalid}
              aria-describedby={`notification-email-help${active && setting.error ? " notification-email-error" : ""}`}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-[#E88A17] focus:outline-none focus:ring-1 focus:ring-[#E88A17] disabled:bg-gray-100"
            />
            <button type="submit" disabled={busy || !ready} className="h-10 rounded-xl bg-[#090A29] px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline-[#E88A17] disabled:cursor-not-allowed disabled:opacity-60">
              {active && setting.saving ? "Changing…" : "Change email"}
            </button>
          </div>
          {(!active || setting.loading) && <p role="status" className="text-sm text-gray-500">Loading notification email…</p>}
          {active && setting.error && <p id="notification-email-error" role="alert" className="text-sm text-red-600">{setting.error}</p>}
          {active && setting.error && !setting.organization && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="text-sm font-medium text-[#945003] underline">Try again</button>}
          {active && setting.saved && <p role="status" className="text-sm text-green-700">Notification email saved.</p>}
        </form>
      )}
    </section>
  );
}
