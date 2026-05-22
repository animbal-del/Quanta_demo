export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runScoutIntakeAgent } from "@/agents/intake";
import { handleDemoOpenClawWebhook, isDemoMode } from "@/lib/demo/scout-os";
import type { OpenClawWebhookPayload, OpenClawWebhookResponse, Channel } from "@/types";

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as OpenClawWebhookPayload;

  if (isDemoMode()) {
    return NextResponse.json(handleDemoOpenClawWebhook(payload));
  }

  const db = getSupabaseAdmin();

  // Resolve or create scout by openclaw_user_id
  let scout = null;
  const { data: existingScout } = await db
    .from("scouts")
    .select("id, full_name, preferred_channel")
    .eq("openclaw_user_id", payload.openclaw_user_id)
    .maybeSingle();

  if (existingScout) {
    scout = existingScout;
  } else {
    // New unknown scout — create minimal record and ask for name
    const { data: newScout } = await db
      .from("scouts")
      .insert({
        full_name: "Unknown Scout",
        openclaw_channel: payload.channel,
        openclaw_user_id: payload.openclaw_user_id,
        preferred_channel: payload.channel,
        status: "active",
      })
      .select("id, full_name")
      .single();

    scout = newScout;

    const welcomeReply: OpenClawWebhookResponse = {
      reply: "Hey! I don't think we've been introduced. What's your name?",
      agent: "IntakeAgent",
      deal_id: null,
    };
    return NextResponse.json(welcomeReply);
  }

  // Detect intent (simplified — check for active partner question first)
  const { data: activePQ } = await db
    .from("partner_questions")
    .select("id, deal_id")
    .eq("scout_id", scout.id)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activePQ && payload.text) {
    // Scout is replying to a partner question
    await db
      .from("partner_questions")
      .update({ status: "answered", answered_at: new Date().toISOString() })
      .eq("id", activePQ.id);

    await db.from("deal_messages").insert({
      deal_id: activePQ.deal_id,
      scout_id: scout.id,
      sender_type: "scout",
      channel: payload.channel as Channel,
      message_type: "text",
      body: payload.text,
    });

    const response: OpenClawWebhookResponse = {
      reply: "Got it, thanks! I'll pass that along to the team.",
      agent: "PartnerQuestionAgent",
      deal_id: activePQ.deal_id,
    };
    return NextResponse.json(response);
  }

  // Default: run intake agent
  const messageText = payload.text ?? "";
  if (!messageText.trim()) {
    return NextResponse.json({ reply: "I didn't catch that — could you resend?", agent: "IntakeAgent", deal_id: null });
  }

  const result = await runScoutIntakeAgent({
    scout_id: scout.id,
    channel: payload.channel as Channel,
    message_type: payload.message_type ?? "text",
    body: messageText,
    deal_id: null,
  });

  const response: OpenClawWebhookResponse = {
    reply: result.ai_reply,
    agent: "ScoutIntakeAgent",
    deal_id: result.deal_id,
  };
  return NextResponse.json(response);
}
