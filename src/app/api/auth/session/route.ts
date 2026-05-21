/**
 * GET /api/auth/session
 *
 * Returns the current user's session info — works for both real Supabase
 * sessions and demo-mode sessions (quanta_demo_role cookie).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  // Check demo cookie first
  const demoCookie = req.cookies.get("quanta_demo_role")?.value;
  const demoScoutId = req.cookies.get("quanta_scout_id")?.value;

  if (demoCookie) {
    if (demoCookie === "scout") {
      const scoutId = demoScoutId ?? "11111111-1111-1111-1111-111111111111";
      // Fetch demo scout info from DB
      try {
        const db = getSupabaseAdmin();
        const { data: scout } = await db.from("scouts").select("id, full_name, email, focus_areas, responsiveness_score").eq("id", scoutId).single();
        return NextResponse.json({
          role: "scout",
          is_demo: true,
          user_id: null,
          email: scout?.email ?? "amit@example.com",
          display_name: scout?.full_name ?? "Amit Sharma",
          scout_id: scoutId,
          scout: scout ?? null,
        });
      } catch {
        return NextResponse.json({ role: "scout", is_demo: true, display_name: "Scout", scout_id: scoutId });
      }
    }
    return NextResponse.json({
      role: "quanta",
      is_demo: true,
      user_id: null,
      email: "team@quanta.vc",
      display_name: "Quanta Team",
      scout_id: null,
    });
  }

  // Real Supabase session
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null, is_demo: false, user_id: null });
  }

  const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
  const role = roleData?.role ?? null;

  let displayName = user.email ?? "";
  let scoutId: string | null = null;
  let scout = null;

  if (role === "scout") {
    const { data: scoutData } = await supabase.from("scouts").select("id, full_name, email, focus_areas, responsiveness_score, preferred_channel, last_active_at").eq("supabase_user_id", user.id).single();
    if (scoutData) { displayName = scoutData.full_name; scoutId = scoutData.id; scout = scoutData; }
  }

  return NextResponse.json({
    role,
    is_demo: false,
    user_id: user.id,
    email: user.email,
    display_name: displayName,
    scout_id: scoutId,
    scout,
  });
}
