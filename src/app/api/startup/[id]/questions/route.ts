export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationUserPrompt,
  FIXED_QUESTIONS,
} from "@/prompts/intake/question-generation.prompt";
import { AI_MODELS } from "@/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { extraction } = await req.json();

  // AI generates ADDITIONAL questions only — fixed questions are always included
  let aiQuestions: string[] = [];
  try {
    const result = await runStructuredCompletion<{ questions: string[] }>(
      QUESTION_GENERATION_SYSTEM_PROMPT,
      buildQuestionGenerationUserPrompt(JSON.stringify(extraction)),
      AI_MODELS.nextQuestion
    );
    aiQuestions = result.questions ?? [];
  } catch {
    // Non-fatal — fixed questions still show
  }

  const db = getSupabaseAdmin();
  await db.from("ai_outputs").insert({
    deal_id: params.id,
    output_type: "followup_question",
    model_name: AI_MODELS.nextQuestion,
    input_snapshot: { extraction },
    output_json: { fixed: FIXED_QUESTIONS.map(q => q.question), ai: aiQuestions },
  }); // intentional fire-and-forget

  return NextResponse.json({
    fixed_questions: FIXED_QUESTIONS,
    ai_questions: aiQuestions,
    // Legacy field for backward compatibility
    questions: [...FIXED_QUESTIONS.map(q => q.question), ...aiQuestions],
  });
}
