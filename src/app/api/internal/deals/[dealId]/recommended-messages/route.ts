import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import { RECOMMENDED_MESSAGES_SYSTEM_PROMPT, buildRecommendedMessagesUserPrompt } from "@/prompts/partner/recommended-messages.prompt";
import { AI_MODELS } from "@/constants";

interface RecommendedMessage { question: string; reason: string }

export async function GET(_req: NextRequest, { params }: { params: { dealId: string } }) {
  const db = getSupabaseAdmin();

  const [dealRes, tasksRes, foundersRes] = await Promise.all([
    db.from("deals").select("startup_name, one_line_description, category, scout_conviction").eq("id", params.dealId).single(),
    db.from("missing_info_tasks").select("info_needed").eq("deal_id", params.dealId).eq("status", "pending"),
    db.from("founders").select("full_name, background_summary").eq("deal_id", params.dealId),
  ]);

  const deal = dealRes.data;
  if (!deal) return NextResponse.json({ messages: [] });

  const context = `
Startup: ${deal.startup_name ?? "Unknown"} — ${deal.one_line_description ?? ""}
Category: ${deal.category ?? "Unknown"}
Scout conviction: ${deal.scout_conviction ?? "unknown"}
Founders: ${(foundersRes.data ?? []).map((f) => `${f.full_name}${f.background_summary ? ` (${f.background_summary})` : ""}`).join(", ") || "Unknown"}
Missing information: ${(tasksRes.data ?? []).map((t) => t.info_needed).join(", ") || "None"}
`.trim();

  const result = await runStructuredCompletion<{ messages: RecommendedMessage[] }>(
    RECOMMENDED_MESSAGES_SYSTEM_PROMPT,
    buildRecommendedMessagesUserPrompt(context),
    AI_MODELS.nextQuestion
  );

  return NextResponse.json(result);
}
