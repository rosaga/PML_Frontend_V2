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
