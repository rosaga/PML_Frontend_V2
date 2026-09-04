// WhatsApp BSP API Integration - Peak API
// Uses local API routes to avoid CORS issues

export interface ApiConfig {
  apiKey: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken?: string;
}

// Template Types
export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  text?: string;
  example?: {
    header_handle?: string[];
    body_text?: string[][];
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE" | "CATALOG" | "MPM";
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface Template {
  id?: string;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language?: string;
  status?: string;
  components: TemplateComponent[];
}

// Message Types - Based on API Documentation Types 1-8
export interface MessagePayload {
  messaging_product: "whatsapp";
  preview_url?: boolean;
  recipient_type?: "individual" | "INDIVIDUAL";
  to: string;
  type: "text" | "image" | "video" | "document" | "audio" | "template" | "interactive" | "location" | "contacts";
  // Type 1: Text Message
  text?: { body: string };
  // Type 3: Image Message
  image?: { link: string; id?: string; caption?: string };
  // Type 4: Document Message
  document?: { link: string; id?: string; filename?: string; caption?: string };
  // Type 5: Video Message
  video?: { link: string; id?: string; caption?: string };
  // Type 6: Audio Message
  audio?: { link: string; id?: string };
  // Type 7: Location Message
  location?: {
    latitude: string;
    longitude: string;
    name?: string;
    address?: string;
  };
  // Type 8: Template Message
  template?: {
    name: string;
    language: { code: string };
    components?: TemplateMessageComponent[];
  };
  interactive?: InteractiveMessage;
}

export interface TemplateMessageComponent {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: number;
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "image" | "video" | "document" | "currency" | "date_time" | "coupon_code" | "action";
  text?: string;
  image?: { link: string; id?: string };
  video?: { link: string; id?: string };
  document?: { link: string; id?: string };
  coupon_code?: string;
  action?: Record<string, unknown>;
}

export interface InteractiveMessage {
  type: "list" | "button";
  header?: { type: "text"; text: string };
  body: { text: string };
  footer?: { text: string };
  action: {
    button?: string;
    buttons?: Array<{
      type: "reply";
      reply: { id: string; title: string };
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}

// Webhook Types
export interface WebhookConfig {
  webhook_url: string;
  headers?: Record<string, string>;
}

// User Details Types
export interface UserDetails {
  id: string;
  name: string;
  phone_number?: string;
  waba_id?: string;
  business_name?: string;
}

// Pagination Types
export interface PagingCursors {
  before?: string;
  after?: string;
}

export interface TemplateFilters {
  name?: string;
  status?: "APPROVED" | "PENDING" | "REJECTED";
  category?: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  limit?: number;
  before?: string;
  after?: string;
  fields?: string;
}

export interface TemplatesResponse {
  data: Template[];
  paging?: {
    cursors: PagingCursors;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper to build headers for proxy routes
function buildHeaders(
  config: ApiConfig,
  options: {
    includeWaba?: boolean;
    includePhoneNumber?: boolean;
    wabaNumber?: string;
    campaignName?: string;
    organizationId?: string;
  } = {}
) {
  const { includeWaba = true, includePhoneNumber = false, wabaNumber, campaignName, organizationId } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
  };
  if (includeWaba) {
    headers["x-waba-id"] = config.wabaId;
  }
  if (includePhoneNumber) {
    headers["x-phone-number-id"] = config.phoneNumberId;
  }
  if (wabaNumber) {
    headers["x-waba-number"] = wabaNumber;
  }
  if (campaignName) {
    headers["x-campaign-name"] = campaignName;
  }
  if (organizationId) {
    headers["x-organization-id"] = organizationId;
  }
  return headers;
}

// Template Functions
export async function createTemplate(
  config: ApiConfig,
  template: Omit<Template, "id" | "status">
): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch("/api/whatsapp/whatsapp-internal/templates", {
      method: "POST",
      headers: buildHeaders(config, { includeWaba: true }),
      body: JSON.stringify({
        ...template,
        language: template.language || "en_US",
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      // Return the full error object so we can extract user-friendly messages
      return { success: false, error: data.error || "Failed to create template" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getTemplates(
  config: ApiConfig,
  filters?: TemplateFilters
): Promise<ApiResponse<TemplatesResponse>> {
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters?.name) params.set("name", filters.name);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.limit) params.set("limit", filters.limit.toString());
    if (filters?.before) params.set("before", filters.before);
    if (filters?.after) params.set("after", filters.after);
    if (filters?.fields) params.set("fields", filters.fields);
    
    const queryString = params.toString();
    const url = `/api/whatsapp/whatsapp-internal/templates${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to fetch templates" };
    }
    return { success: true, data: { data: data.data || [], paging: data.paging } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Get template by name (the API uses name, not id for individual template fetch)
export async function getTemplateByName(
  config: ApiConfig,
  templateName: string
): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch(`/api/whatsapp/whatsapp-internal/templates?name=${encodeURIComponent(templateName)}`, {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to fetch template" };
    }
    // API returns array, get first match
    const templates = data.data || [];
    if (templates.length === 0) {
      return { success: false, error: "Template not found" };
    }
    return { success: true, data: templates[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getTemplateById(
  config: ApiConfig,
  templateId: string
): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch(`/api/whatsapp/whatsapp-internal/templates/${templateId}`, {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to fetch template" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateTemplate(
  config: ApiConfig,
  templateId: string,
  template: Omit<Template, "id" | "status">
): Promise<ApiResponse<Template>> {
  try {
    const response = await fetch(`/api/whatsapp/whatsapp-internal/templates/${templateId}`, {
      method: "PUT",
      headers: buildHeaders(config, { includeWaba: true }),
      body: JSON.stringify(template),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to update template" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteTemplate(
  config: ApiConfig,
  templateName: string
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/whatsapp/whatsapp-internal/templates/${templateName}`, {
      method: "DELETE",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error?.message || "Failed to delete template" };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Message Functions
export async function sendMessage(
  config: ApiConfig,
  message: MessagePayload,
  options?: { wabaNumber?: string; campaignName?: string; organizationId?: string }
): Promise<ApiResponse<{ messages: Array<{ id: string }> }>> {
  try {
    const response = await fetch("/api/whatsapp/messages", {
      method: "POST",
      headers: buildHeaders(config, {
        includeWaba: false,
        includePhoneNumber: true,
        wabaNumber: options?.wabaNumber,
        campaignName: options?.campaignName,
        organizationId: options?.organizationId,
      }),
      body: JSON.stringify(message),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to send message" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function sendBulkMessages(
  config: ApiConfig,
  recipients: string[],
  message: Omit<MessagePayload, "to">,
  options?: { wabaNumber?: string; campaignName?: string; organizationId?: string }
): Promise<ApiResponse<{ sent: number; failed: number; results: Array<{ to: string; success: boolean; error?: string }> }>> {
  const results: Array<{ to: string; success: boolean; error?: string; messageId?: string }> = [];
  
  for (const recipient of recipients) {
    try {
      const response = await sendMessage(config, { ...message, to: recipient }, options);
      if (response.success) {
        results.push({ to: recipient, success: true, messageId: response.data?.messages[0]?.id });
      } else {
        results.push({ to: recipient, success: false, error: response.error });
      }
    } catch (error) {
      results.push({ to: recipient, success: false, error: String(error) });
    }
  }
  
  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  return { success: true, data: { sent, failed, results } };
}

// User Functions
export async function getUserDetails(config: ApiConfig): Promise<ApiResponse<UserDetails>> {
  try {
    const response = await fetch("/api/whatsapp/user", {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to fetch user details" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getWabaInfo(config: ApiConfig): Promise<ApiResponse<Record<string, unknown>>> {
  try {
    const response = await fetch("/api/whatsapp/user", {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to fetch WABA info" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Webhook Functions
export async function setWebhook(
  config: ApiConfig,
  webhookConfig: WebhookConfig
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/whatsapp/webhook", {
      method: "POST",
      headers: buildHeaders(config, { includeWaba: true }),
      body: JSON.stringify(webhookConfig),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to set webhook" };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getWebhook(config: ApiConfig): Promise<ApiResponse<WebhookConfig>> {
  try {
    const response = await fetch("/api/whatsapp/webhook", {
      method: "GET",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to get webhook" };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteWebhook(config: ApiConfig): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/whatsapp/webhook", {
      method: "DELETE",
      headers: buildHeaders(config, { includeWaba: true }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error?.message || "Failed to delete webhook" };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Media Functions
export async function uploadMedia(
  config: ApiConfig,
  file: File
): Promise<ApiResponse<{ id: string }>> {
  try {
    // Read file as binary and send with metadata in query parameters
    const fileBuffer = await file.arrayBuffer();
    
    const url = new URL("/api/whatsapp/media", window.location.origin);
    url.searchParams.set("name", file.name);
    url.searchParams.set("type", file.type);
    url.searchParams.set("size", file.size.toString());

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
      },
      body: fileBuffer,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to upload media" };
    }
    return { success: true, data: { id: data.id || data.handle } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getMediaUrl(
  config: ApiConfig,
  mediaId: string
): Promise<ApiResponse<{ url: string }>> {
  // TODO: Implement media URL route
  return { success: false, error: "Media URL fetch not yet implemented via proxy" };
}


