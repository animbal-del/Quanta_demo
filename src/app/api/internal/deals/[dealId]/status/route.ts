import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

const VALID_STATUSES = ["draft", "submitted", "needs_info", "under_review", "intro_requested", "monitor", "archived", "rejected"];
const VALID_PRIORITIES = ["low", "normal", "high"];

export async function PATCH(req: NextRequest, { params }: { params: { dealId: string } }) {
  const body = await req.json();
  const db = getSupabaseAdmin();

  const update: Record<string, string> = {};

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.priority) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: `Invalid priority: ${body.priority}` }, { status: 400 });
    }
    update.priority = body.priority;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Provide status or priority to update" }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from("deals")
    .update(update)
    .eq("id", params.dealId)
    .select("id, status, priority")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
