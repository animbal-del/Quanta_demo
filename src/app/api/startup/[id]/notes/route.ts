import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { resolveScoutId } from "@/lib/supabase/resolve-scout";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  if (!body.note_text && !body.audio_url) {
    return NextResponse.json({ error: "note_text or audio_url required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const scoutId = await resolveScoutId(body.scout_id);

  const { error } = await db.from("scout_notes").insert({
    deal_id: params.id,
    scout_id: scoutId,
    note_text: body.note_text ?? null,
    audio_url: body.audio_url ?? null,
    note_type: body.note_type ?? "text",
    duration_seconds: body.duration_seconds ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}
