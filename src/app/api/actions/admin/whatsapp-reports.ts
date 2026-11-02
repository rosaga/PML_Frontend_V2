import { getToken } from "@/utils/auth";
import { getPeakAccountDisplayPhone } from "@/lib/whatsapp/peak-account";
import { isOrganizationExternalId } from "./whatsapp-licenses";

export type WhatsAppCampaign = {
  id: string;
  name: string;
  group_name: string;
  contacts_count: number;
  total_messages: number;
  sent_count: number;
  delivered_count: number;
  campaign_read_count: number;
  failed_count: number;
  button_click_count: number;
  created_at: string;
};

export type CampaignPage = { data: WhatsAppCampaign[]; total: number; page: number; limit: number };
type CampaignFilters = { page?: number; limit?: number; search?: string; groupId?: string };

function reportToken(externalId: string) {
  if (!isOrganizationExternalId(externalId)) throw new Error("An organization external ID is required.");
  const token = getToken();
  if (!token) throw new Error("Sign in again to load WhatsApp records.");
  return token;
}

export async function getWhatsAppCampaignStats(externalId: string, filters: CampaignFilters = {}, signal?: AbortSignal): Promise<CampaignPage> {
  const token = reportToken(externalId);
  const params = new URLSearchParams({ organizationExternalId: externalId, page: String(filters.page ?? 1), limit: String(filters.limit ?? 10) });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.groupId) params.set("group_id", filters.groupId);
  const response = await fetch(`/api/whatsapp/peakdata/campaign/stats?${params}`, {
    cache: "no-store", headers: { "x-auth-token": token }, signal,
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in again to load WhatsApp records." : "Unable to load campaigns. Please try again.");
  const data: CampaignPage = await response.json();
  if (!Array.isArray(data?.data) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || !Number.isInteger(data.limit) || data.limit < 1) {
    throw new Error("Unable to load campaigns. Please try again.");
  }
  return { ...data, data: data.data.map((row) => ({ ...row, id: String(row.id) })) };
}

const usageFields = ["total_messages", "sent_count", "delivered_count", "campaign_read_count", "failed_count"] as const;
export type WhatsAppUsage = Record<typeof usageFields[number], number> & { campaignCount: number };

export async function getOrganizationWhatsAppUsage(externalId: string, signal?: AbortSignal): Promise<WhatsAppUsage> {
  const totals: WhatsAppUsage = { campaignCount: 0, total_messages: 0, sent_count: 0, delivered_count: 0, campaign_read_count: 0, failed_count: 0 };
  let page = 1;
  while (true) {
    if (signal?.aborted) throw new Error("Request cancelled.");
    const result = await getWhatsAppCampaignStats(externalId, { page, limit: 100 }, signal);
    if (result.page !== page || (!result.data.length && totals.campaignCount < result.total)) throw new Error("Unable to load complete organization usage. Please retry.");
    for (const campaign of result.data) {
      for (const field of usageFields) {
        if (typeof campaign[field] !== "number" || !Number.isFinite(campaign[field]) || campaign[field] < 0) throw new Error("Campaign usage is incomplete. Please retry.");
        totals[field] += campaign[field];
      }
    }
    totals.campaignCount += result.data.length;
    if (result.page * result.limit >= result.total) {
      if (totals.campaignCount !== result.total) throw new Error("Campaign records changed while loading usage. Please refresh.");
      return totals;
    }
    page = result.page + 1;
  }
}

export async function getOrganizationWhatsAppBalance(externalId: string, signal?: AbortSignal): Promise<number> {
  const token = reportToken(externalId);
  const accountResponse = await fetch(
    `https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account?organization_external_id=${encodeURIComponent(externalId)}`,
    { cache: "no-store", headers: { Authorization: `Bearer ${token}` }, signal },
  );
  if (!accountResponse.ok) throw new Error("Unable to load the organization's WhatsApp account.");
  const account = await accountResponse.json();
  const phone = getPeakAccountDisplayPhone(account.data ?? {});
  if (!phone) throw new Error("No WhatsApp phone number is configured for this organization.");
  const response = await fetch("/api/whatsapp/balance", {
    cache: "no-store", headers: { "x-display-phone-number": phone, "x-auth-token": token }, signal,
  });
  if (!response.ok) throw new Error("Unable to check the WhatsApp balance. Please retry.");
  const data = await response.json();
  const raw = data?.data?.[0]?.balance;
  if ((typeof raw !== "number" && typeof raw !== "string") || String(raw).trim() === "" || !Number.isFinite(Number(raw))) throw new Error("The balance service did not return a valid balance.");
  // Match the existing WhatsApp dashboard and top-up balance display in KES.
  return Number(raw) * 1.41;
}
