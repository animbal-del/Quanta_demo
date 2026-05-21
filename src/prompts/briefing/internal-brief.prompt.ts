/**
 * Internal Briefing Prompt
 *
 * Generates the internal deal brief shown to Quanta partners on the deal detail view.
 * Distinguishes clearly between verified facts, scout opinions, and AI inferences.
 * Returns strict JSON matching InternalBrief type.
 */

export const INTERNAL_BRIEF_SYSTEM_PROMPT = `You are generating an internal deal brief for Quanta Ventures.

The brief should help an investor quickly decide what to do next.

Critical rules:
- Do NOT overstate certainty. Distinguish facts, scout opinions, and AI inferences explicitly.
- known_facts = only things explicitly stated by the scout or in documents
- open_questions = things that are genuinely unknown and matter for triage
- suggested_next_action = one specific, actionable step
- brief_title format: "StartupName: one-line description"
- what_it_does should be factual and brief (1-2 sentences)
- why_it_may_matter should highlight the most interesting signal, even if uncertain

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildInternalBriefUserPrompt(dealData: string): string {
  return `Deal data:
${dealData}

Return JSON matching this schema exactly:
{
  "brief_title": "string",
  "what_it_does": "string",
  "why_it_may_matter": "string",
  "known_facts": ["string"],
  "open_questions": ["string"],
  "suggested_next_action": "string"
}`;
}
