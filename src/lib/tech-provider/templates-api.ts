import { getToken } from "@/utils/auth";
import type { Template } from "@/lib/whatsapp/whatsapp-api";
import { TECH_PROVIDER_API_BASE_URL, TECH_PROVIDER_CONNECTION_ID } from "./config";

export type TechProviderTemplate = Template & {
  id: string;
  language: string;
  status: string;
  parameter_format?: string;
  rejected_reason?: string;
};

export interface TemplatePaging {
  before?: string;
  after?: string;
  has_next: boolean;
  has_previous: boolean;
}

export interface TemplatesResponse {
  templates: TechProviderTemplate[];
  paging: TemplatePaging;
}

export async function fetchTechProviderTemplates({ after, before, signal }: {
  after?: string;
  before?: string;
  signal?: AbortSignal;
} = {}): Promise<TemplatesResponse> {
  const token = getToken();
  if (!token) throw new Error("Please sign in again to load templates.");

  const url = new URL(`${TECH_PROVIDER_API_BASE_URL}/api/v2/meta/connections/${encodeURIComponent(TECH_PROVIDER_CONNECTION_ID)}/templates`);
  url.searchParams.set("limit", "25");
  if (after) url.searchParams.set("after", after);
  else if (before) url.searchParams.set("before", before);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Could not load templates (status ${response.status}).`;
    throw new Error(message);
  }
  if (!Array.isArray(data?.templates)) throw new Error("The templates API returned an invalid response.");

  return {
    templates: data.templates,
    paging: {
      before: data.paging?.before,
      after: data.paging?.after,
      has_next: data.paging?.has_next === true,
      has_previous: data.paging?.has_previous === true,
    },
  };
}
