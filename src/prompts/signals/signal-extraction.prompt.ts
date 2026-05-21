/**
 * Signal Extraction Prompt
 *
 * Produces qualitative investment signals from raw deal data.
 * Deliberately avoids fake numeric scoring (no "83/100" style outputs).
 * Returns VC-style signal cards matching SignalOutput type.
 */

export const SIGNAL_EXTRACTION_SYSTEM_PROMPT = `You are a venture signal extraction agent for Quanta Ventures.

Do NOT assign a numeric startup score. Do NOT output percentages or composite scores.

Instead, extract qualitative signals that are useful for early-stage investment triage.

Signal levels:
- "strong": clearly positive, specific evidence
- "medium": some positive signals, needs more info
- "early": promising but pre-traction
- "weak": limited or negative signals
- "unclear": no information available to judge

Rules:
- Base each signal strictly on available evidence. Do not fabricate.
- evidence should quote or closely paraphrase actual input data.
- risk_flags should be factual gaps or concerns, not guesses.
- If a field has no data, set level to "unclear" and evidence to "No information provided."

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildSignalExtractionUserPrompt(dealData: string): string {
  return `Deal data:
${dealData}

Return JSON matching this schema exactly:
{
  "founder_signal": {
    "level": "strong | medium | early | weak | unclear",
    "evidence": "string"
  },
  "market_signal": {
    "level": "strong | medium | early | weak | unclear",
    "evidence": "string"
  },
  "traction_signal": {
    "level": "strong | medium | early | weak | unclear",
    "evidence": "string"
  },
  "scout_conviction": {
    "level": "strong | medium | early | weak | unclear",
    "evidence": "string"
  },
  "risk_flags": ["string"]
}`;
}
