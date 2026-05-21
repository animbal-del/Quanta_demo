import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { generateSignalsForDeal, generateBriefForDeal } from "@/agents/signals";
import { isDemoMode, DEMO_DEAL_ID } from "@/lib/demo/scout-os";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (isDemoMode()) {
    return NextResponse.json({ deal_id: DEMO_DEAL_ID, status: "submitted" });
  }

  const db = getSupabaseAdmin();

  // Update deal status
  const { error } = await db
    .from("deals")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: generate signals + brief in background
  // These are non-blocking — dashboard will show them when ready
  Promise.all([
    generateSignalsForDeal(params.id),
    generateBriefForDeal(params.id),
  ]).catch((err) => console.error("Background AI generation failed:", err));

  return NextResponse.json({ deal_id: params.id, status: "submitted" });
}
