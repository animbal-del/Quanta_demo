/**
 * DELETE /api/startup/:id/discard
 * Removes a temp deal that was never saved or submitted.
 * Only deletes if status = 'temp' — never touches real deals.
 * Cascade handles all related records automatically.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabaseAdmin();

  // Only delete if still temp — never touch submitted/draft deals
  const { data: deal } = await db
    .from("deals")
    .select("status")
    .eq("id", params.id)
    .maybeSingle();

  if (!deal || deal.status !== "temp") {
    return NextResponse.json({ skipped: true, reason: "Deal is not temp status" });
  }

  const { error } = await db.from("deals").delete().eq("id", params.id).eq("status", "temp");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discarded: true });
}
