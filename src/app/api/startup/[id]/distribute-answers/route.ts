import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { resolveScoutId } from "@/lib/supabase/resolve-scout";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT,
  buildTranscriptDistributionUserPrompt,
} from "@/prompts/intake/transcript-distribution.prompt";
import { FIXED_QUESTIONS } from "@/prompts/intake/question-generation.prompt";
import { AI_MODELS } from "@/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { transcript, scout_id, existing_answers } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const scoutId = await resolveScoutId(scout_id);

  await db.from("deal_messages").insert({
    deal_id: params.id,
    scout_id: scoutId,
    sender_type: "scout",
    channel: "web",
    message_type: "voice",
    body: `[Voice note] ${transcript}`,
  });

  await db.from("deal_answers").insert({
    deal_id: params.id,
    scout_id: scoutId,
    question: `Voice Transcript (${new Date().toLocaleTimeString()})`,
    answer_text: transcript,
    answer_type: "voice",
  });

  const questionMap: Record<string, string> = {};
  FIXED_QUESTIONS.forEach((q) => { questionMap[q.id] = q.question; });

  const distributed = await runStructuredCompletion<Record<string, string | null>>(
    TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT,
    buildTranscriptDistributionUserPrompt(transcript, questionMap, existing_answers ?? {}),
    AI_MODELS.nextQuestion
  );

  return NextResponse.json({ distributed });
}
