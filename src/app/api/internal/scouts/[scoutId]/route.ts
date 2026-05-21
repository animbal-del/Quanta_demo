import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(_req: NextRequest, { params }: { params: { scoutId: string } }) {
  const db = getSupabaseAdmin();

  const [scoutRes, dealsRes, emailRes] = await Promise.all([
    db.from("scouts").select("*").eq("id", params.scoutId).single(),
    db.from("deals")
      .select("id, startup_name, one_line_description, status, review_label, updated_at")
      .eq("source_scout_id", params.scoutId)
      .order("updated_at", { ascending: false }),
    db.from("email_correspondence")
      .select("*")
      .eq("scout_id", params.scoutId)
      .order("sent_at", { ascending: false })
      .limit(10),
  ]);

  if (scoutRes.error || !scoutRes.data) {
    return NextResponse.json({ error: "Scout not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...scoutRes.data,
    deals: dealsRes.data ?? [],
    email_history: emailRes.data ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { scoutId: string } }) {
  const body = await req.json();
  const db = getSupabaseAdmin();

  const allowed = ["full_name", "phone", "focus_areas", "preferred_channel", "status"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await db.from("scouts").update(update).eq("id", params.scoutId).select("id, full_name, focus_areas").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
