export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { generateBriefForDeal, generateSignalsForDeal } from "@/agents/signals";

// POST — generate brief synchronously and return it directly
export async function POST(_req: NextRequest, { params }: { params: { dealId: string } }) {
  const db = getSupabaseAdmin();

  // Check if signals exist — brief needs deal context signals ideally
  const { data: existingSignals } = await db
    .from("ai_outputs")
    .select("id")
    .eq("deal_id", params.dealId)
    .eq("output_type", "signal_summary")
    .maybeSingle();

  // Generate signals first if missing (brief reads from DB context, not signals directly, but good to have)
  if (!existingSignals) {
    try {
      await generateSignalsForDeal(params.dealId);
    } catch (e) {
      console.error("[brief] Signals generation failed, continuing:", e);
    }
  }

  try {
    const brief = await generateBriefForDeal(params.dealId);
    return NextResponse.json({ brief });
  } catch (err) {
    console.error("[brief] Generation failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
