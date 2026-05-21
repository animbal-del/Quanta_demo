import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationUserPrompt,
} from "@/prompts/intake/question-generation.prompt";
import { AI_MODELS } from "@/constants";
import { isDemoMode } from "@/lib/demo/scout-os";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { extraction } = await req.json();

  if (isDemoMode()) {
    return NextResponse.json({
      questions: [
        "Do you know Rohan's background — has he worked in logistics before?",
        "Who are the 3 logistics operators he spoke with? Are they paying pilots or just conversations?",
        "What does the product actually do — is there a working demo or is it pre-product?",
      ],
    });
  }

  const result = await runStructuredCompletion<{ questions: string[] }>(
    QUESTION_GENERATION_SYSTEM_PROMPT,
    buildQuestionGenerationUserPrompt(JSON.stringify(extraction)),
    AI_MODELS.nextQuestion
  );

  // Store questions on the deal for reference
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
