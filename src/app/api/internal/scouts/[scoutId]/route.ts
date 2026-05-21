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
