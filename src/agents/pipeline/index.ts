/**
 * Post-Submission Pipeline Orchestrator
 *
 * Runs automatically after a scout submits a deal.
 * Sequences all AI agents in the correct order with proper error isolation.
 *
 * Pipeline:
 *
 *   [1] Duplicate Detection          ← fast, runs first, can abort the rest
 *        │
 *        ▼ (if not duplicate)
 *   [2A] Signal Extraction  ──┐
 *   [2B] Internal Brief     ──┤ parallel — independent of each other
 *   [2C] Enrichment (docs)  ──┘
 *        │
 *        ▼
 *   [3]  Review Label                ← uses signals output
 *        │
 *        ▼
 *   [4]  Next Action                 ← uses brief + signals + label
 *        │
 *        ▼
 *   [5]  Promote deal status         ← submitted → needs_info or under_review
 *
 * All steps save their output to ai_outputs table.
 * Each step is wrapped in try/catch so one failure never blocks the rest.
 */

import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runDuplicateDetection } from "@/agents/duplicate";
import { runEnrichmentForDeal } from "@/agents/enrichment";
import {
  generateSignalsForDeal,
  generateBriefForDeal,
  assignReviewLabel,
  generateNextAction,
} from "@/agents/signals";

interface PipelineResult {
  deal_id: string;
  steps: {
    step: string;
    status: "success" | "skipped" | "failed";
    detail?: string;
  }[];
  final_status: string;
}

export async function runPostSubmissionPipeline(dealId: string): Promise<PipelineResult> {
  const db = getSupabaseAdmin();
  const steps: PipelineResult["steps"] = [];

  console.log(`[Pipeline] Starting for deal ${dealId}`);

  // ── Step 1: Duplicate detection ─────────────────────────────────────────────
  let isDuplicate = false;
  try {
    const dupResult = await runDuplicateDetection(dealId);
    isDuplicate = dupResult.is_duplicate;
    steps.push({
      step: "duplicate_detection",
      status: "success",
      detail: isDuplicate
        ? `Duplicate found: ${dupResult.matched_startup_name} (${Math.round(dupResult.confidence * 100)}% confidence)`
        : `No duplicate (checked ${dupResult.reason})`,
    });

    if (isDuplicate) {
      // Flag the deal but don't block — let Quanta team decide
      await db.from("deals").update({ status: "needs_info" }).eq("id", dealId);
      console.log(`[Pipeline] Duplicate detected for ${dealId} — flagged, stopping further analysis`);
      return {
        deal_id: dealId,
        steps,
        final_status: "needs_info",
      };
    }
  } catch (err) {
    steps.push({ step: "duplicate_detection", status: "failed", detail: String(err) });
    console.error(`[Pipeline] Duplicate detection failed for ${dealId}:`, err);
    // Non-fatal — continue
  }

  // ── Steps 2A + 2B + 2C: Parallel analysis ──────────────────────────────────
  let signals = null;
  let brief = null;

  const [signalsResult, briefResult, enrichmentResult] = await Promise.allSettled([
    generateSignalsForDeal(dealId),
    generateBriefForDeal(dealId),
    runEnrichmentForDeal(dealId),
  ]);

  if (signalsResult.status === "fulfilled") {
    signals = signalsResult.value;
    steps.push({ step: "signal_extraction", status: "success" });
  } else {
    steps.push({ step: "signal_extraction", status: "failed", detail: String(signalsResult.reason) });
    console.error(`[Pipeline] Signal extraction failed for ${dealId}:`, signalsResult.reason);
  }

  if (briefResult.status === "fulfilled") {
    brief = briefResult.value;
    steps.push({ step: "internal_brief", status: "success" });

    // Seed missing_info_tasks from the brief's open questions (so queue is never empty)
    if (brief.open_questions?.length > 0) {
      try {
        // Get the source scout so tasks are linked and follow-up emails reach someone
        const { data: dealRow } = await db
          .from("deals")
          .select("source_scout_id")
          .eq("id", dealId)
          .single();
        const scoutId = dealRow?.source_scout_id ?? null;

        const { data: existingTasks } = await db
          .from("missing_info_tasks")
          .select("info_needed")
          .eq("deal_id", dealId);
        const existing = new Set((existingTasks ?? []).map((t: { info_needed: string }) => t.info_needed.toLowerCase()));
        const newTasks = brief.open_questions
          .filter((q: string) => !existing.has(q.toLowerCase()))
          .map((q: string) => ({ deal_id: dealId, scout_id: scoutId, info_needed: q, status: "pending" }));
        if (newTasks.length > 0) {
          await db.from("missing_info_tasks").insert(newTasks);
          steps.push({ step: "seed_tasks", status: "success", detail: `${newTasks.length} tasks created from brief` });
        }
      } catch (e) {
        console.error(`[Pipeline] Task seeding failed for ${dealId}:`, e);
      }
    }
  } else {
    steps.push({ step: "internal_brief", status: "failed", detail: String(briefResult.reason) });
    console.error(`[Pipeline] Brief generation failed for ${dealId}:`, briefResult.reason);
  }

  if (enrichmentResult.status === "fulfilled") {
    steps.push({ step: "enrichment", status: "success" });
  } else {
    steps.push({ step: "enrichment", status: "skipped", detail: "No documents uploaded or enrichment skipped" });
  }

  // ── Step 3: Review label (needs signals) ────────────────────────────────────
  let reviewLabel: string = "needs_more_info";
  if (signals) {
    try {
      reviewLabel = await assignReviewLabel(dealId, signals);
      steps.push({ step: "review_label", status: "success", detail: reviewLabel });
    } catch (err) {
      steps.push({ step: "review_label", status: "failed", detail: String(err) });
      console.error(`[Pipeline] Review label failed for ${dealId}:`, err);
    }
  } else {
    steps.push({ step: "review_label", status: "skipped", detail: "No signals available" });
  }

  // ── Step 4: Next action (needs brief + signals) ─────────────────────────────
  if (signals && brief) {
    try {
      const nextAction = await generateNextAction(dealId, brief, signals);
      steps.push({ step: "next_action", status: "success", detail: nextAction });
    } catch (err) {
      steps.push({ step: "next_action", status: "failed", detail: String(err) });
      console.error(`[Pipeline] Next action failed for ${dealId}:`, err);
    }
  } else {
    steps.push({ step: "next_action", status: "skipped", detail: "Missing signals or brief" });
  }

  // ── Step 5: Promote deal status ─────────────────────────────────────────────
  // Determine final status based on what we know
  const { data: pendingTasks } = await db
    .from("missing_info_tasks")
    .select("id")
    .eq("deal_id", dealId)
    .eq("status", "pending");

  const hasMissingInfo = (pendingTasks ?? []).length > 0;
  const finalStatus = hasMissingInfo ? "needs_info" : "under_review";

  try {
    await db.from("deals")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", dealId);
    steps.push({ step: "status_promotion", status: "success", detail: `submitted → ${finalStatus}` });
  } catch (err) {
    steps.push({ step: "status_promotion", status: "failed", detail: String(err) });
  }

  console.log(`[Pipeline] Complete for ${dealId} → ${finalStatus}. Steps:`, steps.map(s => `${s.step}:${s.status}`).join(", "));

  return { deal_id: dealId, steps, final_status: finalStatus };
}
