export interface PeakWhatsAppAccount {
  APIKey?: string;
  apiKey?: string;
  api_key?: string;
  WhatsAppAPIKey?: string;
  whatsapp_api_key?: string;
  OrganizationExternalID?: string;
  organization_external_id?: string;
  DisplayPhoneNumber?: string;
  display_phone_number?: string;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getPeakAccountApiKey(account: PeakWhatsAppAccount): string {
  return (
    clean(account.APIKey) ||
    clean(account.apiKey) ||
    clean(account.api_key) ||
    clean(account.WhatsAppAPIKey) ||
    clean(account.whatsapp_api_key)
  );
}

export function getPeakAccountExternalId(account: PeakWhatsAppAccount): string {
  return clean(account.OrganizationExternalID) || clean(account.organization_external_id);
}

export function getPeakAccountDisplayPhone(account: PeakWhatsAppAccount): string {
  return clean(account.DisplayPhoneNumber) || clean(account.display_phone_number);
}

export class PeakAccountVerificationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "PeakAccountVerificationError";
  }
}

export async function verifyPeakAccount(organizationExternalId: string, token: string) {
  const params = new URLSearchParams({ organization_external_id: organizationExternalId.trim() });
  const response = await fetch(
    `https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account/verify?${params}`,
    { method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Please sign in again to check this organization's WhatsApp account.",
      403: "You do not have permission to access this organization's WhatsApp account.",
      404: "Could not find WhatsApp account for this organization.",
      422: "This organization's WhatsApp account is not configured for verification.",
      502: "WhatsApp provider verification failed. Please try again.",
    };
    throw new PeakAccountVerificationError(
      response.status,
      typeof result?.error === "string" && result.error.trim()
        ? result.error : messages[response.status] || "Failed to verify WhatsApp account. Please try again."
    );
  }

  const wabaId = result?.data?.[0]?.whatsapp_business_account_id;
  const phoneNumberId = result?.data?.[0]?.phone_number_id;
  if (result?.status !== "success" || typeof wabaId !== "string" || !wabaId.trim() ||
      typeof phoneNumberId !== "string" || !phoneNumberId.trim()) {
    throw new PeakAccountVerificationError(502, "WhatsApp verification returned incomplete account details.");
  }

  // Keep the existing provider-backed operations working for authorized accounts.
  const accountResponse = await fetch(
    `https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account?${params}`,
    { method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
  );
  if (accountResponse.status === 401) {
    throw new PeakAccountVerificationError(401, "Please sign in again to check this organization's WhatsApp account.");
  }
  const account = await accountResponse.json().catch(() => null);
  const apiKey = accountResponse.ok ? getPeakAccountApiKey(account?.data || {}) : "";

  return {
    config: {
      wabaId, phoneNumberId,
      businessName: clean(result.data[0].business_name) || clean(result.data[0].name),
      ...(apiKey ? { apiKey } : {}),
    },
    organizationExternalId: clean(result.organization_external_id) || organizationExternalId.trim(),
    displayPhoneNumber: clean(result.display_phone_number),
  };
}
