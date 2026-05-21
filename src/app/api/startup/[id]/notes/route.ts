import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

interface NoteBody {
  note_text?: string;
  audio_url?: string;
  note_type: "text" | "voice";
  scout_id?: string;
  duration_seconds?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as NoteBody;

  if (isDemoMode()) {
    return NextResponse.json({ saved: true });
  }

  if (!body.note_text && !body.audio_url) {
    return NextResponse.json({ error: "note_text or audio_url required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { error } = await db.from("scout_notes").insert({
    deal_id: params.id,
    scout_id: body.scout_id ?? null,
    note_text: body.note_text ?? null,
    audio_url: body.audio_url ?? null,
    note_type: body.note_type,
    duration_seconds: body.duration_seconds ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}
