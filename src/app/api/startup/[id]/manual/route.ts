import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";
import type { ExtractionOutput } from "@/types";

interface ManualFields {
  startup_name: string;
  founder_name: string;
  what_it_does: string;
  why_interesting: string;
  traction: string;
  scout_id?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as ManualFields;

  if (isDemoMode()) {
    const extraction: Partial<ExtractionOutput> = {
      startup_name: body.startup_name || "FlowOps",
      founder_names: body.founder_name ? [body.founder_name] : ["Rohan"],
      one_line_description: body.what_it_does || "AI agents for logistics dispatch",
      why_interesting: body.why_interesting || "Technical founder with early traction",
      traction_mentions: body.traction ? [body.traction] : [],
      scout_conviction: "medium",
      missing_fields: ["pitch deck", "pilot customers"],
      confidence: 0.85,
    };
    return NextResponse.json({ extraction });
  }

  const db = getSupabaseAdmin();

  // Update deal with manual fields directly (no AI needed — scout already structured it)
  await db.from("deals").update({
    startup_name: body.startup_name || null,
    one_line_description: body.what_it_does || null,
    scout_conviction: body.why_interesting ? "medium" : "unknown",
    source_context: "Manual entry",
    status: "draft",
  }).eq("id", params.id);

  if (body.founder_name) {
    await db.from("founders").insert({ deal_id: params.id, full_name: body.founder_name });
  }

  // Save deal message
  const summary = [
    body.startup_name && `Startup: ${body.startup_name}`,
    body.founder_name && `Founder: ${body.founder_name}`,
    body.what_it_does && `What it does: ${body.what_it_does}`,
    body.why_interesting && `Why interesting: ${body.why_interesting}`,
    body.traction && `Traction: ${body.traction}`,
  ].filter(Boolean).join("\n");

  await db.from("deal_messages").insert({
    deal_id: params.id,
    scout_id: body.scout_id,
    sender_type: "scout",
    channel: "web",
    message_type: "text",
    body: summary,
  });

  const missing_fields = [
    !body.what_it_does && "product description",
    !body.why_interesting && "why interesting",
    !body.traction && "traction details",
    "pitch deck",
    "founder contact",
  ].filter(Boolean) as string[];

  return NextResponse.json({
    extraction: {
      startup_name: body.startup_name,
      founder_names: body.founder_name ? [body.founder_name] : [],
      one_line_description: body.what_it_does,
      why_interesting: body.why_interesting,
      traction_mentions: body.traction ? [body.traction] : [],
      scout_conviction: "medium",
      missing_fields,
      confidence: 0.9,
    },
  });
}
