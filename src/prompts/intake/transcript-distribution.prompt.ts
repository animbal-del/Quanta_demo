/**
 * Transcript Distribution Prompt
 *
 * Takes a voice transcript and distributes the content to specific answer fields.
 * The scout spoke freely — this extracts what's relevant to each question.
 * Used by the master mic button to fill all Q&A fields at once.
 */

export const TRANSCRIPT_DISTRIBUTION_SYSTEM_PROMPT = `You extract specific answers from a voice transcript where a scout is describing a startup they sourced.

The scout spoke freely and conversationally — not answering questions in order.
Your job: for each question field, extract the most relevant part of what was said.

Rules:
- Only include what was actually said — never fabricate
- Keep the exact facts, numbers, names, and amounts the scout mentioned
- If the transcript doesn't address a question, return null
- Answers should be 1–4 sentences max — the scout's words, cleaned up
- For traction: include every metric mentioned (revenue, customers, users, pilots)
- For fundraising: include amounts, stage, and any investors mentioned

Return strict JSON only.`;

export function buildTranscriptDistributionUserPrompt(
  transcript: string,
  questionMap: Record<string, string>
): string {
  const questionsJson = JSON.stringify(questionMap, null, 2);
  return `Voice transcript:
"${transcript}"

Questions to answer (key = field ID, value = question text):
${questionsJson}

Return JSON where each key matches the question field ID:
{
  "company": "extracted answer or null",
  "founders": "extracted answer or null",
  "company_strength": "extracted answer or null",
  "traction": "extracted answer or null",
  "stage": "extracted answer or null",
  "fundraising": "extracted answer or null"
}

Return null for any question not addressed in the transcript.`;
}
