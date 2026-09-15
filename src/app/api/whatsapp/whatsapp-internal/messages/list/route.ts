import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app";

export async function GET(request: NextRequest) {
  try {
    // Accept either x-organization-id (legacy) or x-organization-external-id (new)
    let organizationId = request.headers.get("x-organization-external-id") || 
                          request.headers.get("x-organization-id");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: { message: "Organization ID is required (x-organization-external-id or x-organization-id header)" } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters to the backend API
    // This allows filters like eq__status, eq__type, eq__category, gte__created_at, lte__created_at, etc.
    const queryParams = new URLSearchParams();
    
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    // Set defaults for pagination if not provided
    if (!queryParams.has("page")) {
      queryParams.set("page", "1");
    }
    if (!queryParams.has("size")) {
      queryParams.set("size", "10");
    }
    
    const url = `${PEAKDATA_BASE_URL}/organization/${organizationId}/wa_message/list?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[API] PeakData list messages error:", data);
      return NextResponse.json(
        { error: { message: data.message || "Failed to fetch messages" } },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API] Messages list error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch messages" } },
      { status: 500 }
    );
  }
}
