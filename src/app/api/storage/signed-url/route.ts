export const dynamic = "force-dynamic";
/**
 * GET /api/storage/signed-url?url={storage_url}
 *
 * Creates a short-lived signed download URL for a private Supabase Storage file.
 * Returns clear error messages for placeholder/missing/invalid files.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const storageUrl = req.nextUrl.searchParams.get("url");

  if (!storageUrl?.trim()) {
    return NextResponse.json({ error: "No file URL provided." }, { status: 400 });
  }

  // Detect placeholder URLs from demo seed data
  if (
    storageUrl.startsWith("placeholder://") ||
    storageUrl.startsWith("http://placeholder") ||
    storageUrl === "#"
  ) {
    return NextResponse.json(
      { error: "This file is a demo placeholder — no real file was uploaded." },
      { status: 404 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Storage is not configured. Check NEXT_PUBLIC_SUPABASE_URL." },
      { status: 503 }
    );
  }

  // Extract bucket and path from:
  //   {supabaseUrl}/storage/v1/object/{bucket}/{path...}
  const objectPrefix = `${supabaseUrl}/storage/v1/object/`;

  if (!storageUrl.startsWith(objectPrefix)) {
    return NextResponse.json(
      { error: "Unrecognised file URL format. Expected a Supabase Storage URL." },
      { status: 400 }
    );
  }

  const rest = storageUrl.slice(objectPrefix.length);
  const slashIdx = rest.indexOf("/");

  if (slashIdx === -1) {
    return NextResponse.json(
      { error: "Could not extract bucket and file path from URL." },
      { status: 400 }
    );
  }

  const bucket = rest.slice(0, slashIdx);
  const path   = rest.slice(slashIdx + 1);

  if (!bucket || !path) {
    return NextResponse.json(
      { error: "Invalid storage URL — bucket or path is empty." },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 3600);

  if (error || !data) {
    const msg = error?.message ?? "";

    // Map Supabase storage errors to friendly messages
    if (msg.includes("not found") || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "File not found in storage. It may have been deleted or never uploaded." },
        { status: 404 }
      );
    }
    if (msg.includes("invalid") || msg.includes("path")) {
      return NextResponse.json(
        { error: "The file path is invalid. The file may not have been uploaded correctly." },
        { status: 400 }
      );
    }
    if (msg.includes("permission") || msg.includes("policy") || msg.includes("denied")) {
      return NextResponse.json(
        { error: "Access denied. Check Supabase Storage RLS policies." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `Could not generate download link: ${msg || "Unknown error"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ signed_url: data.signedUrl });
}
