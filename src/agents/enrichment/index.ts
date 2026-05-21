/**
 * Deal Enrichment Agent
 *
 * Pipeline Step 2B (parallel with signals) — runs after duplicate check.
 * Summarises uploaded files and extracts additional structured data
 * from any documents the scout uploaded.
 *
 * In the prototype: summarises existing file records.
 * In production: could run web research against founder LinkedIn, company website, etc.
 */

import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentUserPrompt,
} from "@/prompts/enrichment/enrichment.prompt";
import { AI_MODELS } from "@/constants";

export async function runEnrichmentForDeal(dealId: string): Promise<void> {
  const db = getSupabaseAdmin();

  // Check if there are uploaded files to enrich from
  const { data: files } = await db
    .from("deal_files")
    .select("file_name, extracted_text, summary")
    .eq("deal_id", dealId)
    .not("extracted_text", "is", null);

  if (!files || files.length === 0) return; // nothing to enrich from

  const { data: deal } = await db
    .from("deals")
    .select("startup_name, one_line_description, category")
    .eq("id", dealId)
    .single();

  // Combine all extracted text from uploaded documents
  const combinedText = files
    .map((f) => `File: ${f.file_name}\n${f.extracted_text}`)
    .join("\n\n---\n\n")
    .slice(0, 8000); // cap at 8K chars for the prompt

  const existingContext = deal
    ? `${deal.startup_name ?? ""}: ${deal.one_line_description ?? ""}`
    : null;

  const enrichment = await runStructuredCompletion<{
    company_summary: string | null;
    founder_summary: string | null;
    market_category: string | null;
    traction_signals: string[];
    missing_diligence_questions: string[];
    confidence: number;
  }>(
    ENRICHMENT_SYSTEM_PROMPT,
    buildEnrichmentUserPrompt("pdf", combinedText, existingContext),
    AI_MODELS.enrichment
  );

  // Update deal fields if enrichment found better data
  const dealUpdate: Record<string, string | null> = {};
  if (!deal?.one_line_description && enrichment.company_summary) {
    dealUpdate.one_line_description = enrichment.company_summary;
  }
  if (!deal?.category && enrichment.market_category) {
    dealUpdate.category = enrichment.market_category;
  }

  if (Object.keys(dealUpdate).length > 0) {
    await db.from("deals").update(dealUpdate).eq("id", dealId);
  }

  // Create missing_info_tasks for diligence gaps
  if (enrichment.missing_diligence_questions.length > 0) {
    const { data: existingTasks } = await db
      .from("missing_info_tasks")
      .select("info_needed")
      .eq("deal_id", dealId);

    const existingItems = new Set((existingTasks ?? []).map((t) => t.info_needed.toLowerCase()));

    const newTasks = enrichment.missing_diligence_questions
      .filter((q) => !existingItems.has(q.toLowerCase()))
      .map((q) => ({ deal_id: dealId, info_needed: q, status: "pending" }));

    if (newTasks.length > 0) {
      await db.from("missing_info_tasks").insert(newTasks);
    }
  }

  // Save enrichment output
  await db.from("ai_outputs").insert({
    deal_id: dealId,
    output_type: "enrichment",
    model_name: AI_MODELS.enrichment,
    input_snapshot: { files_processed: files.length },
    output_json: enrichment as unknown as Record<string, unknown>,
  });
}
