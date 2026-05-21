import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

const DEMO_TASKS = [
  {
    id: "t1",
    deal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    deal_name: "FlowOps",
    scout_name: "Amit Sharma",
    info_needed: "Pitch deck",
    expected_date: "2026-05-22",
    followup_date: "2026-05-23",
    status: "pending",
    reminder_count: 0,
    overdue: true,
  },
  {
    id: "t4",
    deal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    deal_name: "CampusPay",
    scout_name: "Sarah Chen",
    info_needed: "User count / traction numbers",
    expected_date: null,
    followup_date: null,
    status: "pending",
    reminder_count: 0,
    overdue: false,
  },
  {
    id: "t5",
    deal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    deal_name: "FlowOps",
    scout_name: "Amit Sharma",
    info_needed: "Pilot customer details",
    expected_date: null,
    followup_date: null,
    status: "pending",
    reminder_count: 0,
    overdue: false,
  },
];

export async function GET() {
  if (isDemoMode()) return NextResponse.json(DEMO_TASKS);

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: tasks, error } = await db
    .from("missing_info_tasks")
    .select(`
      *,
      deals(startup_name),
      scouts(full_name)
    `)
    .eq("status", "pending")
    .order("followup_date", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (tasks ?? []).map((t) => ({
      ...t,
      deal_name: (t.deals as { startup_name: string | null } | null)?.startup_name ?? "Unknown",
      scout_name: (t.scouts as { full_name: string } | null)?.full_name ?? "Unknown",
      overdue: t.followup_date ? t.followup_date <= today : false,
    }))
  );
}
