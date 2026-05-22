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

  // Add system messages to the deal thread so Quanta can see what's missing
  const systemMessages = tasks
    .filter((t) => t.expected_date)
    .map((t) => ({
      deal_id: params.id,
      scout_id: scoutId,
      sender_type: "system",
      channel: "web",
      message_type: "text",
      body: `📅 Missing: "${t.info_needed}" — scout will provide by ${t.expected_date}. Reminder set for ${t.followup_date}.`,
    }));

  // Also add a message for items without a date
  const noDates = tasks
    .filter((t) => !t.expected_date)
    .map((t) => ({
      deal_id: params.id,
      scout_id: scoutId,
      sender_type: "system",
      channel: "web",
      message_type: "text",
      body: `⚠️ Still missing: "${t.info_needed}" — no date set yet.`,
    }));

  const allMessages = [...systemMessages, ...noDates];
  if (allMessages.length > 0) {
    await db.from("deal_messages").insert(allMessages);
  }

  return NextResponse.json({ saved: rows.length });
}
