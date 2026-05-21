import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationUserPrompt,
} from "@/prompts/intake/question-generation.prompt";
import { AI_MODELS } from "@/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { extraction } = await req.json();

  const result = await runStructuredCompletion<{ questions: string[] }>(
    QUESTION_GENERATION_SYSTEM_PROMPT,
    buildQuestionGenerationUserPrompt(JSON.stringify(extraction)),
    AI_MODELS.nextQuestion
  );

  const db = getSupabaseAdmin();
  await db.from("ai_outputs").insert({
    deal_id: params.id,
    output_type: "followup_question",
    model_name: AI_MODELS.nextQuestion,
    input_snapshot: { extraction },
    output_json: result as unknown as Record<string, unknown>,
  });

  return NextResponse.json(result);
}
