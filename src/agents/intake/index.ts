/**
 * Scout Intake Agent
 *
 * Entrypoint for all new deal submissions.
 * Called from /api/openclaw/webhook and /api/scout/messages.
 *
 * Flow:
 *   raw message → extract → duplicate check → upsert deal → detect commitment → ask question
 */

import { runStructuredCompletion, runTextCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "@/prompts/intake/extraction.prompt";
import {
  NEXT_QUESTION_SYSTEM_PROMPT,
  buildNextQuestionUserPrompt,
} from "@/prompts/intake/next-question.prompt";
import {
  COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
  buildCommitmentUserPrompt,
} from "@/prompts/intake/commitment-extraction.prompt";
import { AI_MODELS } from "@/constants";
import type {
  ExtractionOutput,
  NextQuestionOutput,
  CommitmentOutput,
  Channel,
  MessageType,
} from "@/types";

interface IntakeInput {
  scout_id: string;
  channel: Channel;
  message_type: MessageType;
  body: string;
  deal_id: string | null;
}

interface IntakeOutput {
  deal_id: string;
  startup_name: string | null;
  ai_reply: string;
  missing_info: string[];
}

export async function runScoutIntakeAgent(input: IntakeInput): Promise<IntakeOutput> {
  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // 1. Load existing deal context if we have a deal_id
  let dealContext: string | null = null;
  if (input.deal_id) {
    const { data: deal } = await db
      .from("deals")
      .select("startup_name, one_line_description, category, scout_conviction")
      .eq("id", input.deal_id)
      .single();

    if (deal) {
      dealContext = JSON.stringify(deal);
    }
  }

  // 2. Extract structured data from scout message
  const extraction = await runStructuredCompletion<ExtractionOutput>(
    EXTRACTION_SYSTEM_PROMPT,
    buildExtractionUserPrompt(input.body, dealContext),
    AI_MODELS.extraction
  );

  // 3. Upsert deal
  let dealId: string | null = input.deal_id;
  if (!dealId) {
    const { data: newDeal, error } = await db
      .from("deals")
      .insert({
        startup_name: extraction.startup_name,
        one_line_description: extraction.one_line_description,
        category: extraction.category,
        source_scout_id: input.scout_id,
        scout_conviction: extraction.scout_conviction,
        source_context: extraction.source_context,
        ai_confidence: extraction.confidence,
        status: extraction.confidence > 0.5 ? "submitted" : "draft",
      })
      .select("id")
      .single();

    if (error || !newDeal) throw new Error(`Failed to create deal: ${error?.message}`);
    dealId = newDeal.id;
  } else {
    await db
      .from("deals")
      .update({
        startup_name: extraction.startup_name ?? undefined,
        one_line_description: extraction.one_line_description ?? undefined,
        scout_conviction: extraction.scout_conviction,
        ai_confidence: extraction.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);
  }

  // 4. Save founder if name found
  if (extraction.founder_names.length > 0 && dealId) {
    for (const name of extraction.founder_names) {
      const { data: existing } = await db
        .from("founders")
        .select("id")
        .eq("deal_id", dealId)
        .eq("full_name", name)
        .maybeSingle();

      if (!existing) {
        await db.from("founders").insert({ deal_id: dealId, full_name: name });
      }
    }
  }

  // 5. Save scout message to thread
  await db.from("deal_messages").insert({
    deal_id: dealId,
    scout_id: input.scout_id,
    sender_type: "scout",
    channel: input.channel,
    message_type: input.message_type,
    body: input.body,
  });

  // 6. Detect date commitments
  const commitment = await runStructuredCompletion<CommitmentOutput>(
    COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
    buildCommitmentUserPrompt(input.body, today),
    AI_MODELS.commitment
  );

  if (commitment.has_commitment && commitment.missing_item && dealId) {
    await db.from("missing_info_tasks").insert({
      deal_id: dealId,
      scout_id: input.scout_id,
      info_needed: commitment.missing_item,
      expected_date: commitment.expected_date,
      followup_date: commitment.followup_date,
      status: "pending",
    });
  }

  // 7. Store AI output for auditability
  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "extraction",
    model_name: AI_MODELS.extraction,
    input_snapshot: { message: input.body, deal_context: dealContext },
    output_json: extraction as unknown as Record<string, unknown>,
  });

  // 8. Decide next question
  const nextQ = await runStructuredCompletion<NextQuestionOutput>(
    NEXT_QUESTION_SYSTEM_PROMPT,
    buildNextQuestionUserPrompt(JSON.stringify(extraction), dealContext),
    AI_MODELS.nextQuestion
  );

  const aiReply =
    nextQ.should_ask_question && nextQ.question
      ? nextQ.question
      : "Got it — I'll keep this on my radar. Let me know if anything else comes up.";

  // 9. Save AI reply to thread
  await db.from("deal_messages").insert({
    deal_id: dealId,
    sender_type: "ai",
    channel: input.channel,
    message_type: "text",
    body: aiReply,
  });

  // 10. Update scout last_active_at
  await db
    .from("scouts")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", input.scout_id);

  return {
    deal_id: dealId!,
    startup_name: extraction.startup_name,
    ai_reply: aiReply,
    missing_info: extraction.missing_fields,
  };
}
