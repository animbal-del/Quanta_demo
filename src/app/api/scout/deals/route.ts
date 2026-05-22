import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  let scoutId: string | null = null;

  // 1. Explicit query param (most reliable when pages pass it)
  const paramId = req.nextUrl.searchParams.get("scout_id");
  if (paramId && paramId !== "null") scoutId = paramId;

  // 2. Demo cookie (set when user clicks "Explore demo" as scout)
  if (!scoutId) {
    const cookieId = req.cookies.get("quanta_scout_id")?.value;
    if (cookieId) scoutId = cookieId;
  }

  // 3. Real Supabase session
  if (!scoutId) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: scout } = await db
          .from("scouts")
          .select("id")
          .eq("supabase_user_id", user.id)
          .maybeSingle();
        scoutId = scout?.id ?? null;
      }
    } catch { /* session unavailable */ }
  }

  // No scout identified — return empty (never fall back to a hardcoded ID)
  if (!scoutId) {
    return NextResponse.json([]);
  }

  // Verify the scout exists in the DB (prevents FK / empty result issues)
  const { data: scoutCheck } = await db
    .from("scouts")
    .select("id")
    .eq("id", scoutId)
    .maybeSingle();

  if (!scoutCheck) {
    // Scout ID doesn't exist in DB (stale localStorage, demo wipe, etc.)
    return NextResponse.json([]);
  }

  const { data: deals, error } = await db
    .from("deals")
    .select(`
      id, startup_name, one_line_description, category, status, updated_at,
      missing_info_tasks(id, status),
      partner_questions(id, status)
    `)
    .eq("source_scout_id", scoutId)
    .neq("status", "temp")
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
