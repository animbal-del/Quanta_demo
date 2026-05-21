import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET() {
  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: tasks, error } = await db
    .from("missing_info_tasks")
    .select(`*, deals(startup_name), scouts(full_name)`)
    .eq("status", "pending")
    .order("followup_date", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (tasks ?? []).map((t) => ({
      ...t,
      deal_name: (t.deals as { startup_name: string | null } | null)?.startup_name ?? "Unknown",
      scout_name: (t.scouts as { full_name: string } | null)?.full_name ?? "Unknown",
      overdue: t.followup_date ? t.followup_date <= today : false,
    }))
  );
}
