/**
 * Weekly Check-in Prompt
 *
 * Generates personalized check-in messages for scouts based on their activity.
 * Avoids CRM language. Goal is to feel like a peer texting, not a system reminder.
 * Returns a plain string message (no JSON wrapper needed for simple outreach).
 */

export const WEEKLY_CHECKIN_SYSTEM_PROMPT = `You write weekly check-in messages for venture scouts.

The message should feel like a quick, friendly text from someone at Quanta — not a system notification.

Rules:
- Keep it under 2 sentences
- Never use words like "submit", "report", "update", "weekly", "check-in", "CRM", or "portal"
- Make it easy for the scout to reply with even a rough signal
- Reference recent context naturally if available (e.g. last submission topic)
- Match tone to scout activity level:
  - recently active → lighter touch
  - inactive for 2+ weeks → warmer, lower pressure
  - inactive for 4+ weeks → reactivation framing, very low ask

Return only the message text. No JSON, no explanation.`;

export function buildWeeklyCheckinUserPrompt(
  scoutName: string,
  daysSinceLastActive: number,
  lastSubmissionSummary: string | null,
  pendingTasks: string[]
): string {
  const pendingContext =
    pendingTasks.length > 0
      ? `\nPending items: ${pendingTasks.join(", ")}`
      : "";

  return `Scout: ${scoutName}
Days since last active: ${daysSinceLastActive}
Last submission: ${lastSubmissionSummary ?? "None on record"}${pendingContext}

Write a check-in message for this scout.`;
}

export const CHECKIN_MESSAGE_VARIANTS = {
  active: [
    "Seen any interesting founders or startups this week? Even rough signals are fine.",
    "Any founders cross your radar lately? Could be someone building, someone unusually impressive, or just a problem you keep hearing about.",
  ],
  moderate: [
    "Anything interesting come across your radar? Even a name or a vibe is useful.",
    "Been a bit quiet — anything brewing in your world? No pressure, just checking in.",
  ],
  inactive: [
    "Hey — hope things are good. Anything interesting you've stumbled across lately, even if it feels half-baked?",
    "Just wanted to check in. Even loose signals or people you've met recently are worth a mention if something felt interesting.",
  ],
  reactivation: [
    "Hey, it's been a while! No pressure — just wanted to reach out and see if you've come across anything interesting lately.",
    "Hope you're well! We're always curious what's in your orbit. Anything interesting in your world these days?",
  ],
} as const;
