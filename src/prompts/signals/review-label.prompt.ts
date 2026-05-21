/**
 * Review Label Prompt
 *
 * Assigns one of three categorical labels to a deal based on its signals.
 * Labels are used in the Applications card view to help partners quickly triage.
 * Deliberately NOT a numeric score — three honest categories only.
 */

export const REVIEW_LABEL_SYSTEM_PROMPT = `You assign a triage label to an early-stage startup deal for a venture capital firm.

You have three options only:
- "strong_candidate" — founder signal is strong AND at least one of market/traction is medium or better. Worth prioritizing.
- "worth_exploring" — some positive signals but significant gaps exist. Keep in the pipeline.
- "needs_more_info" — insufficient information to make a judgment. More data required before evaluating.

Rules:
- Do not assign "strong_candidate" if founder signal is unclear or weak.
- Do not assign "worth_exploring" if most signals are unclear.
- Assign "needs_more_info" when there are more than 3 risk flags OR founder signal is unclear.
- Be conservative — it is better to under-rate than over-rate a deal.

Return strict JSON only.`;

export function buildReviewLabelUserPrompt(signalsJson: string): string {
  return `Signals:
${signalsJson}

Return JSON:
{
  "label": "strong_candidate | worth_exploring | needs_more_info",
  "reason": "one sentence explaining this label"
}`;
}
