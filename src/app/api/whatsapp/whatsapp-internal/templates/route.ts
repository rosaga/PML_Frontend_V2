import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://partnersv1.pinbot.ai/v3";

export async function GET(request: NextRequest) {
  const wabaId = request.headers.get("x-waba-id");
  const apiKey = request.headers.get("x-api-key");

  if (!wabaId || !apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-waba-id, x-api-key" } },
      { status: 400 }
    );
  }

  // Get query params for pagination and filtering
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limit = searchParams.get("limit");
  const before = searchParams.get("before");
  const after = searchParams.get("after");
  const fields = searchParams.get("fields");

  // Build query string
  const queryParams = new URLSearchParams();
  if (name) queryParams.set("name", name);
  if (status) queryParams.set("status", status);
  if (category) queryParams.set("category", category);
  if (limit) queryParams.set("limit", limit);
  if (before) queryParams.set("before", before);
  if (after) queryParams.set("after", after);
  if (fields) queryParams.set("fields", fields);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${wabaId}/message_templates${queryString ? `?${queryString}` : ""}`;

  try {
    const headerObj: Record<string, string> = {
      apikey: apiKey,
    };
    
    const response = await fetch(url, {
      method: "GET",
      headers: headerObj,
    });

    const data = await response.json();
    console.log("[API] Templates GET response - first template id:", data?.data?.[0]?.id);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Templates GET error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch templates" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const wabaId = request.headers.get("x-waba-id");
  const apiKey = request.headers.get("x-api-key");

  if (!wabaId || !apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-waba-id, x-api-key" } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    
    // Debug: Log the full request body being sent
    console.log("[v0] Templates POST request body:", JSON.stringify(body, null, 2));
    console.log("[v0] Templates POST components:", JSON.stringify(body.components, null, 2));
    
    const headerObj: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: apiKey,
    };
    
    const response = await fetch(`${BASE_URL}/${wabaId}/message_templates`, {
      method: "POST",
      headers: headerObj,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Log error details for debugging
    if (!response.ok) {
      console.error("[v0] Templates POST error response:", {
        status: response.status,
        error: data.error,
        requestBody: body,
      });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Templates POST error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create template" } },
      { status: 500 }
    );
  }
}
