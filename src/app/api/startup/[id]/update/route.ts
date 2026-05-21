/**
 * PATCH /api/startup/:id/update
 *
 * Updates extracted fields on a draft deal when the scout edits
 * the AI-autofilled review form (Step 3).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

interface UpdateBody {
  startup_name?: string;
  one_line_description?: string;
  category?: string;
  scout_conviction?: string;
  founder_name?: string;
  why_interesting?: string;
  traction?: string;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as UpdateBody;
  const db = getSupabaseAdmin();

  const dealUpdate: Record<string, string | null> = {};
  if (body.startup_name !== undefined)        dealUpdate.startup_name = body.startup_name || null;
  if (body.one_line_description !== undefined) dealUpdate.one_line_description = body.one_line_description || null;
  if (body.category !== undefined)            dealUpdate.category = body.category || null;
  if (body.scout_conviction !== undefined)    dealUpdate.scout_conviction = body.scout_conviction || null;

  if (Object.keys(dealUpdate).length > 0) {
    dealUpdate.updated_at = new Date().toISOString();
    await db.from("deals").update(dealUpdate).eq("id", params.id);
  }

  // Update founder name if provided
  if (body.founder_name?.trim()) {
    const { data: existing } = await db.from("founders").select("id").eq("deal_id", params.id).maybeSingle();
    if (existing) {
      await db.from("founders").update({ full_name: body.founder_name }).eq("id", existing.id);
    } else {
      await db.from("founders").insert({ deal_id: params.id, full_name: body.founder_name });
    }
  }

  return NextResponse.json({ updated: true });
}
