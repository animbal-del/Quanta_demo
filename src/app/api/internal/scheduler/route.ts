import { NextRequest, NextResponse } from "next/server";
import { runDueFollowups } from "@/agents/followup";
import { runAllCheckins } from "@/agents/checkin";
import { isDemoMode, runDemoScheduler } from "@/lib/demo/scout-os";

export async function POST(req: NextRequest) {
  const { job } = await req.json();

  if (isDemoMode()) {
    const result = runDemoScheduler(job);
    if (result) return NextResponse.json(result);
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
    const [followups, checkins] = await Promise.all([runDueFollowups(), runAllCheckins()]);
    return NextResponse.json({ followups, checkins });
  }

  return NextResponse.json({ error: "Invalid job. Use: followups | checkins | all" }, { status: 400 });
}
