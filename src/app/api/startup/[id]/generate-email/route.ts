import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runTextCompletion } from "@/lib/openai/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { prompt } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const [dealRes, foundersRes, answersRes] = await Promise.all([
    db.from("deals").select("startup_name, one_line_description, category").eq("id", params.id).single(),
    db.from("founders").select("full_name, email").eq("deal_id", params.id),
    db.from("deal_answers").select("question, answer_text").eq("deal_id", params.id).not("answer_text", "is", null),
  ]);

  const deal = dealRes.data;
  const founders = foundersRes.data ?? [];
  const answers = answersRes.data ?? [];

  const founderName = founders[0]?.full_name ?? "the team";
  const founderEmail = founders[0]?.email ?? "";

  const contextLines = [
    `Startup: ${deal?.startup_name ?? "Unknown"}`,
    `What they do: ${deal?.one_line_description ?? ""}`,
    ...answers.filter((a) => a.answer_text && !a.question.startsWith("Voice") && !a.question.startsWith("Investment") && !a.question.startsWith("Rating")).slice(0, 6).map((a) => `${a.question}: ${a.answer_text}`),
  ].join("\n");

  const systemPrompt = `You write a professional but warm email from a scout to a startup founder.
The scout is following up after meeting the founders or reviewing their materials.
Rules:
- Professional but conversational — not overly formal
- Specific to this startup — use real details from the context
- Short: 3-5 sentences max, plus a clear ask
- Do not use generic phrases like "I hope this email finds you well"
Return ONLY the email body text. No subject line, no "From:", no markdown.`;

  const userPrompt = `Startup context:
${contextLines}

What the scout wants to say:
"${prompt}"

Founder name: ${founderName}
Write the email now.`;

  const email = await runTextCompletion(systemPrompt, userPrompt, "gpt-4o-mini");

  return NextResponse.json({ email: email.trim(), founder_email: founderEmail });
}
