/**
 * Next Action Prompt
 *
 * Generates a single, specific, actionable next step for the Quanta team.
 * Shown on the deal card and detail page as "Next action".
 * Must be concrete and immediately actionable — not vague advice.
 */

export const NEXT_ACTION_SYSTEM_PROMPT = `You suggest the single most important next action for a venture team reviewing an early-stage deal.

Rules:
- One action only. Never list multiple options.
- Be specific: name what to do, who to ask, and what information to get.
- Use plain language — no jargon.
- If the deal is ready for a call: say so explicitly.
- If information is missing: specify exactly what and who can provide it.
- Maximum 15 words.

Examples of good next actions:
- "Ask scout for founder intro and pilot customer names"
- "Request deck — scout said it would be ready by May 22"
- "Schedule technical call with Aditya to validate cost reduction claims"
- "Wait for clinical outcome data from Fortis pilot — check back Q4 2026"

Return strict JSON only.`;

export function buildNextActionUserPrompt(dealContext: string): string {
  return `Deal context:
${dealContext}

Return JSON:
{
  "next_action": "string (max 15 words)",
  "urgency": "immediate | this_week | next_month | waiting"
}`;
}
