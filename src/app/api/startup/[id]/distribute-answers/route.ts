/**
 * POST /api/startup/:id/distribute-answers
 *
 * Takes a voice transcript and distributes answers to Q&A fields.
 * Also saves the raw transcript so Quanta team can see it.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT,
  buildTranscriptDistributionUserPrompt,
} from "@/prompts/intake/transcript-distribution.prompt";
import { FIXED_QUESTIONS } from "@/prompts/intake/question-generation.prompt";
import { AI_MODELS } from "@/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { transcript, scout_id } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Save the raw transcript as a deal message so Quanta can see it
  await db.from("deal_messages").insert({
    deal_id: params.id,
    scout_id: scout_id ?? null,
    sender_type: "scout",
    channel: "web",
    message_type: "voice",
    body: `[Voice note] ${transcript}`,
  });

  // Also save as a deal_answer with special key so it's retrievable
  await db.from("deal_answers").insert({
    deal_id: params.id,
    scout_id: scout_id ?? null,
    question: `Voice Transcript (${new Date().toLocaleTimeString()})`,
    answer_text: transcript,
    answer_type: "voice",
  });

  // Build the question map for the AI
  const questionMap: Record<string, string> = {};
  FIXED_QUESTIONS.forEach((q) => { questionMap[q.id] = q.question; });

  // Distribute to answer fields
  const distributed = await runStructuredCompletion<Record<string, string | null>>(
    TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT,
    buildTranscriptDistributionUserPrompt(transcript, questionMap),
    AI_MODELS.nextQuestion
  );

  return NextResponse.json({ distributed });
}
