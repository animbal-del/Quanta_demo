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

GENERAL MERGE RULES:
1. New numbers REPLACE old numbers for the same metric
2. Preserve existing context that wasn't mentioned in the voice note
3. CALCULATE derived metrics when you have enough data (MoM growth, averages)
4. Be specific — keep names, percentages, units, currency from both sources
5. If the scout says "I'll check" or "not sure" about something, return null for that field
6. FORMAT: Clean, factual answers. Use "·" to separate multiple metrics. No long paragraphs.

FIELD-SPECIFIC EXTRACTION RULES:

company_strength — "What's the most impressive thing about the company?"
  Listen for: what the scout got excited about, what they emphasised, superlatives,
  specific "aha" moments (a live demo, a metric, the founder's background, a customer reference).
  Extract ONE crisp answer capturing the strongest signal. Examples:
  - "The founder predicted this market shift 3 years ago and built the IP before anyone else noticed."
  - "They have 40% month-on-month growth with zero paid marketing."
  - "The co-founder ran operations at Swiggy — she has the exact network to scale this."
  If the scout gave no clear positive signal, return null. Do NOT invent a strength.

stage — "What stage are they at?"
  Listen for: explicit labels OR contextual clues. Map them:
  - "just had the idea", "pre-product", "still validating" → Pre-idea / Pre-product
  - "building MVP", "in development" → MVP / Building
  - "just launched", "first customers", "pre-seed" → Pre-seed / Early
  - "seed round", "seed stage", "some revenue" → Seed
  - "Series A", "scaling", "solid ARR" → Series A
  Always include what they are actively doing now (e.g., "Seed — currently expanding to 3 new cities").

fundraising — "Have they raised money before? How much are they looking to raise now?"
  Listen for:
    Previous: "raised $X", "angel backed", "bootstrapped", "$X seed", "closed a round of $X"
    Current: "looking to raise $X", "raising a $X seed", "closing Series A of $X"
    Valuation hints: "at $Xm post", "$Xm valuation cap"
  Format output as: "Previously raised: [X or Nothing]. Now raising: [Y or Not disclosed]."
  If only one piece is mentioned, write the other as "Not disclosed" or "Bootstrapped".
  Numbers should be written clearly: "$2M", "₹2 crore", "€500K".

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
