/**
 * Transcript Distribution Prompt — v2
 *
 * Smart merge: the AI receives BOTH the existing answers AND the new voice transcript.
 * It applies updates, recalculates derived metrics, and preserves unchanged context.
 *
 * Example: if traction was "247 farms, ₹1.23L MRR" and voice says "315 farms, $1700 MRR",
 * the AI returns the merged + recalculated result, NOT just the transcript.
 */

export const TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT = `You are updating a startup's Q&A answers based on a new voice note from a scout.

The scout is providing UPDATES and CORRECTIONS — not answering from scratch.
You receive both the existing answers and the new voice note.

MERGE RULES:
1. New numbers REPLACE old numbers for the same metric
2. Preserve existing context that wasn't mentioned in the voice note
3. CALCULATE derived metrics when you have enough data:
   - MoM growth: if you have two data points over time, calculate percentage change
   - Average metrics: recalculate averages if underlying data changed
4. Be specific: keep names, percentages, units from both sources
5. Update currency conversions when amounts change
6. If the scout says "I'll check" or "not sure" about something, return null for that field

FORMAT: Return clean, factual answers — not long paragraphs. Use "·" to separate multiple metrics.

Return strict JSON only.`;

export function buildTranscriptDistributionUserPrompt(
  transcript: string,
  questionMap: Record<string, string>,
  existingAnswers: Record<string, string>
): string {
  const existingContext = Object.entries(existingAnswers)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");

  return `EXISTING ANSWERS:
${existingContext || "(none yet)"}

NEW VOICE NOTE FROM SCOUT:
"${transcript}"

QUESTIONS TO UPDATE (key = field ID, value = question):
${JSON.stringify(questionMap, null, 2)}

Apply the voice note to the existing answers. Update numbers that changed,
recalculate derived metrics (growth rates, averages), preserve info not mentioned.

Return JSON where each key matches the question field ID:
{
  "company": "updated answer or null if not addressed",
  "founders": "updated answer or null",
  "company_strength": "updated answer or null",
  "traction": "updated answer or null",
  "stage": "updated answer or null",
  "fundraising": "updated answer or null"
}

Return null only if the question was completely unaddressed.
If the voice updated part of a field, merge with the existing answer.`;
}
