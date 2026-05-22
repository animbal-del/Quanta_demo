export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET() {
  const db = getSupabaseAdmin();

  const { data: scouts, error } = await db
    .from("scouts")
    .select("*")
    .order("last_active_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const scoutIds = (scouts ?? []).map((s) => s.id);

  const { data: dealCounts } = await db
    .from("deals")
    .select("source_scout_id")
    .in("source_scout_id", scoutIds);

  const countMap = (dealCounts ?? []).reduce<Record<string, number>>((acc, d) => {
    if (d.source_scout_id) acc[d.source_scout_id] = (acc[d.source_scout_id] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json(
    (scouts ?? []).map((s) => ({ ...s, deal_count: countMap[s.id] ?? 0, high_signal_count: 0 }))
  );
}
