import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import { COMMITMENT_EXTRACTION_SYSTEM_PROMPT, buildCommitmentUserPrompt } from "@/prompts/intake/commitment-extraction.prompt";
import { AI_MODELS } from "@/constants";
import type { CommitmentOutput } from "@/types";
import { DEMO_SCOUT_ID } from "@/lib/demo/scout-os";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { body, scout_id } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];
  const scoutId = scout_id ?? DEMO_SCOUT_ID;

  await db.from("deal_messages").insert({
    deal_id: params.id, scout_id: scoutId,
    sender_type: "scout", channel: "web", message_type: "text", body,
  });

  const commitment = await runStructuredCompletion<CommitmentOutput>(
    COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
    buildCommitmentUserPrompt(body, today),
    AI_MODELS.commitment
  );

  if (commitment.has_commitment && commitment.missing_item) {
    await db.from("missing_info_tasks").insert({
      deal_id: params.id, scout_id: scoutId,
      info_needed: commitment.missing_item,
      expected_date: commitment.expected_date,
      followup_date: commitment.followup_date,
      status: "pending",
    });
  }

  const { data: pendingPQ } = await db
    .from("partner_questions")
    .select("id")
    .eq("deal_id", params.id)
    .eq("status", "sent")
    .limit(1)
    .maybeSingle();

  if (pendingPQ) {
    await db.from("partner_questions")
      .update({ status: "answered", answered_at: new Date().toISOString() })
      .eq("id", pendingPQ.id);
  }

  const aiReply = commitment.has_commitment
    ? `Got it — I've noted that. I'll follow up if it's still missing after ${commitment.expected_date}.`
    : "Thanks for the update. Anything else you can share?";

  await db.from("deal_messages").insert({
    deal_id: params.id, sender_type: "ai", channel: "web", message_type: "text", body: aiReply,
  });

  await db.from("scouts").update({ last_active_at: new Date().toISOString() }).eq("id", scoutId);

  return NextResponse.json({ ai_reply: aiReply, commitment_detected: commitment.has_commitment });
}
