import { NextRequest, NextResponse } from "next/server";
import { runFollowupAgent } from "@/agents/followup";

// POST /api/internal/tasks/:taskId/remind — send follow-up email for a specific task immediately
export async function POST(_req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const result = await runFollowupAgent(params.taskId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
