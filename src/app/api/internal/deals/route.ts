export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { getDemoInboxItems, isDemoMode } from "@/lib/demo/scout-os";
import type { DealInboxItem, DealStatus, DealPriority } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as DealStatus | null;
  const priority = searchParams.get("priority") as DealPriority | null;

  if (isDemoMode()) {
    let items = getDemoInboxItems();
    if (status) items = items.filter((deal) => deal.status === status);
    if (priority) items = items.filter((deal) => deal.priority === priority);
    return NextResponse.json(items);
  }

  const db = getSupabaseAdmin();

  let query = db
    .from("deals")
    .select(`
      id,
      startup_name,
      one_line_description,
      status,
      priority,
      created_at,
      updated_at,
      source_scout_id,
      scouts!source_scout_id(id, full_name)
    `)
    .not("status", "in", '("draft","temp")') // draft/temp are incomplete — never show in team inbox
    .not("startup_name", "is", null)          // unnamed deals are incomplete submissions
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data: deals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach latest signals from ai_outputs
  const dealIds = (deals ?? []).map((d) => d.id);
  const { data: signalOutputs } = await db
    .from("ai_outputs")
    .select("deal_id, output_json")
    .in("deal_id", dealIds)
    .eq("output_type", "signal_summary")
    .order("created_at", { ascending: false });

  const latestSignalByDeal = new Map(
    (signalOutputs ?? []).map((s) => [s.deal_id, s.output_json])
  );

  const inboxItems: DealInboxItem[] = (deals ?? []).map((deal) => ({
    id: deal.id,
    startup_name: deal.startup_name,
    summary: deal.one_line_description,
    status: deal.status as DealStatus,
    priority: deal.priority as DealPriority,
    scout: Array.isArray(deal.scouts)
      ? (deal.scouts[0] as { id: string; full_name: string } | undefined) ?? null
      : (deal.scouts as { id: string; full_name: string } | null),
    signals: latestSignalByDeal.get(deal.id) as DealInboxItem["signals"] ?? null,
    next_action: null,
    created_at: deal.created_at,
    updated_at: deal.updated_at,
  }));

  return NextResponse.json(inboxItems);
}
