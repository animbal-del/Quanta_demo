import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { generateSignalsForDeal, generateBriefForDeal } from "@/agents/signals";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from("deals")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Non-blocking background generation
  Promise.all([
    generateSignalsForDeal(params.id),
    generateBriefForDeal(params.id),
  ]).catch((err) => console.error("Background AI generation failed:", err));

  return NextResponse.json({ deal_id: params.id, status: "submitted" });
}
