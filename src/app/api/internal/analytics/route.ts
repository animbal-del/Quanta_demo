import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET() {
  const db = getSupabaseAdmin();

  const [dealsRes, tasksRes, scoutsRes, recentDealsRes] = await Promise.all([
    db.from("deals").select("id, status, category, source_scout_id, priority, created_at"),
    db.from("missing_info_tasks").select("info_needed").eq("status", "pending"),
    db.from("scouts").select("id, full_name"),
    db.from("deals")
      .select("created_at, status")
      .neq("status", "draft")
      .not("startup_name", "is", null)
      .gte("created_at", new Date(Date.now() - 56 * 86400000).toISOString()),
  ]);

  const deals = (dealsRes.data ?? []).filter((d) => d.status !== "draft");

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

  // Weekly deal submissions — last 8 weeks
  const now = Date.now();
  const weeklyData: { week: string; deals: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now - (i + 1) * 7 * 86400000);
    const weekEnd = new Date(now - i * 7 * 86400000);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = (recentDealsRes.data ?? []).filter((d) => {
      const t = new Date(d.created_at).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    }).length;
    weeklyData.push({ week: label, deals: count });
  }

  // Pipeline ordered by deal flow
  const PIPELINE_ORDER = ["submitted", "needs_info", "under_review", "intro_requested", "monitor", "archived", "rejected"];
  const pipeline = PIPELINE_ORDER.map((status) => ({
    status,
    label: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count: byStatus[status] ?? 0,
  })).filter((p) => p.count > 0);

  return NextResponse.json({
    totals: {
      signals: deals.length,
      new_deals: byStatus["submitted"] ?? 0,
      needs_info: byStatus["needs_info"] ?? 0,
      intro_requested: byStatus["intro_requested"] ?? 0,
    },
    pipeline,
    top_categories: Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([category, count]) => ({ category, count })),
    bottlenecks,
    top_scouts: topScouts,
    weekly_activity: weeklyData,
  });
}
