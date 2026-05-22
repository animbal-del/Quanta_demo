/**
 * POST /api/upload/file
 *
 * Server-side file upload to Supabase Storage.
 * Accepts FormData with the file — no presigned URL needed.
 * Works for files up to ~4MB (Vercel body limit).
 *
 * Returns: { storage_url, path, bucket }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

// All supported MIME types — keep in sync with Supabase bucket policies
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf":                                                           "pdf",
  "application/msword":                                                        "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":   "docx",
  "application/vnd.ms-powerpoint":                                             "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain":                                                                "txt",
  "text/csv":                                                                  "csv",
  "image/jpeg":                                                                "jpg",
  "image/png":                                                                 "png",
  "image/gif":                                                                 "gif",
  "image/webp":                                                                "webp",
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const dealId = formData.get("deal_id") as string | null;
  const bucket = (formData.get("bucket") as string | null) ?? "deal-files";

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!dealId) return NextResponse.json({ error: "deal_id is required." }, { status: 400 });

  // Validate file size (4 MB hard limit — Vercel body is 4.5 MB)
  const MAX_BYTES = 4 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 4 MB for this upload method. Use a PDF or compress the file.` },
      { status: 413 }
    );
  }

  // Determine file extension and MIME type
  const mimeType = file.type || "application/octet-stream";
  const ext = ALLOWED_TYPES[mimeType] ?? file.name.split(".").pop() ?? "bin";
  const path = `${dealId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const db = getSupabaseAdmin();

  // Try with the actual MIME type first
  let uploadResult = await db.storage.from(bucket).upload(path, buffer, { contentType: mimeType, upsert: false });

  // If Supabase rejects the MIME type, retry as octet-stream (bucket has no type restriction on binary)
  if (uploadResult.error?.message?.toLowerCase().includes("mime type") ||
      uploadResult.error?.message?.toLowerCase().includes("not allowed")) {
    uploadResult = await db.storage.from(bucket).upload(path, buffer, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  }

  const { data, error } = uploadResult;

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Upload failed. Check your Supabase Storage bucket settings." },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const storageUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  return NextResponse.json({
    storage_url: storageUrl,
    path,
    bucket,
    file_name: file.name,
    file_type: mimeType,
    size_bytes: file.size,
  });
}
