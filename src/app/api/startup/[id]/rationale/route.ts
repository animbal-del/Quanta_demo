/**
 * POST /api/startup/:id/rationale
 *
 * Writes an investment rationale using:
 * - The scout's voice transcript (what they think about the investment)
 * - The actual deal context (Q&A answers, traction numbers, stage, founders)
 *
 * The AI uses real numbers from the context — never placeholders.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runTextCompletion } from "@/lib/openai/client";
import { RATING_OPTIONS } from "@/prompts/intake/question-generation.prompt";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { transcript, rating } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Gather all available context about this startup
  const [dealRes, answersRes, filesRes] = await Promise.all([
    db.from("deals").select("startup_name, one_line_description, category, stage").eq("id", params.id).single(),
    db.from("deal_answers").select("question, answer_text").eq("deal_id", params.id).neq("answer_type", "skipped"),
    db.from("deal_files").select("file_name, summary").eq("deal_id", params.id),
  ]);

  const deal = dealRes.data;
  const answers = (answersRes.data ?? []).filter((a) => a.answer_text && !a.question.startsWith("Voice Transcript"));
  const files = filesRes.data ?? [];

  const ratingLabel = RATING_OPTIONS.find((o) => o.value === rating)?.label ?? "";

  // Build context string from everything we know
  const contextLines = [
    deal?.startup_name && `Company: ${deal.startup_name}`,
    deal?.one_line_description && `What they do: ${deal.one_line_description}`,
    deal?.category && `Category: ${deal.category}`,
    deal?.stage && `Stage: ${deal.stage}`,
    ...answers.map((a) => `${a.question}: ${a.answer_text}`),
    ...files.filter((f) => f.summary).map((f) => `From ${f.file_name}: ${f.summary}`),
  ].filter(Boolean).join("\n");

  const systemPrompt = `You write a concise investment rationale for a startup based on a scout's voice note and the startup's actual data.

RULES:
- Use ONLY real numbers, names, and facts from the startup context below
- Never use placeholders like [insert metric] or [specific number]
- If the scout mentioned something vague, use the real data to make it specific
- Structure: what's compelling first, then risks or unknowns
- 3-5 sentences. First person ("I believe...", "The founders...").
- Do not make up information not present in the context

STARTUP CONTEXT:
${contextLines || "No structured data available — use only what the scout said."}`;

  const userPrompt = `Scout's voice note (rating: ${rating}/4 — ${ratingLabel}):
"${transcript}"

Write the investment rationale using real facts from the startup context above.`;

  const rationale = await runTextCompletion(systemPrompt, userPrompt, "gpt-4o-mini");

  return NextResponse.json({ rationale: rationale.trim() });
}
