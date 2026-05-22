export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { scout_id, mode } = await req.json();
  const db = getSupabaseAdmin();

  // Resolve scout_id: prefer session > request body > null
  // Avoids FK violation when the scout_id in localStorage no longer exists in the DB
  let resolvedScoutId: string | null = null;

  // 1. Try to get from the real Supabase session (most reliable)
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: scout } = await db
        .from("scouts")
        .select("id")
        .eq("supabase_user_id", user.id)
        .maybeSingle();
      if (scout?.id) resolvedScoutId = scout.id;
    }
  } catch { /* session unavailable — fall through */ }

  // 2. Verify the scout_id from the request actually exists in the DB
  if (!resolvedScoutId && scout_id) {
    const { data: scout } = await db
      .from("scouts")
      .select("id")
      .eq("id", scout_id)
      .maybeSingle();
    if (scout?.id) resolvedScoutId = scout.id;
    // If scout_id doesn't exist, resolvedScoutId stays null (allowed — FK is nullable)
  }

  const { data, error } = await db
    .from("deals")
    .insert({
      status: "temp",
      source_scout_id: resolvedScoutId, // null is fine — FK is nullable
      submission_mode: mode,
      priority: "normal",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create deal" }, { status: 500 });
  }

  return NextResponse.json({ deal_id: data.id, scout_id: resolvedScoutId });
}
