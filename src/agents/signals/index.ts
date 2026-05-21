/**
 * Signals Agent
 *
 * Handles all qualitative AI analysis of a deal:
 *   1. Signal extraction — qualitative VC signal cards (no numeric scores)
 *   2. Internal brief — partner-facing deal summary
 *   3. Review label — strong_candidate | worth_exploring | needs_more_info
 *   4. Next action — single specific action for the Quanta team
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
import {
  REVIEW_LABEL_SYSTEM_PROMPT,
  buildReviewLabelUserPrompt,
} from "@/prompts/signals/review-label.prompt";
import {
  NEXT_ACTION_SYSTEM_PROMPT,
  buildNextActionUserPrompt,
} from "@/prompts/signals/next-action.prompt";
import { AI_MODELS } from "@/constants";
import type { SignalOutput, InternalBrief } from "@/types";

// ─── Step 2A: Signal extraction ───────────────────────────────────────────────
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

// ─── Step 2B: Internal brief ──────────────────────────────────────────────────
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

// ─── Step 3: Review label ─────────────────────────────────────────────────────
export async function assignReviewLabel(
  dealId: string,
  signals: SignalOutput
): Promise<"strong_candidate" | "worth_exploring" | "needs_more_info"> {
  const db = getSupabaseAdmin();

  const result = await runStructuredCompletion<{
    label: "strong_candidate" | "worth_exploring" | "needs_more_info";
    reason: string;
  }>(
    REVIEW_LABEL_SYSTEM_PROMPT,
    buildReviewLabelUserPrompt(JSON.stringify(signals, null, 2)),
    "gpt-4o-mini"   // fast model — straightforward classification
  );

  // Write label directly to the deal record
  await db.from("deals").update({ review_label: result.label }).eq("id", dealId);

  // Save reasoning
  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "signal_summary",   // reuse type, differentiate via model_name
    model_name: "review-label-agent",
    input_snapshot: { signals },
    output_json: result as unknown as Record<string, unknown>,
  });

  return result.label;
}

// ─── Step 4: Next action ──────────────────────────────────────────────────────
export async function generateNextAction(
  dealId: string,
  brief: InternalBrief,
  signals: SignalOutput
): Promise<string> {
  const db = getSupabaseAdmin();

  // Build compact context for next action
  const { data: deal } = await db
    .from("deals")
    .select("startup_name, status, scout_conviction")
    .eq("id", dealId)
    .single();

  const { data: pendingTasks } = await db
    .from("missing_info_tasks")
    .select("info_needed")
    .eq("deal_id", dealId)
    .eq("status", "pending");

  const context = `
Startup: ${deal?.startup_name ?? "Unknown"}
Status: ${deal?.status ?? "Unknown"}
Scout conviction: ${deal?.scout_conviction ?? "Unknown"}

Signals:
- Founder: ${signals.founder_signal.level} — ${signals.founder_signal.evidence}
- Traction: ${signals.traction_signal.level} — ${signals.traction_signal.evidence}
- Market: ${signals.market_signal.level}

Missing information: ${(pendingTasks ?? []).map((t) => t.info_needed).join(", ") || "None"}

Brief suggested action: ${brief.suggested_next_action}
Risk flags: ${signals.risk_flags.join(", ")}
`.trim();

  const result = await runStructuredCompletion<{ next_action: string; urgency: string }>(
    NEXT_ACTION_SYSTEM_PROMPT,
    buildNextActionUserPrompt(context),
    "gpt-4o-mini"
  );

  // Save to ai_outputs so it can be retrieved by the inbox/detail pages
  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "followup_question",  // reuse type
    model_name: "next-action-agent",
    input_snapshot: { context },
    output_json: result as unknown as Record<string, unknown>,
  });

  return result.next_action;
}

// ─── Shared: deal context assembly ────────────────────────────────────────────
export async function assembleDealContext(
  dealId: string,
  db: ReturnType<typeof getSupabaseAdmin>
): Promise<string> {
  const [dealRes, foundersRes, messagesRes, filesRes, tasksRes, answersRes] = await Promise.all([
    db.from("deals").select("*").eq("id", dealId).single(),
    db.from("founders").select("*").eq("deal_id", dealId),
    db.from("deal_messages").select("sender_type, body").eq("deal_id", dealId)
      .order("created_at", { ascending: true }).limit(20),
    db.from("deal_files").select("file_name, summary").eq("deal_id", dealId),
    db.from("missing_info_tasks").select("info_needed").eq("deal_id", dealId).eq("status", "pending"),
    db.from("deal_answers").select("question, answer_text").eq("deal_id", dealId),
  ]);

  const deal = dealRes.data;
  const founders = foundersRes.data ?? [];
  const messages = messagesRes.data ?? [];
  const files = filesRes.data ?? [];
  const pendingTasks = tasksRes.data ?? [];
  const answers = answersRes.data ?? [];

  const answersText = answers
    .filter((a) => a.answer_text)
    .map((a) => `Q: ${a.question}\nA: ${a.answer_text}`)
    .join("\n\n");

  return `
Deal: ${deal?.startup_name ?? "Unknown"} — ${deal?.one_line_description ?? "No description"}
Category: ${deal?.category ?? "Unknown"}
Scout Conviction: ${deal?.scout_conviction ?? "Unknown"}

Founders: ${founders.map((f) => f.full_name).join(", ") || "None identified"}

Files uploaded: ${files.map((f) => `${f.file_name} (${f.summary ?? "not summarized"})`).join("; ") || "None"}

Missing information: ${pendingTasks.map((t) => t.info_needed).join(", ") || "None"}

Scout Q&A:
${answersText || "No answers recorded"}

Conversation:
${messages.map((m) => `[${m.sender_type}]: ${m.body}`).join("\n") || "No messages yet"}
`.trim();
}
