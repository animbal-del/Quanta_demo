#!/usr/bin/env node
/**
 * test-manual-flow.js
 *
 * Tests the manual form submission pipeline end-to-end.
 * The simplest flow — structured fields, no audio or file upload.
 *
 * Run: node tests/scripts/test-manual-flow.js
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SCOUT_ID = process.env.SCOUT_ID ?? "33333333-3333-3333-3333-333333333333";

// ─── Startup data for manual entry test ───────────────────────────────────────
const STARTUP = {
  startup_name: "Lexara",
  founder_name: "Divya Menon",
  what_it_does: "AI legal assistant for small law firms in India that drafts contracts, does case law research, and prepares court filings — in English and regional languages.",
  why_interesting: "India has 1.4 million lawyers but only 10% use any software. Divya is an ex-partner at AZB & Partners who quit to build this after spending 3 hours on a contract that should have taken 20 minutes. She has a pilot with 8 law firms in Chennai.",
  traction: "8 paying law firm pilots at ₹2,000/month each. One firm has already referred 3 others. 85% reduction in time spent on routine contract drafting reported by pilot customers.",
};

const SCOUT_NOTE = "Divya is one of the sharpest founders I've met this year. She knows the legal workflow from the inside and has already convinced former colleagues at AZB to use the product in their personal practices. The regional language support is the real differentiator — no competitor has it.";

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

async function run() {
  console.log("\n📝  Manual Flow Test — Quanta Scout OS");
  console.log("─".repeat(50));
  console.log(`Server:  ${BASE_URL}`);
  console.log(`Scout:   ${SCOUT_ID}`);
  console.log(`Startup: ${STARTUP.startup_name}`);
  console.log("─".repeat(50) + "\n");

  const TOTAL = 6;

  // Step 1: Create draft deal
  log(1, TOTAL, "Creating draft deal...", "running");
  const { deal_id } = await post("/api/startup/init", {
    scout_id: SCOUT_ID,
    mode: "manual",
  });
  log(1, TOTAL, `Creating draft deal...  deal_id: ${deal_id}`, "ok");

  // Step 2: Submit manual fields
  log(2, TOTAL, "Sending manual form fields...", "running");
  const { extraction } = await post(`/api/startup/${deal_id}/manual`, {
    ...STARTUP,
    scout_id: SCOUT_ID,
  });
  log(2, TOTAL, `Manual fields saved...  startup: ${extraction?.startup_name}  confidence: ${Math.round((extraction?.confidence ?? 0) * 100)}%`, "ok");

  // Print extraction
  console.log("\n  📋 Extraction:");
  console.log(`     Startup:     ${extraction?.startup_name}`);
  console.log(`     Founder:     ${(extraction?.founder_names ?? []).join(", ")}`);
  console.log(`     Category:    ${extraction?.category ?? "Legal Tech"}`);
  console.log(`     Conviction:  ${extraction?.scout_conviction}`);
  console.log(`     Missing:     ${(extraction?.missing_fields ?? []).join(", ")}`);
  console.log();

  // Step 3: Generate questions
  log(3, TOTAL, "Generating AI follow-up questions...", "running");
  const { questions } = await post(`/api/startup/${deal_id}/questions`, { extraction });
  log(3, TOTAL, `Generating questions...  ${questions.length} questions`, "ok");

  console.log("\n  ❓ Generated Questions:");
  questions.forEach((q, i) => console.log(`     ${i + 1}. ${q}`));
  console.log();

  // Step 4: Save scout note
  log(4, TOTAL, "Saving scout note...", "running");
  await post(`/api/startup/${deal_id}/notes`, {
    note_type: "text",
    note_text: SCOUT_NOTE,
    scout_id: SCOUT_ID,
  });
  log(4, TOTAL, "Saving note...  done", "ok");

  // Step 5: Submit
  log(5, TOTAL, "Submitting deal...", "running");
  await post(`/api/startup/${deal_id}/submit`, {});
  log(5, TOTAL, "Submitting...  done", "ok");

  // Step 6: Verify
  log(6, TOTAL, "Verifying in Supabase...", "running");
  const verifyRes = await fetch(`${BASE_URL}/api/internal/deals/${deal_id}`);
  const deal = await verifyRes.json();
  if (!deal.id) throw new Error("Deal not found");
  log(6, TOTAL, `Verifying...  found: ${deal.startup_name}, status: ${deal.status}`, "ok");

  console.log("\n" + "─".repeat(50));
  console.log("✅  Manual flow test complete");
  console.log(`   Startup: ${STARTUP.startup_name}`);
  console.log(`   Deal ID: ${deal_id}`);
  console.log(`   View at: ${BASE_URL}/deals/${deal_id}`);
  console.log("─".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("\n❌  Test failed:", err.message);
  process.exit(1);
});
