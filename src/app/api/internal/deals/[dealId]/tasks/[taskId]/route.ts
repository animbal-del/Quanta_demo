export const dynamic = "force-dynamic";
/**
 * PATCH /api/internal/deals/:dealId/tasks/:taskId
 * Mark a missing_info_task as completed, deferred, or cancelled from the dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

const VALID_STATUSES = ["completed", "deferred", "cancelled", "pending", "stale"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { dealId: string; taskId: string } }
) {
  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Use: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("missing_info_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.taskId)
    .eq("deal_id", params.dealId)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
