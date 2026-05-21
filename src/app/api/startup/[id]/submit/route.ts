import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runPostSubmissionPipeline } from "@/agents/pipeline";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabaseAdmin();

  // Mark as submitted immediately so the scout sees confirmation
  const { error } = await db
    .from("deals")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Run the full multi-agent pipeline in the background (non-blocking)
  // Pipeline: duplicate check → signals + brief + enrichment → label → next action → promote status
  runPostSubmissionPipeline(params.id)
    .then((result) => {
      console.log(`[Submit] Pipeline complete for ${params.id}: ${result.final_status}`);
    })
    .catch((err) => {
      console.error(`[Submit] Pipeline failed for ${params.id}:`, err);
    });

  return NextResponse.json({ deal_id: params.id, status: "submitted" });
}
