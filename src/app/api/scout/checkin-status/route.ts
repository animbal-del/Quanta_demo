import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const scoutId = req.nextUrl.searchParams.get("scout_id");
  if (!scoutId) return NextResponse.json({ has_unanswered: false });

  const db = getSupabaseAdmin();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  // Check if there's a recent check-in email with no response
  const { data } = await db
    .from("email_correspondence")
    .select("id, sent_at, response")
    .eq("scout_id", scoutId)
    .eq("email_type", "weekly_checkin")
    .is("responded_at", null)
    .gte("sent_at", threeDaysAgo) // only show if within last 3 days
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ has_unanswered: !!data });
}
