import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (isDemoMode()) {
    return NextResponse.json({
      deal: {
        id: params.id,
        startup_name: "FlowOps",
        one_line_description: "AI agents for logistics dispatch automation",
        category: "AI / Logistics",
        scout_conviction: "high",
      },
      founders: [{ full_name: "Rohan" }],
      missing_fields: ["pitch deck", "pilot customer names", "founder background"],
    });
  }

  const db = getSupabaseAdmin();
  const [dealRes, foundersRes, tasksRes] = await Promise.all([
    db.from("deals").select("id, startup_name, one_line_description, category, scout_conviction").eq("id", params.id).single(),
    db.from("founders").select("full_name").eq("deal_id", params.id),
    db.from("missing_info_tasks").select("info_needed").eq("deal_id", params.id).eq("status", "pending"),
  ]);

  return NextResponse.json({
    deal: dealRes.data,
    founders: foundersRes.data ?? [],
    missing_fields: (tasksRes.data ?? []).map((t) => t.info_needed),
  });
}
