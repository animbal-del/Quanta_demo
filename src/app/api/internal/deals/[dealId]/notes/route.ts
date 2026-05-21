import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function POST(req: NextRequest, { params }: { params: { dealId: string } }) {
  const { note, author_name } = await req.json();

  if (!note?.trim()) return NextResponse.json({ error: "note is required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("internal_notes")
    .insert({ deal_id: params.dealId, note: note.trim(), author_name: author_name ?? "Quanta Team", visibility: "internal" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
