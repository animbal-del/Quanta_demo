/**
 * Partner Question Agent
 *
 * Rewrites internal partner questions into scout-friendly messages.
 * Sends via OpenClaw and records in partner_questions table.
 */

import { runStructuredCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/openclaw/client";
import {
  PARTNER_QUESTION_REWRITE_SYSTEM_PROMPT,
  buildPartnerQuestionRewriteUserPrompt,
} from "@/prompts/partner/question-rewrite.prompt";
import { AI_MODELS } from "@/constants";
import type { PartnerQuestionRewrite, Channel } from "@/types";

interface AskScoutInput {
  deal_id: string;
  scout_id: string;
  question_text: string;
  partner_name: string;
}

interface AskScoutOutput {
  sent_message: string;
  partner_question_id: string;
}

export async function runPartnerQuestionAgent(input: AskScoutInput): Promise<AskScoutOutput> {
  const db = getSupabaseAdmin();

  // Load deal and scout context
  const [dealRes, scoutRes] = await Promise.all([
    db.from("deals").select("startup_name").eq("id", input.deal_id).single(),
    db
      .from("scouts")
      .select("full_name, openclaw_user_id, preferred_channel")
      .eq("id", input.scout_id)
      .single(),
  ]);

  const startupName = dealRes.data?.startup_name ?? "this startup";
  const scoutName = scoutRes.data?.full_name ?? "Scout";

  // Rewrite question for scout
  const rewrite = await runStructuredCompletion<PartnerQuestionRewrite>(
    PARTNER_QUESTION_REWRITE_SYSTEM_PROMPT,
    buildPartnerQuestionRewriteUserPrompt(startupName, input.question_text, scoutName),
    AI_MODELS.partnerRewrite
  );

  // Save partner question record
  const { data: pq, error } = await db
    .from("partner_questions")
    .insert({
      deal_id: input.deal_id,
      scout_id: input.scout_id,
      question_text: input.question_text,
      ai_rewritten_message: rewrite.message,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !pq) throw new Error(`Failed to save partner question: ${error?.message}`);

  // Send via OpenClaw if scout has a channel
  if (scoutRes.data?.openclaw_user_id) {
    await sendMessage({
      openclaw_user_id: scoutRes.data.openclaw_user_id,
      channel: (scoutRes.data.preferred_channel ?? "telegram") as Channel,
      message: rewrite.message,
    });

    // Mark as sent
    await db
      .from("partner_questions")
      .update({ status: "sent", asked_at: new Date().toISOString() })
      .eq("id", pq.id);

    // Add to deal thread
    await db.from("deal_messages").insert({
      deal_id: input.deal_id,
      sender_type: "quanta",
      channel: scoutRes.data.preferred_channel as Channel,
      message_type: "text",
      body: rewrite.message,
    });
  }

  return {
    sent_message: rewrite.message,
    partner_question_id: pq.id,
  };
}
