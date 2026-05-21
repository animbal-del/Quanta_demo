# Quanta Scout OS — CLAUDE.md

## What This Project Is

AI-native venture scout management system. Scouts submit leads via conversational channels (Telegram, WhatsApp, Slack, web). The system structures messy inputs, remembers commitments, follows up automatically, and delivers a clean deal inbox to the Quanta investment team.

**Core design principle:** Scouts should feel like they are texting Quanta, not filling out a CRM.

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons
- **Database:** Supabase (Postgres)
- **AI:** OpenAI API (gpt-4o for real-time, gpt-4o-mini for background tasks)
- **Gateway:** OpenClaw (multi-channel messaging gateway)

## Critical Conventions

### Prompts live in `src/prompts/` — never inline them

Each prompt file exports:
- `<NAME>_SYSTEM_PROMPT` — the system message string
- `build<Name>UserPrompt(...)` — function that assembles the user message

See `src/context/prompt-guide.md` for the full list and modification instructions.

### Types live in `src/types/index.ts`

All shared interfaces. If you add a new AI output shape, add its type here first.

### Agents live in `src/agents/<category>/index.ts`

Each agent is a pure async function that reads from DB, calls AI, writes back to DB.
Agent files do not contain prompt strings — they import from `src/prompts/`.

### No numeric scores

Signal extraction produces qualitative levels: `strong | medium | early | weak | unclear`.
Never introduce a numeric startup score.

### One question at a time

The conversation controller (`next-question.prompt.ts`) enforces a single follow-up question per turn. Do not change this behavior.

## Key Context Files

| File | Purpose |
|---|---|
| `src/context/system-overview.md` | Full system architecture |
| `src/context/agent-routing.md` | How agents are triggered and what they do |
| `src/context/prompt-guide.md` | How to read, modify, and add prompts |
| `src/context/database-schema.md` | All tables, columns, and relationships |
| `src/context/openclaw-integration.md` | OpenClaw webhook and send API patterns |
| `src/context/demo-guide.md` | Demo storyline, control panel, and talking points |

## Database

Migration: `supabase/migrations/001_initial_schema.sql`
Demo seed: `supabase/seed/demo-seed.sql`

Run seed: `psql $DATABASE_URL -f supabase/seed/demo-seed.sql`

## OpenClaw Webhook

All inbound scout messages → `POST /api/openclaw/webhook`
Outbound messages (check-ins, follow-ups) → `src/lib/openclaw/client.ts → sendMessage()`

Set `OPENCLAW_SIMULATE=true` in `.env.local` to log messages instead of sending.

## Execution Phases

1. Foundation (DB + app shell)
2. AI Intake Engine
3. Scout Conversation UX
4. Task + Memory Engine
5. Internal Deal Inbox
6. Partner Actions
7. OpenClaw Integration
8. Document + Voice Intelligence
9. Enrichment + Duplicate Detection
10. Demo Control Layer
