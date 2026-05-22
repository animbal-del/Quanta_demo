export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket") ?? "deal-files";
  const filename = searchParams.get("filename") ?? "upload";
  const dealId = searchParams.get("deal_id") ?? "unknown";

  const ext = filename.split(".").pop() ?? "bin";
  const path = `${dealId}/${Date.now()}.${ext}`;

  const db = getSupabaseAdmin();
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  // Build the storage URL we'll use to reference this file later
  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  return NextResponse.json({
    signed_url: data.signedUrl,
    storage_url: storageUrl,
    path,
    token: data.token,
  });
}
