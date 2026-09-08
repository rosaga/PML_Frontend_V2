import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://partnersv1.pinbot.ai/v3";
const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app";

// Helper to determine message type and category from the request body
function getMessageTypeAndCategory(body: Record<string, unknown>): {
  type: string;
  category: string;
  content: string;
  templateId?: string;
  templateName?: string;
  language?: string;
} {
  const messageType = body.type as string;

  if (messageType === "template") {
    const template = body.template as Record<string, unknown> | undefined;
    return {
      type: "NOTIFICATION",
      category: (template?.category as string)?.toUpperCase() || "UTILITY",
      content: `Template: ${template?.name || "unknown"}`,
      templateId: template?.name as string,
      templateName: template?.name as string,
      language: (template?.language as Record<string, string>)?.code || "en",
    };
  }

  if (messageType === "text") {
    const text = body.text as Record<string, string> | undefined;
    return {
      type: "RESPONSE",
      category: "UTILITY",
      content: text?.body || "",
    };
  }

  if (messageType === "image") {
    const image = body.image as Record<string, string> | undefined;
    const url = image?.link || "";
    const caption = image?.caption || "";
    return {
      type: "NOTIFICATION",
      category: "UTILITY",
      content: url ? `Image:\n${url}${caption ? `\n${caption}` : ""}` : caption || "Image",
    };
  }

  if (messageType === "document") {
    const document = body.document as Record<string, string> | undefined;
    const url = document?.link || "";
    const caption = document?.caption || "";
    return {
      type: "NOTIFICATION",
      category: "UTILITY",
      content: url ? `Document:\n${url}${caption ? `\n${caption}` : ""}` : caption || `Document: ${document?.filename || "uploaded"}`,
    };
  }

  return {
    type: "NOTIFICATION",
    category: "UTILITY",
    content: JSON.stringify(body),
  };
}

// Helper function to generate UUID
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create message record in PeakData database
async function createMessageRecord(params: {
  organizationId: string;
  mobileNo: string;
  wabaNumber: string;
  direction: string;
  type: string;
  category: string;
  content: string;
  templateId?: string;
  templateName?: string;
  language?: string;
  campaignName?: string;
  messageId?: string;
  status: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload: Record<string, any> = {
      organization_external_id: params.organizationId,
      mobile_no: params.mobileNo,
      waba_number: params.wabaNumber,
      direction: params.direction,
      type: params.type,
      category: params.category,
      content: params.content,
      template_id: params.templateId,
      template_name: params.templateName,
      language: params.language,
      campaign_name: params.campaignName,
      status: params.status,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      metadata: params.metadata || { provider: "peak" },
      // Generate MessageID: use WhatsApp message ID if available, otherwise generate a unique one
      message_id: params.messageId || generateUUID(),
    };

    const response = await fetch(
      `${PEAKDATA_BASE_URL}/organization/${params.organizationId}/wa_message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[API] PeakData create message error:", data);
      return { success: false, error: data.message || "Failed to create message record" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[API] PeakData create message error:", error);
    return { success: false, error: "Failed to connect to PeakData API" };
  }
}

export async function POST(request: NextRequest) {
  const phoneNumberId = request.headers.get("x-phone-number-id");
  const apiKey = request.headers.get("x-api-key");
  const organizationId = request.headers.get("x-organization-id");
  const wabaNumber = request.headers.get("x-waba-number") || phoneNumberId; // Use WABA number from header or fallback to phoneNumberId
  const campaignName = request.headers.get("x-campaign-name") || undefined;

  if (!phoneNumberId || !apiKey || !organizationId) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-phone-number-id, x-api-key, x-organization-id" } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const recipientPhone = body.to as string;

    // Extract message type and content
    const { type, category, content, templateId, templateName, language } =
      getMessageTypeAndCategory(body);

    // Step 1: Send message via Peak WhatsApp API
    const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Step 2: Create message record with result (if successful)
    if (response.ok && data.messages?.[0]?.id) {
      const messageId = data.messages[0].id;
      // Create a new record with SENT status and message ID
      await createMessageRecord({
        organizationId,
        mobileNo: recipientPhone,
        wabaNumber: wabaNumber || "",
        direction: "OUTBOUND",
        type,
        category,
        content,
        templateId,
        templateName,
        language,
        campaignName,
        messageId,
        status: "SENT",
        metadata: {
          provider: "peak",
          message_type: body.type,
          whatsapp_response: data,
        },
      });
    } else if (!response.ok) {
      // Create a record with FAILED status
      await createMessageRecord({
        organizationId,
        mobileNo: recipientPhone,
        wabaNumber: wabaNumber || "",
        direction: "OUTBOUND",
        type,
        category,
        content,
        templateId,
        templateName,
        language,
        campaignName,
        status: "FAILED",
        metadata: {
          provider: "peak",
          message_type: body.type,
          error_response: data,
        },
      });

      // Provide helpful error messages for common issues
      if (data?.error?.code === 132001) {
        return NextResponse.json(
          {
            error: {
              message: `Template "${templateName}" does not exist or is not approved for language "${language}". Please verify the template name and that it's been approved.`,
              type: data.error.type,
              code: data.error.code,
            },
          },
          { status: response.status }
        );
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Messages POST error:", error);
    return NextResponse.json(
      { error: { message: "Failed to send message" } },
      { status: 500 }
    );
  }
}
