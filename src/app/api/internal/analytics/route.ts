import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      totals: { signals: 84, new_deals: 39, needs_info: 18, intro_requested: 7 },
      by_status: [
        { status: "submitted", count: 15 }, { status: "needs_info", count: 18 },
        { status: "under_review", count: 12 }, { status: "intro_requested", count: 7 },
        { status: "monitor", count: 9 }, { status: "archived", count: 23 },
      ],
      top_categories: [
        { category: "AI Agents", count: 22 },
        { category: "Developer Tools", count: 14 },
        { category: "Healthcare AI", count: 11 },
        { category: "Fintech", count: 9 },
      ],
      bottlenecks: [
        { label: "Deck missing", count: 12 },
        { label: "Traction unclear", count: 17 },
        { label: "Founder intro missing", count: 9 },
      ],
      top_scouts: [
        { name: "Jordan Lee", deals: 15, high_signal: 6 },
        { name: "Amit Sharma", deals: 12, high_signal: 4 },
        { name: "Sarah Chen", deals: 8, high_signal: 2 },
      ],
    });
  }

  const db = getSupabaseAdmin();
  const [dealsRes, tasksRes] = await Promise.all([
    db.from("deals").select("status, category"),
    db.from("missing_info_tasks").select("info_needed").eq("status", "pending"),
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

  return NextResponse.json({
    totals: {
      signals: deals.length,
      new_deals: byStatus["submitted"] ?? 0,
      needs_info: byStatus["needs_info"] ?? 0,
      intro_requested: byStatus["intro_requested"] ?? 0,
    },
    by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    top_categories: Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([category, count]) => ({ category, count })),
    bottlenecks: [{ label: "Items pending", count: (tasksRes.data ?? []).length }],
    top_scouts: [],
  });
}
