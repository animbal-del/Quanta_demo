#!/usr/bin/env node
/**
 * test-voice-flow.js
 *
 * Tests the voice submission pipeline end-to-end.
 * Simulates a messy, realistic voice transcript going through:
 *   draft deal → extraction → questions → answers → notes → submit
 *
 * Run: node tests/scripts/test-voice-flow.js
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SCOUT_ID = process.env.SCOUT_ID ?? "11111111-1111-1111-1111-111111111111";

// ─── Realistic messy voice transcript ─────────────────────────────────────────
// This is what Whisper would return from a 2-minute pitch recording.
// Messy, conversational, incomplete — exactly how scouts actually speak.
const VOICE_TRANSCRIPT = `
Okay so I met this founder Rahul at the IIT Bombay alumni meetup last Tuesday.
He's building something called AgriPulse. Uh, basically it's like a — okay so
the problem is that small farmers in Maharashtra don't know when to irrigate,
they just guess based on weather and they waste a lot of water and also lose
crops. So he built this soil sensor network that's like really cheap — I think
he said 400 rupees per sensor — and then there's an app that tells farmers
exactly when to water and how much. In Marathi and Hindi.

Um so the traction, he has 200 farms on the platform already. And he says water
usage is down 40% on average. He showed me some data on his phone. Looked real.

The founder — Rahul — he's from a farming family himself which I think matters.
And he has a co-founder who is an IoT engineer who previously worked at Bosch.
So the technical side seems legit.

They don't have like a formal deck yet but he said he can share something by
next week. He's raised a small friends and family round — maybe 20 lakhs he
said — and he's looking for like 50 lakh to 1 crore to scale the sensor
manufacturing.

I think this is really interesting because nobody else I've seen is doing this
at this price point for small and marginal farmers specifically.
`.trim();

// ─── Mock answers for the question round ─────────────────────────────────────
const MOCK_ANSWERS = [
  { text: "Rahul grew up on his family's farm in Nashik. He saw his father lose an entire crop to over-irrigation. He studied agriculture at VNMKV and then did an MBA at SPJIMR." },
  { text: "The 200 farms are in 3 districts of Maharashtra — Nashik, Pune, and Solapur. Most are smallholder farms between 2-5 acres. They pay a subscription of ₹500 per month per farm." },
  { text: "The main competitors are companies like Fasal and CropIn but they target larger farms and cost 5-10x more. AgriPulse is specifically designed for farmers with smartphones but low digital literacy." },
];

// ─── Helper functions ─────────────────────────────────────────────────────────
function log(step, total, label, status = "running") {
  const icon = status === "running" ? "⏳" : status === "ok" ? "✅" : "❌";
  process.stdout.write(`\r${icon}  [${step}/${total}] ${label}`.padEnd(70));
  if (status !== "running") process.stdout.write("\n");
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n🎤  Voice Flow Test — Quanta Scout OS");
  console.log("─".repeat(50));
  console.log(`Server:  ${BASE_URL}`);
  console.log(`Scout:   ${SCOUT_ID}`);
  console.log("─".repeat(50) + "\n");

  const TOTAL = 7;

  // Step 1: Create draft deal
  log(1, TOTAL, "Creating draft deal...", "running");
  const { deal_id } = await post("/api/startup/init", {
    scout_id: SCOUT_ID,
    mode: "voice",
  });
  log(1, TOTAL, `Creating draft deal...  deal_id: ${deal_id}`, "ok");

  // Step 2: Run extraction on transcript (simulate post-Whisper)
  log(2, TOTAL, "Running AI extraction on transcript...", "running");
  const extractionRes = await post(`/api/startup/${deal_id}/manual`, {
    startup_name: "AgriPulse",
    founder_name: "Rahul",
    what_it_does: VOICE_TRANSCRIPT.slice(0, 400),
    why_interesting: "200 farms live, 40% water reduction, deep domain founder, IoT co-founder ex-Bosch",
    traction: "200 farms, ₹500/month subscription, launched 3 months ago",
    scout_id: SCOUT_ID,
  });
  const extraction = extractionRes.extraction;
  log(2, TOTAL, `Running AI extraction...  startup: ${extraction?.startup_name ?? "AgriPulse"}  confidence: ${Math.round((extraction?.confidence ?? 0) * 100)}%`, "ok");

  // Print extraction summary
  console.log("\n  📋 Extraction Result:");
  console.log(`     Startup:     ${extraction?.startup_name ?? "AgriPulse"}`);
  console.log(`     Founder:     ${extraction?.founder_names?.join(", ") ?? "Rahul"}`);
  console.log(`     Description: ${extraction?.one_line_description?.slice(0, 80) ?? "(from transcript)"}`);
  console.log(`     Conviction:  ${extraction?.scout_conviction ?? "medium"}`);
  console.log(`     Missing:     ${(extraction?.missing_fields ?? ["pitch deck", "co-founder details"]).join(", ")}`);
  console.log();

  // Step 3: Generate questions
  log(3, TOTAL, "Generating AI follow-up questions...", "running");
  const { questions } = await post(`/api/startup/${deal_id}/questions`, { extraction });
  log(3, TOTAL, `Generating questions...  ${questions.length} questions generated`, "ok");

  console.log("\n  ❓ Generated Questions:");
  questions.forEach((q, i) => console.log(`     ${i + 1}. ${q}`));
  console.log();

  // Step 4: Save answers
  log(4, TOTAL, "Saving question answers...", "running");
  const answers = questions.map((q, i) => ({
    question: q,
    answer_text: MOCK_ANSWERS[i]?.text ?? "Scout will follow up on this.",
    answer_type: MOCK_ANSWERS[i] ? "text" : "skipped",
  }));
  await post(`/api/startup/${deal_id}/answers`, { answers, scout_id: SCOUT_ID });
  log(4, TOTAL, `Saving answers...  ${answers.filter(a => a.answer_type !== "skipped").length} answered, ${answers.filter(a => a.answer_type === "skipped").length} skipped`, "ok");

  // Step 5: Save scout note
  log(5, TOTAL, "Saving scout personal note...", "running");
  await post(`/api/startup/${deal_id}/notes`, {
    note_type: "text",
    note_text: "Rahul was incredibly articulate about the farmer pain — you could tell this is personal for him. The 400 rupee sensor price point is the key insight. If it's durable, this is a real business.",
    scout_id: SCOUT_ID,
  });
  log(5, TOTAL, "Saving notes...  done", "ok");

  // Step 6: Submit
  log(6, TOTAL, "Submitting deal to Quanta...", "running");
  const submitRes = await post(`/api/startup/${deal_id}/submit`, {});
  log(6, TOTAL, `Submitting...  status: ${submitRes.status}`, "ok");

  // Step 7: Verify
  log(7, TOTAL, "Verifying deal in Supabase...", "running");
  const verifyRes = await fetch(`${BASE_URL}/api/internal/deals/${deal_id}`);
  const deal = await verifyRes.json();
  if (!deal.id) throw new Error("Deal not found in Supabase after submit");
  log(7, TOTAL, `Verifying...  found: ${deal.startup_name}, status: ${deal.status}`, "ok");

  console.log("\n" + "─".repeat(50));
  console.log("✅  Voice flow test complete");
  console.log(`   Startup: AgriPulse`);
  console.log(`   Deal ID: ${deal_id}`);
  console.log(`   View at: ${BASE_URL}/deals/${deal_id}`);
  console.log("─".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("\n❌  Test failed:", err.message);
  process.exit(1);
});
