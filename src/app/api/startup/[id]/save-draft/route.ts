export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

interface SaveDraftBody {
  startup_name?: string;
  one_line_description?: string;
  category?: string;
  scout_conviction?: string;
  founder_name?: string;
  why_interesting?: string;
  traction?: string;
  step_reached?: number;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as SaveDraftBody;
  const db = getSupabaseAdmin();

  const dealUpdate: Record<string, string | number | null> = {
    status: "draft",   // promote from temp → draft (now visible to scout)
    updated_at: new Date().toISOString(),
  };

  if (body.startup_name !== undefined)         dealUpdate.startup_name = body.startup_name || null;
  if (body.one_line_description !== undefined)  dealUpdate.one_line_description = body.one_line_description || null;
  if (body.category !== undefined)             dealUpdate.category = body.category || null;
  if (body.scout_conviction !== undefined)     dealUpdate.scout_conviction = body.scout_conviction || null;

  const { error } = await db.from("deals").update(dealUpdate).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update founder if provided
  if (body.founder_name?.trim()) {
    const { data: existing } = await db.from("founders").select("id").eq("deal_id", params.id).maybeSingle();
    if (existing) {
      await db.from("founders").update({ full_name: body.founder_name }).eq("id", existing.id);
    } else {
      await db.from("founders").insert({ deal_id: params.id, full_name: body.founder_name });
    }
  }

  return NextResponse.json({ saved: true, status: "draft" });
}
