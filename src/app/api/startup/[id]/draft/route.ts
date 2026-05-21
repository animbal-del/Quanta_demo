import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabaseAdmin();

  const [dealRes, foundersRes, tasksRes] = await Promise.all([
    db.from("deals").select("id, startup_name, one_line_description, category, scout_conviction").eq("id", params.id).single(),
    db.from("founders").select("full_name").eq("deal_id", params.id),
    db.from("missing_info_tasks").select("info_needed").eq("deal_id", params.id).eq("status", "pending"),
  ]);

  return NextResponse.json({
    deal: dealRes.data,
    founders: foundersRes.data ?? [],
    missing_fields: (tasksRes.data ?? []).map((t) => t.info_needed),
  });
}
