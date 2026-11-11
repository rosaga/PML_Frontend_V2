import { getToken } from "@/utils/auth";
import { TECH_PROVIDER_API_BASE_URL } from "./config";

export interface TechProviderAccount {
  external_id: string;
  phone_number_id?: string | null;
  waba_id?: string | null;
  display_phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  is_active: boolean;
  meta_app_id?: string | null;
  meta_configuration_id?: string | null;
  business_id?: string | null;
  verified_name?: string | null;
  meta_assets_verified?: boolean | null;
  meta_lifecycle_status?: string | null;
  meta_connection_id?: string | null;
}

export async function fetchTechProviderAccount(externalId: string, { signal }: {
  signal?: AbortSignal;
} = {}): Promise<TechProviderAccount | null> {
  if (!externalId.trim()) throw new Error("Select an organization to load its WhatsApp account.");
  const token = getToken();
  if (!token) throw new Error("Please sign in again to load your WhatsApp account.");

  const response = await fetch(`${TECH_PROVIDER_API_BASE_URL}/api/v2/accounts/${encodeURIComponent(externalId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  if (response.status === 404) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.message || `Could not load your WhatsApp account (status ${response.status}).`);
  }
  if (body && body.data === null) return null;
  if (!body?.data || body.data.external_id !== externalId || typeof body.data.is_active !== "boolean") {
    throw new Error("The account API returned an invalid response for the selected organization.");
  }
  return body.data;
}
