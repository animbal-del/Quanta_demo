import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { resolveScoutId } from "@/lib/supabase/resolve-scout";

interface Answer {
  question: string;
  answer_text?: string | null;
  answer_audio_url?: string;
  answer_type: "text" | "voice" | "skipped";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { answers, scout_id } = (await req.json()) as { answers: Answer[]; scout_id?: string | null };

  if (!answers?.length) return NextResponse.json({ saved: 0 });

  const db = getSupabaseAdmin();
  const scoutId = await resolveScoutId(scout_id);

  const rows = answers.map((a) => ({
    deal_id: params.id,
    scout_id: scoutId,
    question: a.question,
    answer_text: a.answer_text ?? null,
    answer_audio_url: a.answer_audio_url ?? null,
    answer_type: a.answer_type,
  }));

  const { error } = await db.from("deal_answers").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build conversation messages so both scout and Quanta see Q&A as a real dialogue.
  // Each answered question = Quanta "asks" (system/quanta) + Scout "answers".
  const messages: {
    deal_id: string; scout_id: string | null; sender_type: string;
    channel: string; message_type: string; body: string;
  }[] = [];

  for (const a of answers) {
    // Skip internal special answers (rating, transcripts, etc.)
    if (
      a.question.startsWith("Investment Rating") ||
      a.question.startsWith("Rating") ||
      a.question.startsWith("Voice Transcript") ||
      a.question === "Founder LinkedIn URLs"
    ) continue;

    if (a.answer_type === "skipped" || !a.answer_text) continue;

    const isMissingDate = a.answer_text.startsWith("Missing — expected by");

    // Quanta question (left side of chat)
    messages.push({
      deal_id: params.id, scout_id: null,
      sender_type: "quanta", channel: "web", message_type: "text",
      body: a.question,
    });

    if (isMissingDate) {
      // System reminder for "Don't have this yet" items
      const date = a.answer_text.replace("Missing — expected by ", "");
      messages.push({
        deal_id: params.id, scout_id: null,
        sender_type: "system", channel: "web", message_type: "text",
        body: `📅 Will provide by ${date}. Follow-up reminder scheduled.`,
      });
    } else {
      // Scout answer (right side of chat)
      messages.push({
        deal_id: params.id, scout_id: scoutId,
        sender_type: "scout", channel: "web", message_type: "text",
        body: a.answer_text,
      });
    }
  }

  let messages_saved = 0;
  let messages_error: string | null = null;

  if (messages.length > 0) {
    const { error: msgError } = await db.from("deal_messages").insert(messages);
    if (msgError) {
      messages_error = msgError.message;
      console.error("[answers] deal_messages insert failed:", msgError.message);
    } else {
      messages_saved = messages.length;
    }
  }

  return NextResponse.json({
    saved: rows.length,
    messages_saved,
    messages_error, // null if OK, error string if failed — helps debug
  });
}
