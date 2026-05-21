import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

const DEMO: Record<string, object> = {
  "11111111-1111-1111-1111-111111111111": {
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "Amit Sharma", email: "amit@example.com",
    phone: "+91 98765 43210", preferred_channel: "Telegram",
    focus_areas: ["AI", "Developer Tools", "Logistics"],
    status: "active", invite_status: "active",
    responsiveness_score: 0.85,
    last_active_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_checkin_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_email_sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_email_responded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: "2026-03-01T00:00:00Z",
    deals: [
      { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", startup_name: "FlowOps", one_line_description: "AI agents for logistics dispatch", status: "needs_info", review_label: "strong_candidate", updated_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "d2", startup_name: "DevLens", one_line_description: "Code review automation for small teams", status: "monitor", review_label: "worth_exploring", updated_at: new Date(Date.now() - 8 * 86400000).toISOString() },
      { id: "d3", startup_name: "PatchOps", one_line_description: "Automated security patching for SaaS infra", status: "archived", review_label: "needs_more_info", updated_at: new Date(Date.now() - 22 * 86400000).toISOString() },
    ],
    email_history: [
      { email_type: "weekly_checkin", subject: "Seen anything interesting lately?", sent_at: new Date(Date.now() - 5 * 86400000).toISOString(), response: "yes_have_startup", responded_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { email_type: "weekly_checkin", subject: "Seen anything interesting lately?", sent_at: new Date(Date.now() - 12 * 86400000).toISOString(), response: "nothing_this_week", responded_at: new Date(Date.now() - 12 * 86400000).toISOString() },
      { email_type: "followup", subject: "Quick follow-up on FlowOps", sent_at: new Date(Date.now() - 14 * 86400000).toISOString(), response: null, responded_at: null },
      { email_type: "invite", subject: "You're invited to Quanta Scout OS", sent_at: "2026-03-01T00:00:00Z", response: "yes_have_startup", responded_at: "2026-03-02T00:00:00Z" },
    ],
  },
};

export async function GET(_req: NextRequest, { params }: { params: { scoutId: string } }) {
  if (isDemoMode()) {
    const d = DEMO[params.scoutId] ?? Object.values(DEMO)[0];
    return NextResponse.json(d);
  }

  const db = getSupabaseAdmin();
  const [scoutRes, dealsRes, emailRes] = await Promise.all([
    db.from("scouts").select("*").eq("id", params.scoutId).single(),
    db.from("deals").select("id, startup_name, one_line_description, status, review_label, updated_at")
      .eq("source_scout_id", params.scoutId).order("updated_at", { ascending: false }),
    db.from("email_correspondence").select("*").eq("scout_id", params.scoutId).order("sent_at", { ascending: false }).limit(10),
  ]);

  if (scoutRes.error) return NextResponse.json({ error: "Scout not found" }, { status: 404 });

  return NextResponse.json({ ...scoutRes.data, deals: dealsRes.data ?? [], email_history: emailRes.data ?? [] });
}
