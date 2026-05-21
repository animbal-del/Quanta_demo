import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { DEMO_SCOUT_ID } from "@/lib/demo/scout-os";

export async function GET(req: NextRequest) {
  const scout_id = req.nextUrl.searchParams.get("scout_id") ?? DEMO_SCOUT_ID;
  const db = getSupabaseAdmin();

  const { data: deals, error } = await db
    .from("deals")
    .select(`
      id, startup_name, one_line_description, category, status, updated_at,
      missing_info_tasks(id, status),
      partner_questions(id, status)
    `)
    .eq("source_scout_id", scout_id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (deals ?? []).map((d) => ({
      id: d.id,
      startup_name: d.startup_name,
      one_line_description: d.one_line_description,
      category: d.category,
      status: d.status,
      updated_at: d.updated_at,
      missing_count: (d.missing_info_tasks as { id: string; status: string }[] ?? [])
        .filter((t) => t.status === "pending").length,
      has_pending_question: (d.partner_questions as { id: string; status: string }[] ?? [])
        .some((q) => q.status === "sent"),
      next_step: null,
      quanta_activity: null,
    }))
  );
}
