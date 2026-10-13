"use client";

import type { ApiResponse, MessagePayload } from "./whatsapp-api";

const MESSAGES_URL =
  "https://peakdata-1048592730476.europe-west4.run.app/api/v2/whatsapp/messages";

export interface MetaFlowMessage {
  to: string;
  meta_flow_id: string;
  body_text: string;
  flow_cta: string;
  screen: string;
}

export interface BulkMessageResult {
  to: string;
  success: boolean;
  error?: string;
}

export interface SendMessageResponse {
  data?: {
    message_id?: string;
    status?: string;
    error_description?: string;
  };
  status?: string;
  error_description?: string;
  error_code?: string;
  retryable?: boolean;
  record_id?: number;
  messages?: Array<{ id: string }>;
  message_id?: string;
  message?: string;
}

export interface BulkMessageResponse {
  message?: string;
  results?: BulkMessageResult[];
  sent?: number;
  failed?: number;
}

async function postMessage<T>(
  url: string,
  organizationId: string,
  body: Record<string, unknown> | FormData
): Promise<ApiResponse<T>> {
  if (!organizationId) {
    return { success: false, error: "Organization ID is required." };
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, error: "Please sign in again before sending messages." };
  }

  try {
    const isMultipart = body instanceof FormData;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(!isMultipart ? { "Content-Type": "application/json" } : {}),
      },
      body: isMultipart ? body : JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    const status = typeof data?.status === "string" ? data.status.toLowerCase() : "";
    if (!response.ok || data?.success === false || status === "error" || status === "failed") {
      const error = data?.error_description || data?.error?.message || data?.error || data?.message;
      return {
        success: false,
        error: typeof error === "string" ? error : `Failed to send message (${response.status}).`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function sendMessage(
  organizationId: string,
  message: MessagePayload | MetaFlowMessage
): Promise<ApiResponse<SendMessageResponse>> {
  return postMessage(MESSAGES_URL, organizationId, {
    ...message,
    organization_id: organizationId,
  });
}

export function sendBulkMessages(
  organizationId: string,
  recipients: string[] | File,
  message: Omit<MessagePayload, "to">
): Promise<ApiResponse<BulkMessageResponse>> {
  if (recipients instanceof File) {
    const body = new FormData();
    body.append("organization_id", organizationId);
    body.append("file", recipients);
    body.append("message", JSON.stringify(message));
    return postMessage(`${MESSAGES_URL}/bulk`, organizationId, body);
  }

  return postMessage(`${MESSAGES_URL}/bulk`, organizationId, {
    organization_id: organizationId,
    msisdns: recipients.join(","),
    message,
  });
}
