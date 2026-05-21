import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/scout-os";

const DEMO_DEALS: Record<string, object> = {
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    startup_name: "FlowOps",
    one_line_description: "AI agents for logistics dispatch automation",
    category: "AI / Logistics",
    stage: "Pre-seed",
    status: "needs_info",
    priority: "high",
    scout_conviction: "high",
    source_context: "Purdue Hackathon",
    submission_mode: "voice",
    scout: { id: "11111111-1111-1111-1111-111111111111", full_name: "Amit Sharma", email: "amit@example.com" },
    founders: [{ full_name: "Rohan Mehta", linkedin_url: null, background_summary: "Technical founder. Fast-moving, logistics domain knowledge." }],
    signals: {
      founder_signal: { level: "strong", evidence: "Scout described founder as technical and fast-moving with 3 pilot conversations." },
      market_signal: { level: "unclear", evidence: "Logistics dispatch mentioned but market size not confirmed." },
      traction_signal: { level: "early", evidence: "3 pilot conversations with operators — no signed customers yet." },
      scout_conviction: { level: "high", evidence: "Scout proactively submitted and highlighted founder quality." },
      risk_flags: ["No deck yet", "No customer names confirmed", "Founder background unverified"],
    },
    brief: {
      brief_title: "FlowOps: AI agents for logistics dispatch",
      what_it_does: "FlowOps automates dispatch workflows for small to mid-size logistics teams using AI agents.",
      why_it_may_matter: "Scout described the founder as unusually technical and fast-moving, with early operator traction in a fragmented market.",
      known_facts: ["Met at Purdue hackathon", "Founder: Rohan Mehta", "3 pilot conversations with logistics operators"],
      open_questions: ["Who are the pilot customers?", "Does Rohan have logistics domain experience?", "Is there a working product demo?"],
      suggested_next_action: "Ask scout for founder intro and pilot customer details before requesting deck.",
    },
    missing_info_tasks: [
      { id: "t1", info_needed: "Pitch deck", expected_date: "2026-05-22", followup_date: "2026-05-23", status: "pending" },
      { id: "t2", info_needed: "Pilot customer details", expected_date: null, followup_date: null, status: "pending" },
      { id: "t3", info_needed: "Founder intro", expected_date: null, followup_date: null, status: "pending" },
    ],
    messages: [
      { sender_type: "scout", body: "Met Rohan at Purdue hackathon. He's building FlowOps, AI agents for logistics dispatch. No deck yet but 3 pilot conversations.", created_at: "2026-05-18T10:00:00Z" },
      { sender_type: "ai", body: "Got it. What made FlowOps stand out to you?", created_at: "2026-05-18T10:01:00Z" },
      { sender_type: "scout", body: "Rohan seemed very technical and fast-moving. Already spoken to 3 logistics operators.", created_at: "2026-05-18T10:05:00Z" },
      { sender_type: "ai", body: "Helpful. Do you know when you can get the deck or founder intro?", created_at: "2026-05-18T10:06:00Z" },
      { sender_type: "scout", body: "I can get the deck by May 22.", created_at: "2026-05-18T10:10:00Z" },
      { sender_type: "ai", body: "Perfect. I'll check back after May 22 if it's still missing.", created_at: "2026-05-18T10:11:00Z" },
    ],
    partner_questions: [],
    internal_notes: [],
    files: [],
  },
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    startup_name: "CampusPay",
    one_line_description: "Payments platform for campus clubs and student organizations",
    category: "Fintech",
    stage: "Pre-seed",
    status: "under_review",
    priority: "normal",
    scout_conviction: "medium",
    source_context: "University network",
    submission_mode: "manual",
    scout: { id: "22222222-2222-2222-2222-222222222222", full_name: "Sarah Chen", email: "sarah@example.com" },
    founders: [{ full_name: "Priya Nair", linkedin_url: "https://linkedin.com/in/priyanair", background_summary: "Former PM at Stripe. Building payments for underserved campus organizations." }],
    signals: {
      founder_signal: { level: "medium", evidence: "Former Stripe PM — relevant payments background." },
      market_signal: { level: "medium", evidence: "Clear pain point, but campus market is small and fragmented." },
      traction_signal: { level: "weak", evidence: "Need user count and transaction volume to evaluate." },
      scout_conviction: { level: "medium", evidence: "Scout submitted but without strong conviction language." },
      risk_flags: ["Small addressable market", "No traction numbers provided", "Stripe alumni bias possible"],
    },
    brief: {
      brief_title: "CampusPay: Payments for campus clubs",
      what_it_does: "CampusPay provides a payment platform for campus clubs to collect dues, sell tickets, and manage finances.",
      why_it_may_matter: "Underserved niche with a founder who has direct payments expertise from Stripe.",
      known_facts: ["Founder: Priya Nair (ex-Stripe PM)", "Targeting campus clubs and student orgs", "Scout sourced through university network"],
      open_questions: ["How many clubs are currently using the product?", "What is the transaction volume?", "Is there a path beyond campus to a larger market?"],
      suggested_next_action: "Ask scout for user count and transaction volume before making a decision.",
    },
    missing_info_tasks: [
      { id: "t4", info_needed: "User count / traction numbers", expected_date: null, followup_date: null, status: "pending" },
    ],
    messages: [
      { sender_type: "scout", body: "Found Priya through my university network. She's building a payments app for campus clubs. Ex-Stripe PM.", created_at: "2026-05-19T14:00:00Z" },
      { sender_type: "ai", body: "Interesting background. What made her stand out?", created_at: "2026-05-19T14:01:00Z" },
      { sender_type: "scout", body: "She already has 5 clubs signed up and seems to know payments deeply.", created_at: "2026-05-19T14:05:00Z" },
      { sender_type: "quanta", body: "Do you have any details on transaction volume or monthly revenue?", created_at: "2026-05-20T09:00:00Z" },
    ],
    partner_questions: [
      { question_text: "Ask for user count and traction numbers", ai_rewritten_message: "Quick question on CampusPay — do you have any sense of the transaction volume or how many clubs are actively paying?", status: "sent", asked_at: "2026-05-20T09:00:00Z" },
    ],
    internal_notes: [],
    files: [],
  },
  "cccccccc-cccc-cccc-cccc-cccccccccccc": {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    startup_name: "MedSync AI",
    one_line_description: "AI-powered patient scheduling and care coordination",
    category: "Healthcare AI",
    stage: "Seed",
    status: "monitor",
    priority: "normal",
    scout_conviction: "medium",
    source_context: "Mutual referral",
    submission_mode: "document",
    scout: { id: "33333333-3333-3333-3333-333333333333", full_name: "Jordan Lee", email: "jordan@example.com" },
    founders: [{ full_name: "Dr. James Wu", linkedin_url: "https://linkedin.com/in/jameswumd", background_summary: "Physician-turned-founder. 10 years clinical experience. Technical co-founder from Stanford CS." }],
    signals: {
      founder_signal: { level: "strong", evidence: "Physician-founder with 10 years clinical experience and a technical Stanford CS co-founder." },
      market_signal: { level: "strong", evidence: "Healthcare scheduling is a known bottleneck. Large, validated market." },
      traction_signal: { level: "medium", evidence: "Referred with warm intro — implies some validation, but no numbers provided yet." },
      scout_conviction: { level: "medium", evidence: "Scout submitted via mutual referral — implied endorsement." },
      risk_flags: ["No revenue numbers provided", "Healthcare sales cycles are long", "Regulatory complexity (HIPAA)"],
    },
    brief: {
      brief_title: "MedSync AI: Patient scheduling and care coordination",
      what_it_does: "MedSync AI automates patient scheduling and follow-up workflows for outpatient clinics using AI.",
      why_it_may_matter: "Physician-led team with Stanford CS co-founder targeting a validated pain point in a large market.",
      known_facts: ["Founder: Dr. James Wu (10 years clinical)", "Technical co-founder from Stanford CS", "Submitted via mutual referral"],
      open_questions: ["What is the current MRR or pilot revenue?", "Which clinics are piloting?", "How does it handle HIPAA compliance?"],
      suggested_next_action: "Request deck and pilot clinic details. Schedule intro call if deck looks strong.",
    },
    missing_info_tasks: [],
    messages: [
      { sender_type: "scout", body: "Got a warm intro to James Wu — physician-turned-founder building AI scheduling for clinics. Stanford CS co-founder. Seems legit.", created_at: "2026-05-17T11:00:00Z" },
      { sender_type: "ai", body: "Strong background. Do you know if they have paying customers yet?", created_at: "2026-05-17T11:01:00Z" },
      { sender_type: "scout", body: "Not sure. I can find out.", created_at: "2026-05-17T11:05:00Z" },
    ],
    partner_questions: [],
    internal_notes: [{ author_name: "Mateo", note: "James was at Stanford Med the same time as our LP Ravi. Worth a call.", created_at: "2026-05-20T16:00:00Z" }],
    files: [{ file_name: "MedSync-Deck-v2.pdf", file_type: "application/pdf", storage_url: "#", summary: "12-slide deck. Market size, product overview, team bios. No financial projections." }],
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  if (isDemoMode()) {
    const deal = DEMO_DEALS[params.dealId];
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    return NextResponse.json(deal);
  }

  const db = getSupabaseAdmin();

  const [dealRes, foundersRes, messagesRes, filesRes, tasksRes, signalsRes, briefRes, notesRes, pqRes] =
    await Promise.all([
      db.from("deals").select("*, scouts!source_scout_id(id, full_name, email)").eq("id", params.dealId).single(),
      db.from("founders").select("*").eq("deal_id", params.dealId),
      db.from("deal_messages").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: true }),
      db.from("deal_files").select("*").eq("deal_id", params.dealId),
      db.from("missing_info_tasks").select("*").eq("deal_id", params.dealId),
      db.from("ai_outputs").select("output_json").eq("deal_id", params.dealId).eq("output_type", "signal_summary").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("ai_outputs").select("output_json").eq("deal_id", params.dealId).eq("output_type", "internal_brief").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("internal_notes").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: false }),
      db.from("partner_questions").select("*").eq("deal_id", params.dealId).order("created_at", { ascending: false }),
    ]);

  if (dealRes.error || !dealRes.data) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...dealRes.data,
    scout: Array.isArray(dealRes.data.scouts) ? dealRes.data.scouts[0] : dealRes.data.scouts,
    founders: foundersRes.data ?? [],
    messages: messagesRes.data ?? [],
    files: filesRes.data ?? [],
    missing_info_tasks: tasksRes.data ?? [],
    signals: signalsRes.data?.output_json ?? null,
    brief: briefRes.data?.output_json ?? null,
    internal_notes: notesRes.data ?? [],
    partner_questions: pqRes.data ?? [],
  });
}
