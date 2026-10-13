import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId") || "";
    const buttonText = request.nextUrl.searchParams.get("button_text") || "";
    const buttonPayload = request.nextUrl.searchParams.get("button_payload") || "";
    const token = request.headers.get("x-auth-token") || "";

    if (!organizationId) {
      return NextResponse.json(
        { error: { message: "organizationId is required" } },
        { status: 400 }
      );
    }

    if (!buttonText || !buttonPayload) {
      return NextResponse.json(
        { error: { message: "button_text and button_payload are required" } },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: { message: "Authentication token is required" } },
        { status: 401 }
      );
    }

    const url = new URL(
      `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationId)}/whatsapp/campaigns/${encodeURIComponent(params.campaignId)}/button-clicks`
    );
    url.searchParams.set("button_text", buttonText);
    url.searchParams.set("button_payload", buttonPayload);

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      console.error("[campaign button clicks] API error:", response.status, text);
      return NextResponse.json(
        { error: { message: "Failed to fetch button click numbers" } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}
