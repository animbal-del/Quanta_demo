/**
 * resolveScoutId
 *
 * Validates a scout_id against the scouts table before any DB insert.
 * Returns null if the ID doesn't exist — prevents FK constraint violations
 * when localStorage has a stale or invalid scout ID.
 *
 * Priority: request scout_id (if valid) → Supabase session → null
 */
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function resolveScoutId(scoutId: string | null | undefined): Promise<string | null> {
  if (!scoutId) return null;

  const db = getSupabaseAdmin();

  // Verify the scout_id exists in the DB
  const { data } = await db
    .from("scouts")
    .select("id")
    .eq("id", scoutId)
    .maybeSingle();

  if (data?.id) return data.id;

  // Fall back to Supabase session scout
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: scout } = await db
        .from("scouts")
        .select("id")
        .eq("supabase_user_id", user.id)
        .maybeSingle();
      return scout?.id ?? null;
    }
  } catch { /* session unavailable */ }

  return null;
}
