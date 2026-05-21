import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET() {
  const db = getSupabaseAdmin();

  const [dealsRes, tasksRes, scoutsRes] = await Promise.all([
    db.from("deals").select("status, category, source_scout_id, priority"),
    db.from("missing_info_tasks").select("info_needed").eq("status", "pending"),
    db.from("scouts").select("id, full_name"),
  ]);

  const deals = dealsRes.data ?? [];

  const byStatus = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const byCategory = deals.reduce<Record<string, number>>((acc, d) => {
    if (d.category) acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  const byScout = deals.reduce<Record<string, number>>((acc, d) => {
    if (d.source_scout_id) acc[d.source_scout_id] = (acc[d.source_scout_id] ?? 0) + 1;
    return acc;
  }, {});

  const scoutMap = Object.fromEntries((scoutsRes.data ?? []).map((s) => [s.id, s.full_name]));

  const topScouts = Object.entries(byScout)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: scoutMap[id] ?? "Unknown", deals: count, high_signal: 0 }));

  const bottleneckCounts = (tasksRes.data ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.info_needed] = (acc[t.info_needed] ?? 0) + 1;
    return acc;
  }, {});

  const bottlenecks = Object.entries(bottleneckCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  return NextResponse.json({
    totals: {
      signals: deals.length,
      new_deals: byStatus["submitted"] ?? 0,
      needs_info: byStatus["needs_info"] ?? 0,
      intro_requested: byStatus["intro_requested"] ?? 0,
    },
    by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    top_categories: Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([category, count]) => ({ category, count })),
    bottlenecks,
    top_scouts: topScouts,
  });
}
