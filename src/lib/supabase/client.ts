import { createClient } from "@supabase/supabase-js";

function envOrFallback(value: string | undefined, fallback: string) {
  return value && !value.startsWith("TODO_") ? value : fallback;
}

const supabaseUrl = envOrFallback(process.env.NEXT_PUBLIC_SUPABASE_URL, "http://127.0.0.1:54321");
const supabaseAnonKey = envOrFallback(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "demo-anon-key");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (anon key) — for scout-facing pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client (service role key) — for API routes and agents
export function getSupabaseAdmin() {
  if (!supabaseServiceKey || supabaseServiceKey.startsWith("TODO_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required outside demo mode");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
