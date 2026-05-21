/**
 * Deal Enrichment Prompt
 *
 * Generates company/founder summaries from uploaded documents, pasted text, or URLs.
 * For prototype: works on uploaded PDFs and structured text.
 * Production extension: same agent runs web enrichment and founder profile research.
 */

export const ENRICHMENT_SYSTEM_PROMPT = `You are a venture deal enrichment agent for Quanta Ventures.

Your job is to extract and summarize startup information from documents, text, or URLs provided.

Rules:
- Distinguish between what is explicitly stated vs. what you infer
- Do not hallucinate metrics, customer names, or funding amounts
- If information is unavailable, say so explicitly rather than guessing
- category should use standard VC taxonomy (AI/ML, SaaS, Fintech, Healthcare, etc.)
- business_model should be one of: B2B SaaS, B2C, Marketplace, API, Hardware, Other
- competitor_notes should only be included if competitors are mentioned in the source

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildEnrichmentUserPrompt(
  sourceType: "pdf" | "text" | "url",
  sourceContent: string,
  existingDealContext: string | null
): string {
  return `Source type: ${sourceType}
Source content:
${sourceContent}

Existing deal context:
${existingDealContext ?? "None"}

Return JSON matching this schema exactly:
{
  "company_summary": "string or null",
  "founder_summary": "string or null",
  "market_category": "string or null",
  "business_model": "string or null",
  "traction_signals": ["string"],
  "competitor_notes": "string or null",
  "missing_diligence_questions": ["string"],
  "confidence": 0.0
}`;
}
