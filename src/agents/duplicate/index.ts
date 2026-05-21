/**
 * Duplicate Detection Agent
 *
 * Pipeline Step 1 — runs immediately after submission.
 * Checks whether the new deal is the same startup as an existing one.
 * Uses Groq LLM to compare against recent submitted deals.
 *
 * If duplicate found: flags the deal and halts the rest of the pipeline.
 */

import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  DUPLICATE_DETECTION_SYSTEM_PROMPT,
  buildDuplicateDetectionUserPrompt,
} from "@/prompts/enrichment/duplicate-detection.prompt";
import type { DuplicateCheckOutput } from "@/types";

export async function runDuplicateDetection(dealId: string): Promise<DuplicateCheckOutput> {
  const db = getSupabaseAdmin();

  // Get the new deal
  const { data: newDeal } = await db
    .from("deals")
    .select("startup_name, one_line_description, category, founders(full_name)")
    .eq("id", dealId)
    .single();

  if (!newDeal?.startup_name) {
    return { is_duplicate: false, confidence: 0, matched_deal_id: null, matched_startup_name: null, reason: "No startup name to check" };
  }

  // Get recent submitted deals to compare against (exclude the new one)
  const { data: existingDeals } = await db
    .from("deals")
    .select("id, startup_name, one_line_description, founders(full_name)")
    .neq("id", dealId)
    .not("startup_name", "is", null)
    .not("status", "in", '("temp","draft")')
    .order("created_at", { ascending: false })
    .limit(30);

  if (!existingDeals || existingDeals.length === 0) {
    return { is_duplicate: false, confidence: 0, matched_deal_id: null, matched_startup_name: null, reason: "No existing deals to compare against" };
  }

  const newDealStr = `Name: ${newDeal.startup_name}\nDescription: ${newDeal.one_line_description ?? "—"}\nFounders: ${(newDeal.founders as { full_name: string }[] ?? []).map(f => f.full_name).join(", ") || "—"}`;

  const existingStr = existingDeals.map((d) =>
    `ID: ${d.id}\nName: ${d.startup_name}\nDescription: ${d.one_line_description ?? "—"}\nFounders: ${(d.founders as { full_name: string }[] ?? []).map((f) => f.full_name).join(", ") || "—"}`
  ).join("\n\n---\n\n");

  const result = await runStructuredCompletion<DuplicateCheckOutput>(
    DUPLICATE_DETECTION_SYSTEM_PROMPT,
    buildDuplicateDetectionUserPrompt(newDealStr, existingStr),
    "gpt-4o-mini" // fast model — this is a quick comparison task
  );

  // Save result to ai_outputs
  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "duplicate_check",
    model_name: "llama-3.1-8b-instant",
    input_snapshot: { new_deal: newDealStr, compared_against: existingDeals.length },
    output_json: result as unknown as Record<string, unknown>,
  });

  // If duplicate found, add an internal note flagging it
  if (result.is_duplicate && result.matched_deal_id) {
    await db.from("internal_notes").insert({
      deal_id: dealId,
      author_name: "AI Pipeline",
      note: `⚠️ Potential duplicate detected. Confidence: ${Math.round(result.confidence * 100)}%. Matches: ${result.matched_startup_name} (${result.matched_deal_id}). Reason: ${result.reason}`,
      visibility: "internal",
    });
  }

  return result;
}
