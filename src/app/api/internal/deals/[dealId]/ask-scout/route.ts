export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { runPartnerQuestionAgent } from "@/agents/partner";
import { askScoutDemo, isDemoMode } from "@/lib/demo/scout-os";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import type { AskScoutRequest } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const body = (await req.json()) as AskScoutRequest;

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json(askScoutDemo(body.question));
  }

  const db = getSupabaseAdmin();
  const { data: deal, error } = await db
    .from("deals")
    .select("source_scout_id")
    .eq("id", params.dealId)
    .single();

  if (error || !deal?.source_scout_id) {
    return NextResponse.json({ error: error?.message ?? "Deal scout not found" }, { status: 404 });
  }

  const result = await runPartnerQuestionAgent({
    deal_id: params.dealId,
    scout_id: deal.source_scout_id,
    question_text: body.question,
    partner_name: body.partner_name,
  });

  return NextResponse.json(result);
}
