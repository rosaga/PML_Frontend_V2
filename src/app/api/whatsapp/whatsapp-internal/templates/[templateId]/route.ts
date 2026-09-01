import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://partnersv1.pinbot.ai/v3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const wabaId = request.headers.get("x-waba-id");
  const apiKey = request.headers.get("x-api-key");

  if (!wabaId || !apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-waba-id, x-api-key" } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/${wabaId}/message_templates/${templateId}`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Template GET by ID error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch template" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const wabaId = request.headers.get("x-waba-id");
  const apiKey = request.headers.get("x-api-key");

  if (!wabaId || !apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-waba-id, x-api-key" } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/${wabaId}/message_templates/${templateId}`, {
      method: "DELETE",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Template DELETE error:", error);
    return NextResponse.json(
      { error: { message: "Failed to delete template" } },
      { status: 500 }
    );
  }
}

// Edit Template uses POST to /v3/{templateId} (not PUT, and not under wabaid path)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required header: x-api-key" } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // Peak API uses POST method for editing templates, URL is /v3/{templateId}
    const apiUrl = `${BASE_URL}/${templateId}`;
    console.log("[API] Template EDIT - URL:", apiUrl);
    console.log("[API] Template EDIT - Body:", JSON.stringify(body, null, 2));
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("[API] Template EDIT - Response status:", response.status, "data:", JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Template PUT error:", error);
    return NextResponse.json(
      { error: { message: "Failed to update template" } },
      { status: 500 }
    );
  }
}
