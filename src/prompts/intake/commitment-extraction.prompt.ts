/**
 * Commitment / Date Extraction Prompt
 *
 * Detects when a scout has committed to providing something by a specific date.
 * Normalizes relative dates (e.g. "next week", "by Thursday") to ISO format.
 * Returns strict JSON matching CommitmentOutput type.
 */

export const COMMITMENT_EXTRACTION_SYSTEM_PROMPT = `You extract follow-up commitments from scout messages.

Your job is to detect when a scout has promised to provide something (a deck, an intro, a contact, user numbers) by a specific or relative date.

Rules:
- Normalize all dates to ISO format (YYYY-MM-DD)
- followup_date should be one day after expected_date
- If the scout says "sometime next week" without a specific day, use the last day of that week
- If no commitment is found, set has_commitment to false and all other fields to null
- Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildCommitmentUserPrompt(
  scoutMessage: string,
  currentDate: string
): string {
  return `Scout message:
"${scoutMessage}"

Current date: ${currentDate}

Return JSON matching this schema exactly:
{
  "has_commitment": true,
  "missing_item": "string or null (what they promised to provide)",
  "expected_date": "YYYY-MM-DD or null",
  "followup_date": "YYYY-MM-DD or null (one day after expected_date)"
}`;
}
