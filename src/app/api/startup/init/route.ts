import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode, DEMO_SCOUT_ID, DEMO_DEAL_ID } from "@/lib/demo/scout-os";

export async function POST(req: NextRequest) {
  const { scout_id, mode } = await req.json();

  if (isDemoMode()) {
    return NextResponse.json({ deal_id: DEMO_DEAL_ID, scout_id: DEMO_SCOUT_ID });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("deals")
    .insert({
      status: "draft",
      source_scout_id: scout_id,
      submission_mode: mode,
      priority: "normal",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create deal" }, { status: 500 });
  }

  return NextResponse.json({ deal_id: data.id, scout_id });
}
