import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import { MARKET_ANALYSIS_SYSTEM_PROMPT, buildMarketAnalysisUserPrompt } from "@/prompts/analysis/market-analysis.prompt";
import { generateSignalsForDeal, generateBriefForDeal } from "@/agents/signals";
import { AI_MODELS } from "@/constants";

export async function POST(_req: NextRequest, { params }: { params: { dealId: string } }) {
  // Also regenerate signals + brief if they don't exist (fixes "AI brief not generating" issue)
  const db = getSupabaseAdmin();
  const [existingSignals, existingBrief] = await Promise.all([
    db.from("ai_outputs").select("id").eq("deal_id", params.dealId).eq("output_type", "signal_summary").maybeSingle(),
    db.from("ai_outputs").select("id").eq("deal_id", params.dealId).eq("output_type", "internal_brief").maybeSingle(),
  ]);

  // Run in background — don't wait
  if (!existingSignals.data || !existingBrief.data) {
    Promise.all([
      !existingSignals.data ? generateSignalsForDeal(params.dealId) : Promise.resolve(),
      !existingBrief.data ? generateBriefForDeal(params.dealId) : Promise.resolve(),
    ]).catch((e) => console.error("[analyze] Signals/brief generation failed:", e));
  }

  // Assemble deal context for the prompt
  const [dealRes, foundersRes, messagesRes, signalsRes] = await Promise.all([
    db.from("deals").select("*").eq("id", params.dealId).single(),
    db.from("founders").select("*").eq("deal_id", params.dealId),
    db.from("deal_messages").select("body").eq("deal_id", params.dealId).order("created_at").limit(10),
    db.from("ai_outputs").select("output_json").eq("deal_id", params.dealId)
      .eq("output_type", "signal_summary").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const deal = dealRes.data;
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const dealContext = `
Startup: ${deal.startup_name ?? "Unknown"}
Description: ${deal.one_line_description ?? "Unknown"}
Category: ${deal.category ?? "Unknown"}
Stage: ${deal.stage ?? "Unknown"}
Founders: ${(foundersRes.data ?? []).map((f) => f.full_name).join(", ") || "Unknown"}
Scout conviction: ${deal.scout_conviction ?? "Unknown"}
Signals: ${JSON.stringify(signalsRes.data?.output_json ?? {})}
Conversation excerpts: ${(messagesRes.data ?? []).map((m) => m.body).join(" | ")}
`.trim();

  const analysis = await runStructuredCompletion(
    MARKET_ANALYSIS_SYSTEM_PROMPT,
    buildMarketAnalysisUserPrompt(dealContext),
    AI_MODELS.brief
  );

  // Cache the analysis in ai_outputs
  await db.from("ai_outputs").insert({
    deal_id: params.dealId,
    output_type: "enrichment",
    model_name: AI_MODELS.brief,
    input_snapshot: { deal_context: dealContext },
    output_json: analysis as Record<string, unknown>,
  });

  return NextResponse.json(analysis);
}

// GET — return cached analysis if it exists
export async function GET(_req: NextRequest, { params }: { params: { dealId: string } }) {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from("ai_outputs")
    .select("output_json, created_at")
    .eq("deal_id", params.dealId)
    .eq("output_type", "enrichment")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ cached: false });
  return NextResponse.json({ cached: true, analysis: data.output_json, generated_at: data.created_at });
}
