import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode, DEMO_SCOUT_ID } from "@/lib/demo/scout-os";

const DEMO_DEALS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    startup_name: "FlowOps",
    one_line_description: "AI agents for logistics dispatch automation",
    category: "AI / Logistics",
    status: "needs_info",
    has_pending_question: false,
    missing_count: 3,
    next_step: "Deck expected May 22",
    quanta_activity: "Not reviewed yet",
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    startup_name: "DevLens",
    one_line_description: "Code review automation for small engineering teams",
    category: "Developer Tools",
    status: "under_review",
    has_pending_question: true,
    missing_count: 1,
    next_step: "Quanta asked about traction",
    quanta_activity: "Question sent",
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    startup_name: "MedSync AI",
    one_line_description: "AI-powered patient scheduling",
    category: "Healthcare AI",
    status: "monitor",
    has_pending_question: false,
    missing_count: 0,
    next_step: null,
    quanta_activity: "In review",
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const scout_id = req.nextUrl.searchParams.get("scout_id") ?? DEMO_SCOUT_ID;

  if (isDemoMode()) return NextResponse.json(DEMO_DEALS);

  const db = getSupabaseAdmin();
  const { data: deals, error } = await db
    .from("deals")
    .select(`
      id, startup_name, one_line_description, category, status, updated_at,
      missing_info_tasks(count),
      partner_questions(id, status)
    `)
    .eq("source_scout_id", scout_id)
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
      missing_count: (d.missing_info_tasks as unknown as { count: number }[])?.[0]?.count ?? 0,
      has_pending_question: (d.partner_questions as { status: string }[] ?? []).some((q) => q.status === "sent"),
      next_step: null,
      quanta_activity: null,
    }))
  );
}
