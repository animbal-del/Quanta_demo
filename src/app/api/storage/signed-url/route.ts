/**
 * GET /api/storage/signed-url?url={storage_url}
 *
 * Creates a short-lived signed download URL for any private Supabase Storage file.
 * Files are private by default — direct storage_url links won't work without this.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const storageUrl = req.nextUrl.searchParams.get("url");
  if (!storageUrl) return NextResponse.json({ error: "url param required" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Extract bucket and path from: ${supabaseUrl}/storage/v1/object/{bucket}/{path}
  const objectPrefix = `${supabaseUrl}/storage/v1/object/`;
  if (!storageUrl.startsWith(objectPrefix)) {
    return NextResponse.json({ error: "Unrecognised storage URL format" }, { status: 400 });
  }

  const rest = storageUrl.slice(objectPrefix.length);
  const slashIdx = rest.indexOf("/");
  if (slashIdx === -1) return NextResponse.json({ error: "Cannot extract bucket/path" }, { status: 400 });

  const bucket = rest.slice(0, slashIdx);
  const path = rest.slice(slashIdx + 1);

  const db = getSupabaseAdmin();
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 3600); // 1-hour expiry

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create signed URL" }, { status: 500 });
  }

  return NextResponse.json({ signed_url: data.signedUrl });
}
