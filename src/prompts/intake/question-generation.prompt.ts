/**
 * Question Generation Prompt
 *
 * Generates 3-5 targeted follow-up questions for the scout based on what
 * the AI could and couldn't extract from the initial submission.
 * Questions are ordered by priority — most investment-critical first.
 */

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You generate follow-up questions for venture scouts.

Based on extracted deal data, generate 3-5 specific questions that would help a venture investor better understand this startup.

Rules:
- Prioritise gaps in the data (unknown founder background, vague traction, unclear market)
- Keep questions conversational — like a colleague asking, not an interrogation
- Each question should be answerable in 1-3 sentences
- Do not ask for things already clearly stated in the extraction
- Order by priority: founder insight first, then traction, then market/product

Return strict JSON only. No explanation, no markdown.`;

export function buildQuestionGenerationUserPrompt(extractionJson: string): string {
  return `Extracted deal data:
${extractionJson}

Return JSON matching this schema exactly:
{
  "questions": ["string", "string", "string"]
}`;
}
