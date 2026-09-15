import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v1";
const DEFAULT_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "58045135-f272-4879-be0f-2559d836fdba";

export async function GET(request: NextRequest) {
  try {
    const organizationId =
      request.nextUrl.searchParams.get("organizationId") || DEFAULT_ORGANIZATION_ID;
    const page = request.nextUrl.searchParams.get("page") || "1";
    const limit = request.nextUrl.searchParams.get("limit") || "10";

    const url = `${PEAKDATA_BASE_URL}/whatsapp/campaign/stats/${organizationId}?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      console.error("[campaign/stats] API error:", response.status, text);
      return NextResponse.json(
        { error: { message: "Failed to fetch campaign stats" } },
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
