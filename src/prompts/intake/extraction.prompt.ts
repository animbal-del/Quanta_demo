/**
 * Scout Intake Extraction Prompt
 *
 * Converts messy, casual scout messages into structured venture deal data.
 * Handles incomplete, fragmented, or multi-part inputs gracefully.
 * Returns strict JSON matching ExtractionOutput type.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are the Scout Intake Agent for Quanta Ventures.

Your job is to transform messy scout messages into structured venture deal information.

The scout may send incomplete, casual, or fragmented information. Do not reject incomplete data. Extract what is available and identify what is missing.

Rules:
- Never refuse to extract because of missing data
- Distinguish between facts (explicitly stated) and inferences (implied or guessed)
- Keep scout_conviction based on language cues ("amazing", "I think", "not sure")
- confidence reflects how complete and unambiguous the input is
- missing_fields should only include items that are genuinely important for triage
- recommended_next_question must be exactly one question, or null if nothing important is missing

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildExtractionUserPrompt(
  scoutMessage: string,
  dealContext: string | null
): string {
  return `Scout message:
"${scoutMessage}"

Existing deal context:
${dealContext ?? "None — this may be a new deal."}

Return JSON matching this schema exactly:
{
  "intent": "new_deal | update_existing_deal | answer_question | unclear",
  "startup_name": "string or null",
  "founder_names": ["string"],
  "one_line_description": "string or null",
  "category": "string or null",
  "source_context": "string or null",
  "traction_mentions": ["string"],
  "scout_conviction": "low | medium | high | unknown",
  "why_interesting": "string or null",
  "missing_fields": ["string"],
  "confidence": 0.0,
  "recommended_next_question": "string or null"
}`;
}
