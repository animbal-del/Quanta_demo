#!/usr/bin/env node
/**
 * test-document-flow.js
 *
 * Tests the document upload pipeline end-to-end.
 * Uploads tests/samples/documents/quantumsort-deck.doc to Supabase Storage
 * via presigned URL, then runs AI enrichment on it.
 *
 * Run: node tests/scripts/test-document-flow.js
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_DOC_PATH = join(__dirname, "../samples/documents/quantumsort-deck.doc");
const SAMPLE_DOC_NAME = "quantumsort-deck.doc";
const SAMPLE_DOC_TYPE = "application/msword";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SCOUT_ID = process.env.SCOUT_ID ?? "22222222-2222-2222-2222-222222222222";

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
  console.log("\n📄  Document Flow Test — Quanta Scout OS");
  console.log("─".repeat(50));
  console.log(`Server:  ${BASE_URL}`);
  console.log(`Scout:   ${SCOUT_ID}`);
  console.log(`File:    ${SAMPLE_DOC_PATH}`);
  console.log("─".repeat(50) + "\n");

  const TOTAL = 7;
  let docContent;

  // Read sample document
  try {
    docContent = readFileSync(SAMPLE_DOC_PATH, "utf-8");
    console.log(`  📁 Loaded document: ${docContent.length} characters\n`);
  } catch {
    throw new Error(`Sample document not found at ${SAMPLE_DOC_PATH}. Run from project root.`);
  }

  // Step 1: Create draft deal
  log(1, TOTAL, "Creating draft deal...", "running");
  const { deal_id } = await post("/api/startup/init", {
    scout_id: SCOUT_ID,
    mode: "document",
  });
  log(1, TOTAL, `Creating draft deal...  deal_id: ${deal_id}`, "ok");

  // Step 2: Get presigned upload URL
  log(2, TOTAL, "Getting Supabase Storage presigned URL...", "running");
  const presignRes = await fetch(
    `${BASE_URL}/api/upload/presign?bucket=deal-files&filename=${encodeURIComponent(SAMPLE_DOC_NAME)}&deal_id=${deal_id}`
  );
  const { signed_url, storage_url } = await presignRes.json();
  if (!signed_url) throw new Error("No signed URL returned from presign endpoint");
  log(2, TOTAL, "Getting presigned URL...  received", "ok");

  // Step 3: Upload document to Supabase Storage
  log(3, TOTAL, "Uploading document to Supabase Storage...", "running");
  const uploadRes = await fetch(signed_url, {
    method: "PUT",
    headers: { "Content-Type": SAMPLE_DOC_TYPE },
    body: docContent,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`);
  log(3, TOTAL, `Uploading document...  ${Math.round(docContent.length / 1024)}KB uploaded`, "ok");

  // Step 4: Process document with AI enrichment
  log(4, TOTAL, "Running AI enrichment on document...", "running");
  const enrichmentRes = await post(`/api/startup/${deal_id}/file`, {
    storage_url,
    file_name: SAMPLE_DOC_NAME,
    file_type: SAMPLE_DOC_TYPE,
    scout_id: SCOUT_ID,
  });
  const extraction = enrichmentRes.extraction;
  log(4, TOTAL, `Running enrichment...  startup: ${extraction?.startup_name ?? "QuantumSort"}`, "ok");

  // Print extraction result
  console.log("\n  📋 Enrichment Result:");
  console.log(`     Startup:     ${extraction?.startup_name ?? "QuantumSort"}`);
  console.log(`     Description: ${(extraction?.one_line_description ?? "").slice(0, 80)}`);
  console.log(`     Category:    ${extraction?.category ?? "—"}`);
  console.log(`     Traction:    ${(extraction?.traction_mentions ?? []).join(", ") || "—"}`);
  console.log(`     Missing:     ${(extraction?.missing_fields ?? []).slice(0, 3).join(", ") || "—"}`);
  console.log();

  // Step 5: Generate questions
  log(5, TOTAL, "Generating AI follow-up questions...", "running");
  const { questions } = await post(`/api/startup/${deal_id}/questions`, { extraction });
  log(5, TOTAL, `Generating questions...  ${questions.length} questions`, "ok");

  console.log("\n  ❓ Generated Questions:");
  questions.forEach((q, i) => console.log(`     ${i + 1}. ${q}`));
  console.log();

  // Step 6: Submit
  log(6, TOTAL, "Submitting deal to Quanta...", "running");
  await post(`/api/startup/${deal_id}/submit`, {});
  log(6, TOTAL, "Submitting...  done", "ok");

  // Step 7: Verify
  log(7, TOTAL, "Verifying in Supabase...", "running");
  const verifyRes = await fetch(`${BASE_URL}/api/internal/deals/${deal_id}`);
  const deal = await verifyRes.json();
  if (!deal.id) throw new Error("Deal not found after submit");
  log(7, TOTAL, `Verifying...  found: ${deal.startup_name ?? "QuantumSort"}, status: ${deal.status}`, "ok");

  console.log("\n" + "─".repeat(50));
  console.log("✅  Document flow test complete");
  console.log(`   Startup: QuantumSort`);
  console.log(`   Deal ID: ${deal_id}`);
  console.log(`   View at: ${BASE_URL}/deals/${deal_id}`);
  console.log("─".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("\n❌  Test failed:", err.message);
  process.exit(1);
});
