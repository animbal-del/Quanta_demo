import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  const { scout_id, mode } = await req.json();
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("deals")
    // status = 'temp' means auto-created, not explicitly saved — hidden from all views
    // Only changes to 'draft' when scout clicks "Save as Draft"
    .insert({ status: "temp", source_scout_id: scout_id, submission_mode: mode, priority: "normal" })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create deal" }, { status: 500 });
  }

  return NextResponse.json({ deal_id: data.id, scout_id });
}
