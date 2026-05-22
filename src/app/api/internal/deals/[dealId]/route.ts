import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const db = getSupabaseAdmin();

  // Fetch messages directly via REST API with cache: 'no-store' so Next.js Data Cache
  // never serves a stale copy regardless of SDK-level caching behaviour.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const messagesPromise = fetch(
    `${supabaseUrl}/rest/v1/deal_messages?deal_id=eq.${params.dealId}&order=created_at.asc`,
    {
      cache: "no-store",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
      },
    }
  ).then((r) => r.json()).catch(() => []);

  const [dealRes, foundersRes, filesRes, tasksRes, signalsRes, briefRes, notesRes, pqRes, answersRes, scoutNotesRes, messages] =
    await Promise.all([
      db.from("deals").select("*, scouts!source_scout_id(id, full_name, email)").eq("id", params.dealId).single(),
      db.from("founders").select("*").eq("deal_id", params.dealId),
      db.from("deal_files").select("*").eq("deal_id", params.dealId),
      db.from("missing_info_tasks").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: true }),
      db.from("ai_outputs").select("output_json").eq("deal_id", params.dealId).eq("output_type", "signal_summary").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("ai_outputs").select("output_json").eq("deal_id", params.dealId).eq("output_type", "internal_brief").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("internal_notes").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: false }),
      db.from("partner_questions").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: false }),
      db.from("deal_answers").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: true }),
      db.from("scout_notes").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: false }),
      messagesPromise,
    ]);

  if (dealRes.error || !dealRes.data) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...dealRes.data,
    scout: Array.isArray(dealRes.data.scouts) ? dealRes.data.scouts[0] : dealRes.data.scouts,
    founders: foundersRes.data ?? [],
    messages: Array.isArray(messages) ? messages : [],
    files: filesRes.data ?? [],
    missing_info_tasks: tasksRes.data ?? [],
    signals: signalsRes.data?.output_json ?? null,
    brief: briefRes.data?.output_json ?? null,
    internal_notes: notesRes.data ?? [],
    partner_questions: pqRes.data ?? [],
    deal_answers: answersRes.data ?? [],
    scout_notes: scoutNotesRes.data ?? [],
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
