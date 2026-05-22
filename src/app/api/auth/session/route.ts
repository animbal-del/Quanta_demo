export const dynamic = "force-dynamic";
/**
 * GET /api/auth/session
 * Returns the current user's session info from Supabase Auth only.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null, user_id: null });
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role ?? null;
  let displayName = user.email ?? "";
  let scoutId: string | null = null;
  let scout = null;

  if (role === "scout") {
    const db = getSupabaseAdmin();
    const { data: scoutData } = await db
      .from("scouts")
      .select("id, full_name, email, focus_areas, responsiveness_score, preferred_channel, last_active_at")
      .eq("supabase_user_id", user.id)
      .single();
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
