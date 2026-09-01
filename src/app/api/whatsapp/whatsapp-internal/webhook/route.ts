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

  try {
    const response = await fetch(`${BASE_URL}/${wabaId}/webhooks`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Webhook GET error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch webhooks" } },
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
    const response = await fetch(`${BASE_URL}/${wabaId}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Webhook POST error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create webhook" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const wabaId = request.headers.get("x-waba-id");
  const apiKey = request.headers.get("x-api-key");

  if (!wabaId || !apiKey) {
    return NextResponse.json(
      { error: { message: "Missing required headers: x-waba-id, x-api-key" } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/${wabaId}/webhooks`, {
      method: "DELETE",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Webhook DELETE error:", error);
    return NextResponse.json(
      { error: { message: "Failed to delete webhook" } },
      { status: 500 }
    );
  }
}
