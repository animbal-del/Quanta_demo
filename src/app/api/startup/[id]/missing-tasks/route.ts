/**
 * POST /api/startup/:id/missing-tasks
 * Saves explicit missing info tasks from the scout's "Don't have this yet" selections.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { resolveScoutId } from "@/lib/supabase/resolve-scout";

interface MissingTask {
  info_needed: string;
  expected_date: string | null;
  followup_date: string | null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { tasks, scout_id } = await req.json() as { tasks: MissingTask[]; scout_id?: string };

  if (!tasks?.length) return NextResponse.json({ saved: 0 });

  const db = getSupabaseAdmin();
  const scoutId = await resolveScoutId(scout_id);

  const rows = tasks.map((t) => ({
    deal_id: params.id,
    scout_id: scoutId,
    info_needed: t.info_needed,
    expected_date: t.expected_date || null,
    followup_date: t.followup_date || null,
    status: "pending",
  }));

  const { error } = await db.from("missing_info_tasks").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saved: rows.length });
}
