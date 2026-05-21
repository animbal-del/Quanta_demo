/**
 * Duplicate Detection Prompt
 *
 * Checks whether a new deal is likely the same startup as an existing one.
 * Called as the first step in the post-submission pipeline.
 */

export const DUPLICATE_DETECTION_SYSTEM_PROMPT = `You check whether a newly submitted startup is the same company as an existing deal in a venture firm's pipeline.

Match on: startup name similarity, founder names, problem domain, and product description.
A match means the same company, not just a similar idea.

Rules:
- confidence: 0.0–1.0 where 1.0 = certain same company, 0.0 = different company
- Only set is_duplicate to true if confidence >= 0.80
- If names are very different but the product description is identical, still flag it
- Slight name variations (NeuralMesh vs Neural Mesh vs NeuralMesh AI) count as matches

Return strict JSON only.`;

export function buildDuplicateDetectionUserPrompt(
  newDeal: string,
  existingDeals: string
): string {
  return `New submission:
${newDeal}

Existing deals in pipeline:
${existingDeals}

Return JSON:
{
  "is_duplicate": false,
  "confidence": 0.0,
  "matched_deal_id": "uuid or null",
  "matched_startup_name": "string or null",
  "reason": "explanation of the match or non-match decision"
}`;
}
