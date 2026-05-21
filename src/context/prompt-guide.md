# Prompt Engineering Guide

## Prompt File Locations

All prompts live in `src/prompts/`. Each file exports:
- A `SYSTEM_PROMPT` constant (string) — the system message
- A `buildUserPrompt(...)` function — assembles the user message with dynamic data
- Optional variant constants for messages that have multiple tone versions

```
src/prompts/
  intake/
    extraction.prompt.ts           ← structured deal data from raw scout message
    next-question.prompt.ts        ← which single question to ask next
    commitment-extraction.prompt.ts ← detect date commitments in messages
  signals/
    signal-extraction.prompt.ts    ← qualitative VC-style signals
  briefing/
    internal-brief.prompt.ts       ← internal partner-facing deal brief
  partner/
    question-rewrite.prompt.ts     ← rewrite internal questions for scouts
  checkin/
    weekly-checkin.prompt.ts       ← personalized check-in messages
  followup/
    followup.prompt.ts             ← follow-up messages for promised info
  enrichment/
    enrichment.prompt.ts           ← doc/URL enrichment summaries
    duplicate-detection.prompt.ts  ← detect duplicate deal submissions
```

---

## How to Modify Prompts

When changing a prompt:

1. **Change only the prompt file** — do not embed prompt strings in agent logic files.
2. **System prompt changes** → edit the `SYSTEM_PROMPT` constant.
3. **Input schema changes** → update both the `buildUserPrompt()` function AND the corresponding TypeScript type in `src/types/index.ts`.
4. **Tone changes** (check-in, follow-up) → edit the relevant prompt file or add to `VARIANTS` constants.

---

## Output Format Rules

| Prompt | Output format |
|---|---|
| `extraction.prompt.ts` | Strict JSON (`ExtractionOutput`) |
| `next-question.prompt.ts` | Strict JSON (`NextQuestionOutput`) |
| `commitment-extraction.prompt.ts` | Strict JSON (`CommitmentOutput`) |
| `signal-extraction.prompt.ts` | Strict JSON (`SignalOutput`) |
| `internal-brief.prompt.ts` | Strict JSON (`InternalBrief`) |
| `question-rewrite.prompt.ts` | Strict JSON (`PartnerQuestionRewrite`) |
| `duplicate-detection.prompt.ts` | Strict JSON (`DuplicateCheckOutput`) |
| `enrichment.prompt.ts` | Strict JSON (inline schema) |
| `weekly-checkin.prompt.ts` | Plain text (no JSON) |
| `followup.prompt.ts` | Plain text (no JSON) |

---

## OpenAI Structured Outputs

For all JSON-output prompts, use OpenAI Structured Outputs mode:
```ts
response_format: { type: "json_object" }
```

For plain-text prompts (check-in, follow-up), use standard completion.

---

## Model Assignments

| Prompt | Recommended model |
|---|---|
| Extraction (real-time) | `gpt-4o` |
| Next question (real-time) | `gpt-4o` |
| Commitment extraction | `gpt-4o-mini` |
| Signal extraction | `gpt-4o` |
| Internal brief | `gpt-4o` |
| Partner question rewrite | `gpt-4o` |
| Check-in message | `gpt-4o-mini` |
| Follow-up message | `gpt-4o-mini` |
| Enrichment | `gpt-4o` |
| Duplicate detection | `gpt-4o-mini` |

---

## Adding a New Prompt

1. Create `src/prompts/<category>/<name>.prompt.ts`
2. Export `<NAME>_SYSTEM_PROMPT` and `build<Name>UserPrompt()`
3. Add the output type to `src/types/index.ts`
4. Create the agent handler in `src/agents/<category>/`
5. Document in this file and in `agent-routing.md`
