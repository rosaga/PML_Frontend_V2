import { NextRequest, NextResponse } from "next/server";

const CLOUDINARY_CLOUD_NAME = "dwfj3p42c";
// Use the exact pre-encoded Basic auth from the working curl
const CLOUDINARY_BASIC_AUTH = "NDc0MzE2NTE0OTE0OTM0OjVkd05DRnVhV3d2b2JjNUpWVzY3dWZFdk5VWQ==";

// App Router: configure request body size limit via route segment config
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const publicId = formData.get("public_id") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Determine upload endpoint based on file type
    const mimeType = file.type.toLowerCase();
    let uploadEndpoint = "image";
    
    if (mimeType.startsWith("video/")) {
      uploadEndpoint = "video";
    } else if (mimeType === "application/pdf" || mimeType.startsWith("application/")) {
      uploadEndpoint = "raw";
    }

    // Convert File to Buffer for proper FormData handling
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", new Blob([buffer], { type: file.type }), file.name);
    
    if (publicId) {
      cloudinaryFormData.append("public_id", publicId);
    }

    // Upload to Cloudinary using pre-encoded Basic auth from working curl
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${uploadEndpoint}/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${CLOUDINARY_BASIC_AUTH}`,
        },
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.text();
      console.error("[v0] Cloudinary upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file to Cloudinary" },
        { status: cloudinaryResponse.status }
      );
    }

    const data = await cloudinaryResponse.json();
    
    // Return the secure URL for use in messages
    return NextResponse.json({
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      assetId: data.asset_id,
    });
  } catch (error) {
    console.error("[v0] Cloudinary upload error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
