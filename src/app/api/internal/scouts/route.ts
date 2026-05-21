import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

const DEMO_SCOUTS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "Amit Sharma",
    email: "amit@example.com",
    preferred_channel: "telegram",
    status: "active",
    invite_status: "active",
    focus_areas: ["AI", "Developer Tools", "Logistics"],
    last_active_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_checkin_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_email_sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_email_responded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    responsiveness_score: 0.85,
    deal_count: 12,
    high_signal_count: 4,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "Sarah Chen",
    email: "sarah@example.com",
    preferred_channel: "telegram",
    status: "active",
    invite_status: "active",
    focus_areas: ["Consumer", "Fintech", "EdTech"],
    last_active_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    last_checkin_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_email_sent_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_email_responded_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    responsiveness_score: 0.70,
    deal_count: 8,
    high_signal_count: 2,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    full_name: "Jordan Lee",
    email: "jordan@example.com",
    preferred_channel: "slack",
    status: "active",
    invite_status: "active",
    focus_areas: ["Healthcare", "AI", "B2B SaaS"],
    last_active_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    last_checkin_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_email_sent_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_email_responded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    responsiveness_score: 0.90,
    deal_count: 15,
    high_signal_count: 6,
  },
];

export async function GET() {
  if (isDemoMode()) return NextResponse.json(DEMO_SCOUTS);

  const db = getSupabaseAdmin();
  const { data: scouts, error } = await db
    .from("scouts")
    .select("*")
    .order("last_active_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach deal counts
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
