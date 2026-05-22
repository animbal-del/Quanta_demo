/**
 * Question Generation Prompt — v2
 *
 * Generates AI follow-up questions that SUPPLEMENT the fixed structured
 * questions (company, founders, traction, stage, fundraising, rating).
 * Only surfaces gaps not already covered by the fixed questions.
 * Max 3 additional questions, most critical first.
 */

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You generate targeted follow-up questions for a venture scout about a startup they sourced.

The scout will already be asked these standard questions, so do NOT repeat them:
- What does the company do / what problem do they solve?
- Who are the founders and their backgrounds?
- What's most impressive about the founders?
- What traction do they have?
- What stage are they at?
- How much have they raised / want to raise?
- Personal investment rating 1-4 with reasoning

Your job: identify up to 3 ADDITIONAL questions that are specific to this startup's unique gaps.
Focus on things that are genuinely missing and would materially change an investment decision.
If no meaningful gaps exist, return fewer questions or an empty list.

Rules:
- Be specific — reference the actual startup, not generic questions
- One question per gap — not multi-part questions
- Skip if the extraction already answers it clearly
- Max 3 questions

Return strict JSON only.`;

export function buildQuestionGenerationUserPrompt(extractionJson: string): string {
  return `Extraction data for this startup:
${extractionJson}

Return JSON:
{
  "questions": ["specific question 1", "specific question 2"]
}

Return an empty array if no meaningful additional questions are needed.`;
}

// ─── Fixed structured questions (always asked) ────────────────────────────────
// These form the backbone of every submission regardless of what the AI extracts.
export const FIXED_QUESTIONS = [
  {
    id: "company",
    category: "Company",
    question: "What does the company do and what problem are they solving?",
    placeholder: "Describe their product, the problem, and the target customer…",
  },
  {
    id: "founders",
    category: "Founders",
    question: "Who are the founders? Share their names and backgrounds.",
    placeholder: "Names, previous experience, education, domain expertise…",
  },
  {
    id: "company_strength",
    category: "Company",
    question: "What's the most impressive thing about the company?",
    placeholder: "What stood out most — product insight, market timing, founder conviction, a demo, early results…",
  },
  {
    id: "traction",
    category: "Traction",
    question: "What traction do they have? (customers, revenue, users, pilots, LOIs)",
    placeholder: "Numbers, paying customers, growth rate, notable customers or partners…",
  },
  {
    id: "stage",
    category: "Stage",
    question: "What stage are they at?",
    placeholder: "Pre-idea, pre-product, MVP, early revenue, growth — and what they're doing now…",
  },
  {
    id: "fundraising",
    category: "Fundraising",
    question: "Have they raised money before? How much are they looking to raise now?",
    placeholder: "Previous rounds, current raise amount and terms if known, timeline…",
  },
] as const;

// ─── Rating scale ─────────────────────────────────────────────────────────────
export const RATING_OPTIONS = [
  { value: 1, label: "Not a fit",       color: "text-gray-500",   bg: "bg-gray-100",   border: "border-gray-300"   },
  { value: 2, label: "Worth exploring", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-300"   },
  { value: 3, label: "Strong lead",     color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-400"  },
  { value: 4, label: "Must invest",     color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-400"},
] as const;
