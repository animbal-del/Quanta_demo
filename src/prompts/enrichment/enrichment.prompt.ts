/**
 * Document Enrichment Prompt — v2
 *
 * Extracts structured startup data from actual file content.
 * Input is the real text extracted from the uploaded file — not just a filename.
 * Works with: plain text, HTML/Word exports, CSV, partially-readable PDFs.
 */

export const ENRICHMENT_SYSTEM_PROMPT = `You extract startup information from a pitch deck, document, or file that a scout has uploaded.

The content may be:
- Plain text or markdown
- HTML (from Word .doc exports)
- Partially readable binary (from PDFs or old formats)

Your job: extract every piece of startup-relevant information you can find.
Ignore formatting artifacts, CSS, binary garbage, and repeated navigation elements.
Focus on finding real business information.

Rules:
- startup_name: the company name (not the document title)
- founder_names: real people's names mentioned as founders, CEO, CTO etc.
- one_line_description: what the company does in one sentence
- category: industry vertical (e.g. "AI / Logistics", "Fintech", "Healthcare AI")
- traction_signals: specific traction facts (e.g. "$8K MRR", "5 paying customers", "2 pilots")
- fundraising: any mention of raise amount, investors, or valuation
- confidence: 0.0-1.0 based on how much real content was available

Be aggressive — extract everything you can. Do not make things up.
If a field has no evidence in the content, return null.

Return strict JSON only. No explanation.`;

export function buildEnrichmentUserPrompt(
  sourceType: "pdf" | "text" | "url" | "html",
  sourceContent: string,
  existingDealContext: string | null
): string {
  return `File content (${sourceType}):
---
${sourceContent.slice(0, 10000)}
---

Existing deal context (if any):
${existingDealContext ?? "None"}

Return JSON matching this schema exactly:
{
  "startup_name": "string or null",
  "founder_names": ["string"],
  "one_line_description": "string or null",
  "category": "string or null",
  "traction_signals": ["string"],
  "fundraising": "string or null",
  "missing_diligence_questions": ["string"],
  "confidence": 0.0
}`;
}
