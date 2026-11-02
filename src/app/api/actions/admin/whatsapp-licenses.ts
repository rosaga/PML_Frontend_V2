import axios from "axios";
import apiUrl from "@/app/api/utils/apiUtils/apiUrl";
import { authHeaders } from "@/app/api/utils/headers/headers";
import { hasRole } from "@/utils/decodeToken";

export const BILLING_CYCLES = ["ANNUAL", "HALF_YEAR", "QUARTERLY"] as const;
export const LICENSE_STATUSES = ["SCHEDULED", "ACTIVE", "EXPIRING", "EXPIRED"] as const;
export type BillingCycle = typeof BILLING_CYCLES[number];
export type LicenseStatus = typeof LICENSE_STATUSES[number];

export type WhatsAppLicenseSettings = {
  billing_cycle: BillingCycle;
  start_date: string;
  renewal_date?: string;
  reminder_days: number;
  reminders_enabled: boolean;
};

export type WhatsAppLicense = WhatsAppLicenseSettings & {
  id: string | number;
  organization_external_id: string;
  organization_name?: string;
  organization?: { name?: string };
  status: LicenseStatus;
  days_to_renewal: number;
};

export type WhatsAppSubscription = {
  id: string;
  organization_external_id: string;
  organization_name: string;
  license: WhatsAppLicense | null;
};

export type WhatsAppOrganization = {
  organization_external_id: string;
  organization_name: string;
};

export type WhatsAppOrganizationFilters = {
  limit?: number;
  offset?: number;
  search?: string;
  is_active?: boolean;
};

type WhatsAppOrganizationsResponse = {
  data: WhatsAppOrganization[];
  count: number;
  pagination: { has_more: boolean };
};

export type LicenseFilters = {
  status?: LicenseStatus | "";
  billing_cycle?: BillingCycle | "";
  due_before?: string;
  limit?: number;
  offset?: number;
};
export type ReminderCounts = { sent: number; failed: number; skipped: number };
export type ReminderResult = ReminderCounts & { partialFailure: boolean };
export type ReminderTarget = { organization_ids: string[] } | { all: true };

type ReminderDelivery = { sent?: number | boolean; failed?: number; skipped?: number };

function reminderCounts(data: ReminderDelivery | undefined, singleOrganization = false): ReminderCounts | null {
  if (singleOrganization && data?.sent === true) return { sent: 1, failed: 0, skipped: 0 };
  const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
  if (!isCount(data?.sent) || !isCount(data?.failed) || (data?.skipped !== undefined && !isCount(data.skipped))) return null;
  return { sent: data.sent, failed: data.failed, skipped: data.skipped ?? 0 };
}

async function sendLicenseReminders(url: string, target?: ReminderTarget): Promise<ReminderResult> {
  const config = await superAdminHeaders();
  try {
    const response = await axios.post<{ data: ReminderDelivery }>(url, target, config);
    const counts = reminderCounts(response.data.data, !target);
    if (!counts) throw new WhatsAppLicenseError("The renewal reminder delivery could not be confirmed. Refresh the records before trying again.", 500);
    return { ...counts, partialFailure: false };
  } catch (error) {
    if (axios.isAxiosError<{ data?: ReminderDelivery }>(error) && error.response?.status === 502) {
      const counts = reminderCounts(error.response.data?.data);
      if (counts) return { ...counts, partialFailure: true };
    }
    throw error;
  }
}

export class WhatsAppLicenseError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function licenseErrorStatus(error: unknown) {
  if (error instanceof WhatsAppLicenseError) return error.status;
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function licenseErrorMessage(error: unknown, fallback: string) {
  const messages: Record<number, string> = {
    400: "Check the license settings and try again.",
    401: "Your session has expired. Sign in again.",
    403: "SuperAdmin permission is required to manage WhatsApp licenses.",
    404: "The requested record was not found.",
    503: "Billing is not configured. Contact your administrator.",
  };
  const status = licenseErrorStatus(error);
  const data = axios.isAxiosError<{ error?: string; message?: string; code?: string }>(error) ? error.response?.data : undefined;
  const code = data?.code ?? data?.error;
  if (status === 409) {
    if (code === "reminders_disabled") return "Email reminders are disabled for this organization. Enable reminders and save the license before sending.";
    if (code === "reminder_already_sent") return "A renewal reminder has already been sent for this organization.";
  }
  const detail = data?.error || data?.message;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (status && messages[status]) return messages[status];
  return error instanceof WhatsAppLicenseError ? error.message : fallback;
}

export function isOrganizationExternalId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateWhatsAppLicenseSettings(settings: WhatsAppLicenseSettings) {
  const isDate = (value: string) => {
    const date = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!BILLING_CYCLES.includes(settings.billing_cycle)) return "Select a billing cycle.";
  if (!isDate(settings.start_date)) return "Enter a valid start date (YYYY-MM-DD).";
  if (settings.renewal_date && !isDate(settings.renewal_date)) return "Enter a valid renewal date (YYYY-MM-DD).";
  if (settings.renewal_date && settings.renewal_date <= settings.start_date) return "Renewal date must be after the start date.";
  if (!Number.isInteger(settings.reminder_days) || settings.reminder_days < 0 || settings.reminder_days > 365) return "Reminder days must be an integer between 0 and 365.";
  return "";
}

function organizationLicenseUrl(externalId: string) {
  if (!isOrganizationExternalId(externalId)) {
    throw new WhatsAppLicenseError("An organization external ID (UUID) is required.", 400);
  }
  return `${apiUrl.GET_BALANCE}/admin/organization/${encodeURIComponent(externalId)}/whatsapp/license`;
}

async function superAdminHeaders() {
  const config = await authHeaders();
  const token = config?.headers.Authorization?.replace(/^Bearer /, "");
  if (!token || token === "null") throw new WhatsAppLicenseError("Sign in to manage WhatsApp licenses.", 401);
  if (!hasRole(token, "SuperAdmin")) throw new WhatsAppLicenseError("SuperAdmin permission is required to manage WhatsApp licenses.", 403);
  return config;
}

export async function getOrganizationWhatsAppLicense(externalId: string, signal?: AbortSignal) {
  const url = organizationLicenseUrl(externalId);
  const config = await superAdminHeaders();
  const response = await axios.get<{ data: WhatsAppLicense }>(url, { ...config, signal });
  return response.data.data;
}

export async function saveOrganizationWhatsAppLicense(externalId: string, settings: WhatsAppLicenseSettings) {
  const url = organizationLicenseUrl(externalId);
  const validationError = validateWhatsAppLicenseSettings(settings);
  if (validationError) throw new WhatsAppLicenseError(validationError, 400);
  const config = await superAdminHeaders();
  // Explicitly allow only writable fields; do not spread a fetched license.
  const payload: WhatsAppLicenseSettings = {
    billing_cycle: settings.billing_cycle,
    start_date: settings.start_date,
    reminder_days: settings.reminder_days,
    reminders_enabled: settings.reminders_enabled,
  };
  if (settings.renewal_date) payload.renewal_date = settings.renewal_date;
  const response = await axios.put<{ data: WhatsAppLicense }>(url, payload, config);
  return response.data.data;
}

export async function sendOrganizationWhatsAppLicenseReminder(externalId: string) {
  const url = `${organizationLicenseUrl(externalId)}/reminders`;
  return sendLicenseReminders(url);
}

export async function getWhatsAppLicenses(filters: LicenseFilters = {}, signal?: AbortSignal) {
  const config = await superAdminHeaders();
  const params = new URLSearchParams({
    limit: String(Math.min(200, Math.max(1, filters.limit ?? 50))),
    offset: String(Math.max(0, filters.offset ?? 0)),
  });
  if (filters.status) params.set("status", filters.status);
  if (filters.billing_cycle) params.set("billing_cycle", filters.billing_cycle);
  if (filters.due_before) params.set("due_before", filters.due_before);
  const response = await axios.get<{ data: WhatsAppLicense[]; count: number }>(
    `${apiUrl.GET_BALANCE}/admin/whatsapp/licenses?${params}`, { ...config, signal },
  );
  return response.data;
}

export async function getWhatsAppOrganizations(filters: WhatsAppOrganizationFilters = {}, signal?: AbortSignal) {
  const config = await superAdminHeaders();
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.floor(filters.limit ?? 20))),
    offset: String(Math.max(0, Math.floor(filters.offset ?? 0))),
  });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.is_active !== undefined) params.set("is_active", String(filters.is_active));
  const response = await axios.get<WhatsAppOrganizationsResponse>(
    `${apiUrl.GET_BALANCE}/admin/whatsapp/organizations?${params}`, { ...config, signal },
  );
  return response.data;
}

export async function getAllWhatsAppOrganizations(filters: Pick<WhatsAppOrganizationFilters, "search" | "is_active"> = {}, signal?: AbortSignal) {
  const limit = 20;
  let offset = 0;
  let page = await getWhatsAppOrganizations({ ...filters, limit, offset }, signal);
  const organizations = [...page.data];
  // The subscription filters cover the full directory, including unconfigured licenses.
  while (page.pagination.has_more) {
    if (!page.data.length) throw new Error("Failed to load all WhatsApp organizations.");
    offset += limit;
    page = await getWhatsAppOrganizations({ ...filters, limit, offset }, signal);
    organizations.push(...page.data);
  }
  return organizations;
}

async function getAllWhatsAppLicenses(signal?: AbortSignal) {
  const firstPage = await getWhatsAppLicenses({ limit: 200, offset: 0 }, signal);
  const licenses = [...firstPage.data];
  // Load every license page before matching; a later page must not appear unconfigured.
  for (let offset = 200; offset < firstPage.count; offset += 200) {
    const page = await getWhatsAppLicenses({ limit: 200, offset }, signal);
    if (!page.data.length && offset < page.count) throw new Error("Failed to load all WhatsApp licenses.");
    licenses.push(...page.data);
    if (offset + 200 >= page.count) break;
  }
  return licenses;
}

export async function getWhatsAppSubscriptions(filters: Pick<WhatsAppOrganizationFilters, "search" | "is_active"> = {}, signal?: AbortSignal): Promise<WhatsAppSubscription[]> {
  const [organizations, licenses] = await Promise.all([
    getAllWhatsAppOrganizations(filters, signal),
    getAllWhatsAppLicenses(signal),
  ]);
  const byOrganization = new Map(licenses.map((license) => [license.organization_external_id.toLowerCase(), license]));
  const subscriptions = new Map<string, WhatsAppSubscription>();
  for (const organization of organizations) {
    // Never use an incremental organization ID as a fallback.
    if (!isOrganizationExternalId(organization.organization_external_id)) continue;
    const externalId = organization.organization_external_id.toLowerCase();
    subscriptions.set(externalId, {
      id: externalId,
      organization_external_id: organization.organization_external_id,
      organization_name: organization.organization_name || organization.organization_external_id,
      license: byOrganization.get(externalId) ?? null,
    });
  }
  return Array.from(subscriptions.values());
}

export async function processWhatsAppLicenseReminders(target: ReminderTarget = { all: true }): Promise<ReminderResult> {
  if ("organization_ids" in target) {
    if (!target.organization_ids.length || !target.organization_ids.every(isOrganizationExternalId)) {
      throw new WhatsAppLicenseError("Select organizations using their external IDs (UUIDs).", 400);
    }
    target = { organization_ids: Array.from(new Set(target.organization_ids)) };
  }
  return sendLicenseReminders(`${apiUrl.GET_BALANCE}/admin/whatsapp/licenses/reminders`, target);
}
