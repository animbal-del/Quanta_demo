# Agent Routing Context

## How OpenClaw Routes Messages

OpenClaw receives every inbound scout message and calls `/api/openclaw/webhook`.
The webhook identifies the scout, detects intent, and routes to the correct handler.

### Intent Detection Priority
1. Is this a reply to an active partner question? → Partner Question Agent
2. Is this a reply to an active follow-up task? → Follow-up Agent
3. Does this contain deal-related content? → Scout Intake Agent
4. Is the scout asking about their deal status? → Scout Status Agent
5. Everything else → Scout Intake Agent (attempt extraction)

### Scout Identity Resolution
- Primary key: `openclaw_user_id` (e.g. `tg_123` for Telegram)
- If unknown user → create new scout record with partial info
- Scout creation asks: "Hey, what's your name so I can save your submissions properly?"

---

## Agent Descriptions

### Scout Intake Agent (`/src/agents/intake/`)
Handles all new deal submissions regardless of channel.

**Input:** Raw scout message + optional attachments
**Output:** Structured deal data + one follow-up question
**Calls:** `extraction.prompt.ts`, `next-question.prompt.ts`, `commitment-extraction.prompt.ts`
**Creates:** `deals`, `founders`, `deal_messages`, `missing_info_tasks`

**Conversation flow:**
```
Scout sends message
  → Extract structured data (extraction.prompt)
  → Run duplicate detection
  → Create or update deal
  → Detect commitments (commitment-extraction.prompt)
  → Ask one question (next-question.prompt)
  → Return reply
```

---

### Weekly Check-in Agent (`/src/agents/checkin/`)
Sends personalized check-in messages on a schedule.

**Input:** Scout record (activity level, last submission, pending tasks)
**Output:** One-line message sent via OpenClaw
**Calls:** `weekly-checkin.prompt.ts`
**Logic:** Adapts message tone based on `daysSinceLastActive`

| Days inactive | Message type |
|---|---|
| < 7 | light touch |
| 7-14 | moderate |
| 14-28 | warm, low pressure |
| 28+ | reactivation |

---

### Follow-up Agent (`/src/agents/followup/`)
Triggered when a `missing_info_task.followup_date` is reached.

**Input:** `missing_info_task` record + deal + scout
**Output:** Follow-up message sent via OpenClaw
**Calls:** `followup.prompt.ts`
**State transitions:**
- Scout provides info → `completed`
- Scout defers → update `expected_date`, keep `pending`
- 3rd deferral → `stale`

---

### Partner Question Agent (`/src/agents/partner/`)
Triggered when a Quanta partner clicks "Ask Scout" on the dashboard.

**Input:** Partner's raw internal question + deal context
**Output:** Scout-friendly message sent via OpenClaw + `partner_questions` record
**Calls:** `question-rewrite.prompt.ts`

---

### Scout Status Agent (`/src/agents/partner/`)
Handles scout queries about their own submissions.

**Input:** Scout's question ("what happened with my FlowOps submission?")
**Output:** Plain-language status update
**Logic:** Reads deal status, missing tasks, last Quanta activity, sends summary

---

## Agent Files Location

```
src/agents/
  intake/
    index.ts          ← main handler
    extract.ts        ← calls extraction prompt + OpenAI
    question.ts       ← calls next-question prompt
    commitment.ts     ← calls commitment-extraction prompt
  checkin/
    index.ts
  followup/
    index.ts
  partner/
    index.ts          ← question rewrite + status agent
  enrichment/
    index.ts          ← enrichment + duplicate detection
  signals/
    index.ts          ← signal extraction + internal brief
  duplicate/
    index.ts
```
