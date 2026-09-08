import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.chatbox.biz/v3";

// This endpoint fetches user details using only the API key
// Returns WABA ID and Phone Number ID
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "API key is required" } },
        { status: 400 }
      );
    }

    // The user details endpoint from Peak API
    const response = await fetch(`${BASE_URL}/getuserdetails`, {
      method: "GET",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data.error?.message || "Invalid API key" } },
        { status: response.status }
      );
    }

    // Return the user details which should include WABA ID and Phone Number ID
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API] Auth verify error:", error);
    return NextResponse.json(
      { error: { message: "Failed to verify API key" } },
      { status: 500 }
    );
  }
}
