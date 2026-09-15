import { NextRequest, NextResponse } from "next/server";

const UPLOAD_API_BASE = "https://api.chatbox.biz/v3";

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting media upload...");
    
    // Get metadata from query parameters
    const fileName = request.nextUrl.searchParams.get("name") || "file";
    const fileType = request.nextUrl.searchParams.get("type") || "application/octet-stream";
    const fileSize = parseInt(request.nextUrl.searchParams.get("size") || "0", 10);
    
    console.log("[v0] File metadata:", { fileName, fileType, fileSize });

    // Get API key from header
    const apiKey = request.headers.get("x-api-key");
    console.log("[v0] API key present:", !!apiKey);

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "Missing API key" } },
        { status: 401 }
      );
    }

    // Step 1: Create upload session
    console.log("[v0] Creating upload session for file:", {
      fileName,
      fileType,
      fileSize,
    });

    const createSessionUrl = new URL(`${UPLOAD_API_BASE}/app/uploads`);
    createSessionUrl.searchParams.set("file_length", fileSize.toString());
    createSessionUrl.searchParams.set("file_type", fileType);

    const sessionHeaders: Record<string, string> = {};
    sessionHeaders["apikey"] = apiKey;

    const sessionResponse = await fetch(createSessionUrl.toString(), {
      method: "POST",
      headers: sessionHeaders,
    });

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
      console.error("[v0] Session creation failed:", sessionData);
      return NextResponse.json(
        { error: { message: "Failed to create upload session" } },
        { status: sessionResponse.status }
      );
    }

    const uploadId = sessionData.id;
    if (!uploadId) {
      console.error("[v0] No upload ID returned");
      return NextResponse.json(
        { error: { message: "No upload ID returned from session" } },
        { status: 400 }
      );
    }

    console.log("[v0] Upload session created:", uploadId);

    // Step 2: Upload the actual file (with chunked upload for large files)
    const fileBuffer = await request.arrayBuffer();
    const uploadUrl = `${UPLOAD_API_BASE}/${uploadId}`;

    console.log("[v0] Uploading file to:", uploadUrl);
    console.log("[v0] File buffer size:", fileBuffer.byteLength);

    const uploadHeaders: Record<string, string> = {};
    uploadHeaders["apikey"] = apiKey;
    uploadHeaders["Content-Type"] = fileType;

    // For large files, use chunked upload
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE);
    
    console.log("[v0] Total chunks:", totalChunks);

    let uploadResponse: Response | null = null;

    if (totalChunks > 1) {
      // Chunked upload for large files
      console.log("[v0] Using chunked upload");
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBuffer.byteLength);
        const chunk = fileBuffer.slice(start, end);

        const chunkHeaders = {
          ...uploadHeaders,
          "Content-Range": `bytes ${start}-${end - 1}/${fileBuffer.byteLength}`,
        };

        console.log(`[v0] Uploading chunk ${i + 1}/${totalChunks}, size: ${end - start} bytes`);

        uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: chunkHeaders,
          body: chunk,
        });

        if (!uploadResponse.ok) {
          console.error(`[v0] Chunk ${i + 1} upload failed with status:`, uploadResponse.status);
          const errorText = await uploadResponse.text();
          console.error(`[v0] Error response:`, errorText);
          return NextResponse.json(
            { error: { message: `Chunk upload failed at part ${i + 1}` } },
            { status: uploadResponse.status }
          );
        }
      }
    } else {
      // Single upload for small files
      console.log("[v0] Using single upload");
      const fileBlob = new Blob([fileBuffer], { type: fileType });

      uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: uploadHeaders,
        body: fileBlob,
      });
    }

    console.log("[v0] Upload response status:", uploadResponse?.status);

    if (!uploadResponse?.ok) {
      console.error("[v0] Upload failed with status:", uploadResponse?.status);
      return NextResponse.json(
        { error: { message: `Upload failed with status ${uploadResponse?.status}` } },
        { status: uploadResponse?.status || 500 }
      );
    }

    // Parse the response
    let uploadData: any;
    try {
      const responseBuffer = await uploadResponse.arrayBuffer();
      const responseText = new TextDecoder().decode(responseBuffer);
      console.log("[v0] Upload response text:", responseText);
      uploadData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[v0] Failed to parse response:", parseError);
      return NextResponse.json(
        { error: { message: "Invalid response from upload server" } },
        { status: 500 }
      );
    }

    if (!uploadData.h) {
      console.error("[v0] No media handle in response:", uploadData);
      return NextResponse.json(
        { error: { message: "No media handle returned from server" } },
        { status: 500 }
      );
    }

    console.log("[v0] File uploaded successfully, media handle:", uploadData.h);

    // Return the media handle
    return NextResponse.json({
      id: uploadData.h,
      handle: uploadData.h,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[v0] Media upload error:", errorMessage);
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A");
    
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 500 }
    );
  }
}
