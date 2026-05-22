import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion, runTextCompletion } from "@/lib/openai/client";
import { resolveScoutId } from "@/lib/supabase/resolve-scout";
import {
  COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
  buildCommitmentUserPrompt,
} from "@/prompts/intake/commitment-extraction.prompt";
import { AI_MODELS } from "@/constants";
import type { CommitmentOutput } from "@/types";

// ─── Scout liaison AI agent ────────────────────────────────────────────────────
// Has full deal context + conversation history. Responds naturally and specifically.
const SCOUT_LIAISON_SYSTEM = `You are Quanta's intelligent scout liaison. Scouts submit startup leads to Quanta Ventures and you follow up with them over chat.

You have complete context about this startup — the founder, traction, what the scout said, what's missing, and the full conversation so far.

Your style:
- Conversational and warm — like texting a smart colleague, not a formal email
- Specific — reference actual details from the deal context and conversation
- Ask ONE thing at a time — never multiple questions in one message
- Short — 1-3 sentences max. Never long paragraphs.
- End conversations gracefully when all info is collected or the scout wraps up

When to close the conversation:
- If the scout provides the last missing piece of info → thank them and close ("Perfect, that's really helpful. We'll take a look and loop you in if we want to move forward.")
- If the scout says they'll follow up later → acknowledge and confirm the follow-up ("Got it, no rush. I'll check back [date] as you mentioned.")
- If no more useful info can be gathered right now → close cleanly and let them know next steps

NEVER say:
- "Thanks for the update. Anything else you can share?" (generic)
- "I appreciate you sharing that." (filler)
- Any combination of multiple questions
- Anything that sounds like a bot template`;

async function buildDealContext(dealId: string, db: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  const [dealRes, foundersRes, answersRes, missingRes, messagesRes] = await Promise.all([
    db.from("deals").select("startup_name, one_line_description, category, stage, scout_conviction").eq("id", dealId).single(),
    db.from("founders").select("full_name, background_summary").eq("deal_id", dealId),
    db.from("deal_answers")
      .select("question, answer_text")
      .eq("deal_id", dealId)
      .not("answer_text", "is", null)
      .not("answer_type", "eq", "skipped"),
    db.from("missing_info_tasks").select("info_needed, expected_date, status").eq("deal_id", dealId).eq("status", "pending"),
    db.from("deal_messages")
      .select("sender_type, body, created_at")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true })
      .limit(30),
  ]);

  const deal = dealRes.data;
  const founders = foundersRes.data ?? [];
  const answers = (answersRes.data ?? []).filter(
    (a) => !a.question.startsWith("Voice Transcript") && !a.question.startsWith("Investment Rating") && !a.question.startsWith("Rating")
  );
  const missing = missingRes.data ?? [];
  const messages = messagesRes.data ?? [];

  const conversationHistory = messages
    .map((m) => {
      const role = m.sender_type === "scout" ? "Scout" : m.sender_type === "ai" ? "AI" : "Quanta";
      return `${role}: ${m.body}`;
    })
    .join("\n");

  return `STARTUP: ${deal?.startup_name ?? "Unknown"} — ${deal?.one_line_description ?? ""}
Category: ${deal?.category ?? "—"} | Stage: ${deal?.stage ?? "—"}
Founders: ${founders.map(f => `${f.full_name}${f.background_summary ? ` (${f.background_summary.slice(0, 80)})` : ""}`).join(", ") || "Unknown"}

WHAT THE SCOUT HAS TOLD US:
${answers.map(a => `• ${a.question}: ${a.answer_text}`).join("\n") || "Nothing yet"}

STILL MISSING (high priority):
${missing.map(m => `• ${m.info_needed}${m.expected_date ? ` — expected by ${m.expected_date}` : ""}`).join("\n") || "Nothing critical missing"}

CONVERSATION HISTORY:
${conversationHistory || "(This is the first message)"}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { body, scout_id } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];
  const scoutId = await resolveScoutId(scout_id);

  // 1. Save the scout's message immediately
  const { error: scoutMsgError } = await db.from("deal_messages").insert({
    deal_id: params.id,
    scout_id: scoutId,
    sender_type: "scout",
    channel: "web",
    message_type: "text",
    body,
  });
  if (scoutMsgError) {
    console.error("[reply] Failed to save scout message:", scoutMsgError.message);
    return NextResponse.json({ error: `Could not save message: ${scoutMsgError.message}` }, { status: 500 });
  }

  // 2–7. AI processing — wrapped so a Groq failure doesn't lose the scout's message
  let aiReply = "Thanks — we'll take a look and follow up if we have questions.";
  let commitmentDetected = false;

  try {
    // 2. Run commitment detection + context building in parallel
    const [commitment, dealContext] = await Promise.all([
      runStructuredCompletion<CommitmentOutput>(
        COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
        buildCommitmentUserPrompt(body, today),
        AI_MODELS.commitment
      ),
      buildDealContext(params.id, db),
    ]);

    commitmentDetected = commitment.has_commitment ?? false;

    // 3. Save commitment as a missing_info_task if detected
    if (commitment.has_commitment && commitment.missing_item) {
      await db.from("missing_info_tasks").insert({
        deal_id: params.id,
        scout_id: scoutId,
        info_needed: commitment.missing_item,
        expected_date: commitment.expected_date,
        followup_date: commitment.followup_date,
        status: "pending",
      });
    }

    // 4. Mark any pending partner question as answered
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

    // 5. Generate a natural, contextual AI reply
    const userPrompt = `${dealContext}

SCOUT'S LATEST MESSAGE: "${body}"

${commitment.has_commitment ? `Note: Scout committed to provide "${commitment.missing_item}" by ${commitment.expected_date}. Acknowledge this specifically and confirm the follow-up date.` : ""}

Reply naturally as Quanta's scout liaison. Be specific to this deal. 1-3 sentences max.`;

    aiReply = await runTextCompletion(SCOUT_LIAISON_SYSTEM, userPrompt, "gpt-4o-mini");
    aiReply = aiReply.trim();

    // 6. Save the AI reply to the conversation
    const { error: aiMsgError } = await db.from("deal_messages").insert({
      deal_id: params.id,
      scout_id: null,
      sender_type: "ai",
      channel: "web",
      message_type: "text",
      body: aiReply,
    });
    if (aiMsgError) console.error("[reply] Failed to save AI reply:", aiMsgError.message);

    // 7. Update scout's last active timestamp
    if (scoutId) {
      await db.from("scouts").update({ last_active_at: new Date().toISOString() }).eq("id", scoutId);
    }
  } catch (aiErr) {
    console.error("[reply] AI step failed (message was saved):", aiErr);
    // Save the fallback reply so the conversation thread isn't broken
    await db.from("deal_messages").insert({
      deal_id: params.id,
      scout_id: null,
      sender_type: "ai",
      channel: "web",
      message_type: "text",
      body: aiReply,
    }).then(({ error }) => { if (error) console.error("[reply] Failed to save fallback reply:", error.message); });
  }

  return NextResponse.json({
    ai_reply: aiReply,
    commitment_detected: commitmentDetected,
  });
}
