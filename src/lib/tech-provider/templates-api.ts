import { getToken } from "@/utils/auth";
import type { Template } from "@/lib/whatsapp/whatsapp-api";
import { TECH_PROVIDER_API_BASE_URL } from "./config";
import { validateSampleFile, type TemplateCreationPayload } from "./template-draft";

export class TemplateApiError extends Error {
  outcomeUnknown: boolean;
  constructor(message: string, public code = "", public status = 0, public requestId = "", public retryAfterMs = 0) {
    super(message);
    this.name = "TemplateApiError";
    this.outcomeUnknown = code === "TEMPLATE_OUTCOME_UNKNOWN";
  }
}

async function responseError(response: Response, data: any): Promise<TemplateApiError> {
  const retry = response.headers.get("retry-after");
  const retryAfterMs = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now())) : 0;
  return new TemplateApiError(
    data?.error?.message || data?.message || `Request failed (status ${response.status}).`,
    data?.error?.code || "", response.status, data?.request_id || response.headers.get("x-request-id") || "", retryAfterMs,
  );
}

function connectionUrl(connectionId: string, suffix = "") {
  if (!connectionId.trim()) throw new Error("This WhatsApp account does not have a Meta connection for templates.");
  return `${TECH_PROVIDER_API_BASE_URL}/api/v2/meta/connections/${encodeURIComponent(connectionId)}${suffix}`;
}

function authorization() {
  const token = getToken();
  if (!token) throw new Error("Please sign in again to load templates.");
  return { Authorization: `Bearer ${token}` };
}

export interface TemplateConnection {
  status: string;
  restart_signup: boolean;
}

export async function fetchTemplateConnection(connectionId: string, signal?: AbortSignal): Promise<TemplateConnection> {
  const response = await fetch(connectionUrl(connectionId), { headers: authorization(), cache: "no-store", signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw await responseError(response, data);
  if (typeof data?.connection?.status !== "string" || typeof data.connection.restart_signup !== "boolean") {
    throw new Error("The connection API returned an invalid response.");
  }
  return data.connection;
}

export interface TemplateSample {
  header_handle: string;
  format: string;
  content_type: string;
  file_size: number;
}

export async function uploadTemplateSample(connectionId: string, file: File, signal?: AbortSignal): Promise<TemplateSample> {
  const rule = validateSampleFile(file);
  const url = new URL(connectionUrl(connectionId, "/template-media"));
  url.searchParams.set("filename", file.name);
  const response = await fetch(url.toString(), {
    method: "POST", headers: { ...authorization(), "Content-Type": file.type }, body: file, signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw await responseError(response, data);
  if (!data?.header_handle || data.format !== rule.format) throw new Error("The sample upload did not return a matching Meta review handle. Please upload again.");
  return data;
}

export interface TemplateSubmission {
  id: string;
  category: Template["category"];
  status: string;
  name: string;
  language: string;
  rejected_reason?: string;
}

export async function createTechProviderTemplate(connectionId: string, payload: TemplateCreationPayload, signal?: AbortSignal): Promise<TemplateSubmission> {
  const url = connectionUrl(connectionId, "/templates");
  const headers = { ...authorization(), "Content-Type": "application/json" };
  const body = JSON.stringify(payload);
  if (new Blob([body]).size > 1048576) throw new Error("Template JSON must be no larger than 1 MiB.");
  let response;
  try {
    response = await fetch(url, { method: "POST", headers, body, signal });
  } catch {
    throw new TemplateApiError("The submission response was lost. Check the template's status before submitting again.", "TEMPLATE_OUTCOME_UNKNOWN");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = await responseError(response, data);
    if (response.status >= 500) error.outcomeUnknown = true;
    throw error;
  }
  if (!data?.template?.id || !data.template.status) {
    throw new TemplateApiError("The submission response was incomplete. Check the template's status before submitting again.", "TEMPLATE_OUTCOME_UNKNOWN", response.status, response.headers.get("x-request-id") || "");
  }
  return { ...data.template, name: payload.name, language: payload.language, category: data.template.category || payload.category };
}

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

export async function fetchTechProviderTemplates(connectionId: string, { after, before, signal, name, language, status }: {
  after?: string;
  before?: string;
  signal?: AbortSignal;
  name?: string;
  language?: string;
  status?: string;
} = {}): Promise<TemplatesResponse> {
  if (!connectionId.trim()) throw new Error("This WhatsApp account does not have a Meta connection for templates.");
  const token = getToken();
  if (!token) throw new Error("Please sign in again to load templates.");

  const url = new URL(`${TECH_PROVIDER_API_BASE_URL}/api/v2/meta/connections/${encodeURIComponent(connectionId)}/templates`);
  url.searchParams.set("limit", "25");
  if (name) url.searchParams.set("name", name);
  if (language) url.searchParams.set("language", language);
  if (status) url.searchParams.set("status", status);
  if (after) url.searchParams.set("after", after);
  else if (before) url.searchParams.set("before", before);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw await responseError(response, data);
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

export async function findTechProviderTemplate(connectionId: string, name: string, language: string, signal?: AbortSignal): Promise<TechProviderTemplate | null> {
  let after: string | undefined;
  const cursors = new Set<string>();
  do {
    const result = await fetchTechProviderTemplates(connectionId, { name, language, after, signal });
    const template = result.templates.find((item) => item.name === name && item.language === language);
    if (template) return template;
    if (!result.paging.has_next) return null;
    after = result.paging.after;
    if (!after || cursors.has(after)) throw new Error("Template status lookup could not complete. Check again before submitting.");
    cursors.add(after);
  } while (after);
  return null;
}
