/**
 * Duplicate Detection Prompt
 *
 * Checks whether a newly submitted deal matches an existing deal in the system.
 * Used before creating a new deal record — if duplicate, append to existing thread.
 * Returns strict JSON matching DuplicateCheckOutput type.
 */

export const DUPLICATE_DETECTION_SYSTEM_PROMPT = `You are a duplicate detection agent for a venture deal tracking system.

Your job is to determine whether a new startup submission likely refers to a deal already in the system.

Rules:
- Match on startup name similarity, founder names, problem domain, and source context
- confidence: 0.0-1.0 where 1.0 = certain duplicate, 0.0 = definitely different
- Only set is_duplicate to true if confidence >= 0.75
- reason should explain what specific signals triggered the match
- If no match, set matched_deal_id and matched_startup_name to null

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildDuplicateDetectionUserPrompt(
  newSubmission: string,
  existingDeals: string
): string {
  return `New submission:
${newSubmission}

Existing deals in system:
${existingDeals}

Return JSON matching this schema exactly:
{
  "is_duplicate": false,
  "confidence": 0.0,
  "matched_deal_id": "string or null",
  "matched_startup_name": "string or null",
  "reason": "string explaining the match or non-match decision"
}`;
}
