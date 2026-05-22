import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { DEMO_SCOUT_ID } from "@/lib/demo/scout-os";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  let scout_id = req.nextUrl.searchParams.get("scout_id");

  if (!scout_id) {
    const demoScoutId = req.cookies.get("quanta_scout_id")?.value;
    if (demoScoutId) scout_id = demoScoutId;
  }

  const db = getSupabaseAdmin();

  if (!scout_id) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: scout } = await db
          .from("scouts")
          .select("id")
          .eq("supabase_user_id", user.id)
          .maybeSingle();
        scout_id = scout?.id ?? null;
      }
    } catch {
      scout_id = null;
    }
  }

  scout_id = scout_id ?? DEMO_SCOUT_ID;

  const { data: deals, error } = await db
    .from("deals")
    .select(`
      id, startup_name, one_line_description, category, status, updated_at,
      missing_info_tasks(id, status),
      partner_questions(id, status)
    `)
    .eq("source_scout_id", scout_id)
    .neq("status", "temp")        // temp = auto-created, not explicitly saved by scout
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
