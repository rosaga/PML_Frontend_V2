import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v1";
const DEFAULT_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "58045135-f272-4879-be0f-2559d836fdba";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-auth-token") || "";
    let email: string;
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
      if (typeof payload?.email !== "string" || !payload.email.trim()) {
        throw new Error("Missing email claim");
      }
      email = payload.email;
    } catch {
      return NextResponse.json(
        { error: { message: "An access token with an email is required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      group_id,
      template_id,
      template_name,
      language,
      components,
      waba_number,
      whatsapp_api_key,
      phone_number_id,
      category,
      campaign_name,
      parameter_mapping,
      organization_external_id,
      organization_id,
      scheduled_at,
      batch_size,
    } = body;
    
    // Use the organization_id from the request (from context), fallback to default
    const ORGANIZATION_ID = organization_id || DEFAULT_ORGANIZATION_ID;

    if (!group_id) {
      return NextResponse.json(
        { error: { message: "Group ID is required" } },
        { status: 400 }
      );
    }

    if (!template_id && !template_name) {
      return NextResponse.json(
        { error: { message: "Template ID or Template name is required" } },
        { status: 400 }
      );
    }

    if (!waba_number) {
      return NextResponse.json(
        { error: { message: "WABA Number is required" } },
        { status: 400 }
      );
    }

    if (!whatsapp_api_key) {
      return NextResponse.json(
        { error: { message: "WhatsApp API Key is required" } },
        { status: 400 }
      );
    }

    const campaignBody: Record<string, any> = {
      group_id,
      template_id: template_id || template_name,
      template_name: template_name || template_id,
      language: language || "en_US",
      components: components || [],
      waba_number,
      whatsapp_api_key,
      phone_number_id,
      category: category || "MARKETING",
      campaign_name: campaign_name || "",
      parameter_mapping: parameter_mapping || {},
      organization_external_id: organization_external_id || ORGANIZATION_ID,
      organization_id: ORGANIZATION_ID,

      created_by: email,
      updated_by: email,
    };

    if (scheduled_at) campaignBody.scheduled_at = scheduled_at;
    if (batch_size)   campaignBody.batch_size   = batch_size;

    const response = await fetch(
      `${PEAKDATA_BASE_URL}/organization/${ORGANIZATION_ID}/whatsapp/campaign`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campaignBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data.error || "Failed to send campaign messages" } },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ...data,
      created_by: email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}
