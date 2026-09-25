"use client";

export const META_FLOWS_BASE_URL =
  "https://flowbot-1048592730476.europe-west4.run.app/api/v2/meta-flows";
const META_FLOW_DISPATCHES_URL =
  "https://flowbot-1048592730476.europe-west4.run.app/api/v2/meta-flow-dispatches";
const META_FLOW_RECORDS_URL =
  "https://flowbot-1048592730476.europe-west4.run.app/api/v2/meta-flow-records";

export interface MetaFlow {
  id: number | string;
  type: "META_FLOW" | "CATALOGUE";
  meta_flow_record_id?: number | string;
  organization_id: number | string;
  organization_external_id: string;
  phone_number_id: string;
  flow_id: string;
  flow_name: string;
  default_cta: string;
  default_screen: string;
  status: string;
  is_active?: boolean;
  description?: string;
  meta_flow_id?: string;
  flow_message_version?: string;
  flow_cta?: string;
  body_text?: string;
  forward_to_chatbot: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMetaFlowPayload {
  type: "META_FLOW" | "CATALOGUE";
  flow_id: string;
  flow_name: string;
  default_cta: string;
  default_screen: string;
  description?: string;
  body_text?: string;
  flow_message_version?: string;
  channel_id?: number;
  status?: string;
  is_active?: boolean;
}

export interface SendMetaFlowPayload {
  organization_id: string;
  to: string;
  phone_number_id: string;
  meta_flow_id: string;
  body_text: string;
  flow_cta: string;
  screen: string;
}

export interface SendMetaFlowResponse {
  id?: number | string;
  meta_flow_id?: string;
  message_id?: string;
  status: string;
  [key: string]: unknown;
}

export interface MetaFlowSubmission {
  id: number;
  meta_flow_dispatch_id?: number;
  meta_flow_record_id?: number;
  organization_id?: string;
  organization_external_id?: string;
  contact_id: number;
  mobile_no: string;
  from_mobile_no?: string;
  whatsapp_message_id?: number;
  meta_flow_send_id?: number;
  provider_message_id?: string;
  context_message_id?: string;
  flow_id: string;
  flow_name: string;
  flow_token: string;
  response_json: Record<string, unknown>;
  raw_webhook?: Record<string, unknown>;
  received_at?: string;
  submitted_at: string;
  created_at: string;
}

export interface MetaFlowSubmissionsFilters {
  page?: number;
  limit?: number;
  flow_id?: string;
  mobile_no?: string;
  submitted_from?: string;
  submitted_to?: string;
}

export interface MetaFlowSubmissionsResponse {
  count: number;
  data: MetaFlowSubmission[];
  meta: {
    limit: number;
    page: number;
    total_pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FlowbotMetaFlow {
  id?: number | string;
  type?: "META_FLOW" | "CATALOGUE";
  meta_flow_record_id?: number | string;
  organization_id?: number | string;
  organization_external_id?: string;
  phone_number_id?: string;
  flow_id?: string;
  flow_name?: string;
  name?: string;
  default_cta?: string;
  flow_cta?: string;
  default_screen?: string;
  status?: string;
  is_active?: boolean;
  description?: string;
  meta_flow_id?: string;
  flow_message_version?: string;
  body_text?: string;
  forward_to_chatbot?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface FlowbotMetaFlowResponse {
  id?: number;
  meta_flow_dispatch_id?: number;
  meta_flow_record_id?: number;
  contact_id?: number;
  organization_id?: string;
  from_mobile_no?: string;
  mobile_no?: string;
  flow_token?: string;
  response_json?: Record<string, unknown> | string | null;
  raw_webhook?: Record<string, unknown>;
  received_at?: string;
  created_at?: string;
}

function normalizeMetaFlow(flow: FlowbotMetaFlow): MetaFlow {
  const flowId = flow.flow_id || flow.meta_flow_id || "";
  const flowName = flow.flow_name || flow.name || "";
  const defaultCta = flow.default_cta || flow.flow_cta || "";
  const type = flow.type === "CATALOGUE" ? "CATALOGUE" : "META_FLOW";

  return {
    id: flow.id || flowId,
    type,
    meta_flow_record_id: flow.meta_flow_record_id || flow.id,
    organization_id: flow.organization_id || flow.organization_external_id || "",
    organization_external_id: flow.organization_external_id || String(flow.organization_id || ""),
    phone_number_id: flow.phone_number_id || "",
    flow_id: flowId,
    flow_name: flowName,
    default_cta: defaultCta,
    default_screen: flow.default_screen || "",
    status: flow.status || (flow.is_active ? "LIVE" : ""),
    is_active: flow.is_active,
    description: flow.description,
    meta_flow_id: flow.meta_flow_id,
    flow_message_version: flow.flow_message_version,
    flow_cta: flow.flow_cta,
    body_text: flow.body_text,
    forward_to_chatbot: flow.forward_to_chatbot || false,
    created_by: flow.created_by || "",
    updated_by: flow.updated_by || "",
    created_at: flow.created_at || "",
    updated_at: flow.updated_at || "",
  };
}

function normalizeMetaFlowsResponse(data: unknown): { count: number; data: MetaFlow[] } {
  const responseData = data as { count?: number; data?: unknown; results?: unknown };
  const rawFlows = Array.isArray(data)
    ? data
    : Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData.results)
        ? responseData.results
      : [];
  const flows = rawFlows.map((flow) => normalizeMetaFlow(flow as FlowbotMetaFlow));

  return {
    count: typeof responseData.count === "number" ? responseData.count : flows.length,
    data: flows,
  };
}

function parseResponseJson(value: FlowbotMetaFlowResponse["response_json"]): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return value;
}

function normalizeMetaFlowSubmission(response: FlowbotMetaFlowResponse): MetaFlowSubmission {
  const responseJson = parseResponseJson(response.response_json);
  const flowToken = response.flow_token || String(responseJson.flow_token || "");
  const submittedAt = response.received_at || response.created_at || "";

  return {
    id: response.id || 0,
    meta_flow_dispatch_id: response.meta_flow_dispatch_id,
    meta_flow_record_id: response.meta_flow_record_id,
    organization_id: response.organization_id,
    organization_external_id: response.organization_id,
    contact_id: response.contact_id || 0,
    mobile_no: response.mobile_no || response.from_mobile_no || "",
    from_mobile_no: response.from_mobile_no,
    flow_id: response.meta_flow_record_id ? String(response.meta_flow_record_id) : "",
    flow_name: "",
    flow_token: flowToken,
    response_json: responseJson,
    raw_webhook: response.raw_webhook,
    received_at: response.received_at,
    submitted_at: submittedAt,
    created_at: response.created_at || submittedAt,
  };
}

function normalizeMetaFlowSubmissionsResponse(
  data: unknown,
  filters: MetaFlowSubmissionsFilters
): MetaFlowSubmissionsResponse {
  const responseData = data as { count?: number; results?: unknown; data?: unknown };
  const rawResponses = Array.isArray(data)
    ? data
    : Array.isArray(responseData.results)
      ? responseData.results
      : Array.isArray(responseData.data)
        ? responseData.data
      : [];

  let submissions = rawResponses.map((response) =>
    normalizeMetaFlowSubmission(response as FlowbotMetaFlowResponse)
  );

  const mobileNo = filters.mobile_no?.trim();
  if (mobileNo) {
    submissions = submissions.filter((submission) => submission.mobile_no.includes(mobileNo));
  }
  if (filters.submitted_from) {
    const fromTime = new Date(filters.submitted_from).getTime();
    submissions = submissions.filter((submission) => new Date(submission.submitted_at).getTime() >= fromTime);
  }
  if (filters.submitted_to) {
    const toTime = new Date(`${filters.submitted_to}T23:59:59.999`).getTime();
    submissions = submissions.filter((submission) => new Date(submission.submitted_at).getTime() <= toTime);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const count = submissions.length;
  const start = (page - 1) * limit;
  const pagedSubmissions = submissions.slice(start, start + limit);

  return {
    count,
    data: pagedSubmissions,
    meta: {
      limit,
      page,
      total_pages: Math.max(1, Math.ceil(count / limit)),
    },
  };
}

async function parseApiResponse<T>(
  response: Response,
  fallbackError: string
): Promise<ApiResponse<T>> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      error:
        data?.error?.message ||
        data?.error ||
        data?.message ||
        fallbackError,
    };
  }

  return { success: true, data };
}

export async function getMetaFlows(
  organizationExternalId: string
): Promise<ApiResponse<{ count: number; data: MetaFlow[] }>> {
  try {
    const response = await fetch(
      `${META_FLOWS_BASE_URL}/${encodeURIComponent(organizationExternalId)}`,
      { method: "GET" }
    );
    const result = await parseApiResponse<unknown>(response, "Failed to fetch Meta Flows");
    if (!result.success) return { success: false, error: result.error };

    return {
      success: true,
      data: normalizeMetaFlowsResponse(result.data),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createMetaFlow(
  organizationExternalId: string,
  flow: CreateMetaFlowPayload
): Promise<ApiResponse<{ data: MetaFlow }>> {
  try {
    const payload =
      flow.type === "CATALOGUE"
        ? {
            organization_id: organizationExternalId,
            name: flow.flow_name,
            description: flow.description || flow.flow_name,
            type: "CATALOGUE",
          }
        : {
            organization_id: organizationExternalId,
            channel_id: flow.channel_id || 1,
            name: flow.flow_name,
            description: flow.description || flow.flow_name,
            type: "META_FLOW",
            meta_flow_id: flow.flow_id,
            flow_message_version: flow.flow_message_version || "3",
            default_screen: flow.default_screen,
            flow_cta: flow.default_cta,
            body_text: flow.body_text || "Let's get started with our new form.",
            status: flow.status || "LIVE",
            is_active: flow.is_active ?? true,
          };

    const response = await fetch(META_FLOWS_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await parseApiResponse<unknown>(response, "Failed to create Meta Flow");
    if (!result.success) return { success: false, error: result.error };

    const responseData = result.data as { data?: FlowbotMetaFlow };
    const createdFlow = responseData?.data || (result.data as FlowbotMetaFlow);

    return {
      success: true,
      data: { data: normalizeMetaFlow(createdFlow) },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function sendMetaFlow(
  payload: SendMetaFlowPayload
): Promise<ApiResponse<SendMetaFlowResponse>> {
  try {
    const response = await fetch(META_FLOW_DISPATCHES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseApiResponse(response, "Failed to send Meta Flow");
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getMetaFlowSubmissions(
  metaFlowRecordId: string,
  filters: MetaFlowSubmissionsFilters = {}
): Promise<ApiResponse<MetaFlowSubmissionsResponse>> {
  try {
    const response = await fetch(
      `${META_FLOW_RECORDS_URL}/${encodeURIComponent(metaFlowRecordId)}/responses`,
      { method: "GET" }
    );
    const result = await parseApiResponse<unknown>(response, "Failed to fetch Meta Flow responses");
    if (!result.success) return { success: false, error: result.error };

    return {
      success: true,
      data: normalizeMetaFlowSubmissionsResponse(result.data, filters),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getMetaFlowSubmission(
  metaFlowRecordId: string,
  submissionId: number | string
): Promise<ApiResponse<{ data: MetaFlowSubmission }>> {
  try {
    const result = await getMetaFlowSubmissions(metaFlowRecordId, { limit: 1000 });
    if (!result.success) return { success: false, error: result.error };

    const submission = result.data?.data.find((item) => String(item.id) === String(submissionId));
    if (!submission) return { success: false, error: "Meta Flow response not found" };

    return { success: true, data: { data: submission } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
