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
    const response = await fetch(`${BASE_URL}/${wabaId}`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] User GET error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch user details" } },
      { status: 500 }
    );
  }
}
