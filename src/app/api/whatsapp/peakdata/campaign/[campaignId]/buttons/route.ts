import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId") || "";
    const limit = request.nextUrl.searchParams.get("limit") || "50";
    const offset = request.nextUrl.searchParams.get("offset") || "0";
    const token = request.headers.get("x-auth-token") || "";

    if (!organizationId) {
      return NextResponse.json(
        { error: { message: "organizationId is required" } },
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
      `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationId)}/whatsapp/campaigns/${encodeURIComponent(params.campaignId)}/buttons`
    );
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);

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
      console.error("[campaign buttons] API error:", response.status, text);
      return NextResponse.json(
        { error: { message: "Failed to fetch campaign buttons" } },
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
