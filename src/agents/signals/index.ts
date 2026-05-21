/**
 * Signal Extraction + Internal Brief Agent
 *
 * Runs on a deal to generate:
 *   1. Qualitative VC-style signals (no numeric scores)
 *   2. Partner-facing internal brief
 *
 * Called after deal submission or when partner opens deal detail view.
 */

import { runStructuredCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import {
  SIGNAL_EXTRACTION_SYSTEM_PROMPT,
  buildSignalExtractionUserPrompt,
} from "@/prompts/signals/signal-extraction.prompt";
import {
  INTERNAL_BRIEF_SYSTEM_PROMPT,
  buildInternalBriefUserPrompt,
} from "@/prompts/briefing/internal-brief.prompt";
import { AI_MODELS } from "@/constants";
import type { SignalOutput, InternalBrief } from "@/types";

export async function generateSignalsForDeal(dealId: string): Promise<SignalOutput> {
  const db = getSupabaseAdmin();

  const dealData = await assembleDealContext(dealId, db);

  const signals = await runStructuredCompletion<SignalOutput>(
    SIGNAL_EXTRACTION_SYSTEM_PROMPT,
    buildSignalExtractionUserPrompt(dealData),
    AI_MODELS.signals
  );

  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "signal_summary",
    model_name: AI_MODELS.signals,
    input_snapshot: { deal_data: dealData },
    output_json: signals as unknown as Record<string, unknown>,
  });

  return signals;
}

export async function generateBriefForDeal(dealId: string): Promise<InternalBrief> {
  const db = getSupabaseAdmin();

  const dealData = await assembleDealContext(dealId, db);

  const brief = await runStructuredCompletion<InternalBrief>(
    INTERNAL_BRIEF_SYSTEM_PROMPT,
    buildInternalBriefUserPrompt(dealData),
    AI_MODELS.brief
  );

  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "internal_brief",
    model_name: AI_MODELS.brief,
    input_snapshot: { deal_data: dealData },
    output_json: brief as unknown as Record<string, unknown>,
  });

  return brief;
}

// Assembles all deal context into a text block for prompt injection
async function assembleDealContext(
  dealId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: ReturnType<typeof getSupabaseAdmin>
): Promise<string> {
  const [dealRes, foundersRes, messagesRes, filesRes, tasksRes] = await Promise.all([
    db.from("deals").select("*").eq("id", dealId).single(),
    db.from("founders").select("*").eq("deal_id", dealId),
    db
      .from("deal_messages")
      .select("sender_type, body, created_at")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true })
      .limit(20),
    db.from("deal_files").select("file_name, summary").eq("deal_id", dealId),
    db
      .from("missing_info_tasks")
      .select("info_needed, status")
      .eq("deal_id", dealId)
      .eq("status", "pending"),
  ]);

  const deal = dealRes.data;
  const founders = foundersRes.data ?? [];
  const messages = messagesRes.data ?? [];
  const files = filesRes.data ?? [];
  const pendingTasks = tasksRes.data ?? [];

  const conversationText = messages
    .map((m) => `[${m.sender_type}]: ${m.body}`)
    .join("\n");

  return `
Deal: ${deal?.startup_name ?? "Unknown"} — ${deal?.one_line_description ?? "No description"}
Category: ${deal?.category ?? "Unknown"}
Scout Conviction: ${deal?.scout_conviction ?? "Unknown"}
Status: ${deal?.status ?? "Unknown"}

Founders: ${founders.map((f) => f.full_name).join(", ") || "None identified"}

Files uploaded: ${files.map((f) => `${f.file_name} (${f.summary ?? "not summarized"})`).join("; ") || "None"}

Missing information:
${pendingTasks.map((t) => `- ${t.info_needed}`).join("\n") || "None"}

Conversation:
${conversationText || "No messages yet"}
`.trim();
}
