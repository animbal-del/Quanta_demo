export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

interface FounderUpdate {
  id?: string;
  full_name?: string;
  linkedin_url?: string;
  email?: string;
  background_summary?: string;
}

// PATCH — update or add founders for a deal
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { founders } = await req.json() as { founders: FounderUpdate[] };
  if (!founders?.length) return NextResponse.json({ updated: 0 });

  const db = getSupabaseAdmin();

  for (const f of founders) {
    if (f.id) {
      // Update existing founder
      const update: Record<string, string | null | undefined> = {};
      if (f.full_name !== undefined) update.full_name = f.full_name;
      if (f.linkedin_url !== undefined) update.linkedin_url = f.linkedin_url || null;
      if (f.email !== undefined) update.email = f.email || null;
      if (f.background_summary !== undefined) update.background_summary = f.background_summary || null;
      await db.from("founders").update(update).eq("id", f.id);
    } else {
      // Insert new founder
      await db.from("founders").insert({
        deal_id: params.id,
        full_name: f.full_name ?? null,
        linkedin_url: f.linkedin_url || null,
        email: f.email || null,
        background_summary: f.background_summary || null,
      });
    }
  }

  return NextResponse.json({ updated: founders.length });
}
