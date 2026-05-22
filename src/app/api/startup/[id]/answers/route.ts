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

  const answered = answers.filter((a) => a.answer_type !== "skipped" && a.answer_text);
  if (answered.length > 0) {
    await db.from("deal_messages").insert(
      answered.map((a) => ({
        deal_id: params.id,
        scout_id: scoutId,
        sender_type: "scout",
        channel: "web",
        message_type: "text",
        body: `Q: ${a.question}\nA: ${a.answer_text}`,
      }))
    ); // non-fatal if thread update fails
  }

  return NextResponse.json({ saved: rows.length });
}
