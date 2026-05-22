export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { runDueFollowups } from "@/agents/followup";
import { runAllCheckins } from "@/agents/checkin";
import { getSupabaseAdmin } from "@/lib/supabase/client";

async function cleanupAbandonedDeals() {
  const db = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago

  // Delete temp deals older than 24h — cascade handles all related records
  // (deal_files, deal_messages, missing_info_tasks, ai_outputs, deal_answers, scout_notes, founders)
  const { data, error } = await db
    .from("deals")
    .delete()
    .eq("status", "temp")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cleanup] Failed to delete abandoned deals:", error.message);
    return { deleted: 0, error: error.message };
  }

  const count = (data ?? []).length;
  if (count > 0) console.log(`[cleanup] Deleted ${count} abandoned temp deal(s)`);
  return { deleted: count };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { job } = body as { job?: string };

  if (job === "cleanup") {
    const result = await cleanupAbandonedDeals();
    return NextResponse.json({ job: "cleanup", ...result });
  }

  if (job === "followups") {
    const result = await runDueFollowups();
    return NextResponse.json({ job: "followups", ...result });
  }

  if (job === "checkins") {
    const result = await runAllCheckins();
    return NextResponse.json({ job: "checkins", ...result });
  }

  if (job === "all") {
    const [followups, checkins, cleanup] = await Promise.all([
      runDueFollowups(),
      runAllCheckins(),
      cleanupAbandonedDeals(),
    ]);
    return NextResponse.json({ followups, checkins, cleanup });
  }

  return NextResponse.json(
    { error: "Invalid job. Use: followups | checkins | cleanup | all" },
    { status: 400 }
  );
}
