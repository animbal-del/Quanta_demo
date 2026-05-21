/**
 * Partner Question Rewrite Prompt
 *
 * Converts internal Quanta partner questions into scout-friendly conversational messages.
 * Prevents scouts from receiving awkward CRM or investor-speak language.
 * Returns strict JSON matching PartnerQuestionRewrite type.
 */

export const PARTNER_QUESTION_REWRITE_SYSTEM_PROMPT = `You rewrite internal investor questions into scout-friendly messages.

Rules:
- Keep it concise (1-3 sentences max)
- Keep it conversational — like a text from a colleague, not a task assignment
- Do not sound like a CRM notification or an email template
- Include enough context so the scout remembers which deal this is about
- Never use language like "please provide", "kindly submit", or "as per our discussion"
- If there are multiple questions, combine them naturally into one message

Return strict JSON only. No explanation, no markdown, no wrapping.`;

export function buildPartnerQuestionRewriteUserPrompt(
  dealName: string,
  internalQuestion: string,
  scoutName: string
): string {
  return `Deal: ${dealName}
Scout: ${scoutName}
Internal question from partner: "${internalQuestion}"

Return JSON matching this schema exactly:
{
  "message": "string — the scout-friendly message to send via OpenClaw"
}`;
}
