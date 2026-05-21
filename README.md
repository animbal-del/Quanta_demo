# Quanta Scout OS

An AI-native venture scout management system. Scouts submit startup leads through conversational channels — Telegram, WhatsApp, Slack, or web chat. The system structures messy inputs, remembers commitments, follows up automatically, and delivers a clean deal intelligence inbox to the Quanta investment team.

> **Core principle:** Scouts should feel like they are texting Quanta, not filling out a CRM.

---

## What It Does

| For Scouts | For Quanta Partners |
|---|---|
| Submit leads by texting naturally | Deal inbox with AI-generated briefs |
| AI asks one smart follow-up at a time | Qualitative signal cards (no fake scores) |
| System remembers what they promised | Ask scouts questions from the dashboard |
| Get status updates on their submissions | Follow-up queue with scheduled reminders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes (Node.js) |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| AI | OpenAI API (GPT-4o, Whisper, text-embedding-3-small) |
| Gateway | OpenClaw (multi-channel messaging) |

---

## Project Structure

```
quanta-scout-os/
│
├── src/
│   ├── agents/                    # Agent logic (imports from prompts, never embeds strings)
│   │   ├── intake/                # Scout Intake Agent — structures deal submissions
│   │   ├── checkin/               # Weekly Check-in Agent — keeps scouts active
│   │   ├── followup/              # Follow-up Agent — chases promised info
│   │   ├── partner/               # Partner Question Agent — rewrites internal questions
│   │   ├── signals/               # Signal + Brief Agent — generates deal intelligence
│   │   ├── enrichment/            # Enrichment Agent — summarizes docs/URLs
│   │   └── duplicate/             # Duplicate Detection Agent
│   │
│   ├── prompts/                   # All AI prompts — isolated from agent logic
│   │   ├── intake/
│   │   │   ├── extraction.prompt.ts           # Raw message → structured deal data
│   │   │   ├── next-question.prompt.ts        # Picks the single best follow-up
│   │   │   └── commitment-extraction.prompt.ts # Detects date commitments
│   │   ├── signals/
│   │   │   └── signal-extraction.prompt.ts    # Qualitative VC-style signals
│   │   ├── briefing/
│   │   │   └── internal-brief.prompt.ts       # Partner-facing deal brief
│   │   ├── partner/
│   │   │   └── question-rewrite.prompt.ts     # Rewrites internal questions for scouts
│   │   ├── checkin/
│   │   │   └── weekly-checkin.prompt.ts       # Personalized check-in messages
│   │   ├── followup/
│   │   │   └── followup.prompt.ts             # Follow-up messages
│   │   └── enrichment/
│   │       ├── enrichment.prompt.ts           # Doc/URL enrichment
│   │       └── duplicate-detection.prompt.ts  # Deduplication
│   │
│   ├── app/
│   │   ├── (dashboard)/           # Internal Quanta dashboard (partners)
│   │   │   └── (routes)/
│   │   │       ├── inbox/         # Deal inbox
│   │   │       ├── deals/         # Deal detail view
│   │   │       ├── scouts/        # Scout management board
│   │   │       ├── queue/         # Follow-up queue
│   │   │       └── analytics/     # Analytics dashboard
│   │   ├── (scout)/               # Scout-facing pages
│   │   │   └── (routes)/
│   │   │       ├── chat/          # Scout chat interface
│   │   │       └── submissions/   # My Submissions view
│   │   └── api/
│   │       ├── openclaw/webhook/  # Inbound from OpenClaw
│   │       ├── scout/messages/    # Process scout messages (web chat)
│   │       ├── deals/             # Deal CRUD
│   │       └── internal/
│   │           ├── deals/         # Internal deal inbox API
│   │           └── scheduler/     # Trigger scheduled jobs
│   │
│   ├── context/                   # Reference docs — read these before building
│   │   ├── system-overview.md     # Full architecture diagram and design decisions
│   │   ├── agent-routing.md       # How agents are triggered and what they do
│   │   ├── prompt-guide.md        # How to read, modify, and add prompts
│   │   ├── database-schema.md     # All tables, columns, relationships
│   │   ├── openclaw-integration.md # OpenClaw webhook and send patterns
│   │   └── demo-guide.md          # Demo storyline, control panel, talking points
│   │
│   ├── lib/
│   │   ├── openai/client.ts       # OpenAI client — structured + text completions, Whisper
│   │   ├── supabase/client.ts     # Supabase browser + admin clients
│   │   └── openclaw/client.ts     # OpenClaw send API (with simulate mode)
│   │
│   ├── types/index.ts             # All shared TypeScript types
│   └── constants/index.ts         # Status labels, colors, model assignments, thresholds
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Full database schema with indexes and triggers
│   └── seed/
│       └── demo-seed.sql          # Demo data: scouts Amit/Sarah/Jordan, FlowOps deal
│
├── CLAUDE.md                      # Context for Claude Code sessions
├── .env.local.example             # Environment variable template
└── package.json
```

---

## Key Design Decisions

**No numeric scores.** Signal cards use qualitative levels (`strong / medium / early / weak / unclear`). Numeric scores feel fake at early stage.

**One question at a time.** The conversation controller enforces a single follow-up question per turn. Scouts never get interrogated.

**Incomplete is fine.** Deals are created with partial data on the first message. The system collects the rest over time through natural conversation.

**Prompts are isolated.** Every AI prompt lives in `src/prompts/` and is never inlined in agent logic. This makes tone and behavior changes a one-file edit.

**Web upload as fallback.** File and voice upload always works via web chat, regardless of whether the OpenClaw channel supports media.

---

## Agent Overview

| Agent | Trigger | What It Does |
|---|---|---|
| **Scout Intake** | Any scout message with deal signal | Extracts structured data, creates deal, asks one question |
| **Weekly Check-in** | Scheduler (every 7 days) | Sends personalized check-in based on activity level |
| **Follow-up** | Promised date passes | Reminds scout about info they committed to provide |
| **Partner Question** | Partner clicks "Ask Scout" | Rewrites internal question, sends via OpenClaw |
| **Signal Extraction** | After submission or on demand | Generates qualitative signal cards |
| **Internal Brief** | On demand or deal detail open | Writes partner-facing brief with facts, gaps, next action |

---

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/openclaw/webhook` | Receive all inbound OpenClaw messages |
| `POST` | `/api/scout/messages` | Process scout message from web chat |
| `GET` | `/api/internal/deals` | Deal inbox with filters |
| `POST` | `/api/internal/deals/:id/ask-scout` | Send partner question to scout |
| `POST` | `/api/internal/scheduler` | Trigger scheduler jobs manually |
| `POST` | `/api/deals/:id/files` | Upload deck or document |
| `GET` | `/api/internal/deals/:id` | Full deal detail |

---

## Database Tables

`scouts` · `deals` · `founders` · `deal_messages` · `deal_files` · `missing_info_tasks` · `ai_outputs` · `internal_notes` · `partner_questions`

Full schema with indexes and triggers: `supabase/migrations/001_initial_schema.sql`

---

## Deal Status Flow

```
draft → submitted → needs_info → under_review → intro_requested
                                              ↓
                                           monitor → archived / rejected
```

---

## Execution Phases

| Phase | Status | What Gets Built |
|---|---|---|
| 1. Foundation | ✅ Done | DB schema, project structure, types, prompts, agents, API routes |
| 2. AI Intake Engine | Next | Wire prompts to OpenAI, test extraction end-to-end |
| 3. Scout Chat UI | — | Mobile-first chat, deal preview, My Submissions |
| 4. Task + Memory Engine | — | missing_info_tasks lifecycle, date extraction |
| 5. Internal Deal Inbox | — | Inbox, deal detail, signal cards, AI brief |
| 6. Partner Actions | — | Ask Scout modal, priority actions, archive |
| 7. OpenClaw Integration | — | Telegram webhook, identity mapping, live channel |
| 8. Document + Voice | — | PDF upload, audio transcription, file-to-deal extraction |
| 9. Enrichment + Dedup | — | Embedding search, duplicate detection, enrichment |
| 10. Demo Control Layer | — | Seed button, reset, manual scheduler, simulated flows |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# OpenClaw
OPENCLAW_BASE_URL=http://localhost:3001
OPENCLAW_API_KEY=
OPENCLAW_SIMULATE=true   # logs messages instead of sending — use this during dev
```

---

## Modifying Prompts

All prompts are in `src/prompts/`. Each file exports a system prompt constant and a user prompt builder function.

To change AI behavior:
- **Tone** (check-in, follow-up) → edit the prompt file directly
- **Output schema** → update the prompt file AND the matching type in `src/types/index.ts`
- **New prompt** → create `src/prompts/<category>/<name>.prompt.ts`, add type, document in `src/context/prompt-guide.md`

See `src/context/prompt-guide.md` for the full reference.

---

## Demo Storyline

1. Scout "Amit" receives check-in on Telegram
2. Replies with FlowOps lead — AI extracts deal, asks one question
3. Scout says he'll get deck by May 22 — system creates follow-up task
4. Quanta dashboard shows FlowOps with signal cards and AI brief
5. Partner clicks "Ask Scout" — AI rewrites question, sends via OpenClaw
6. Partner clicks "Run Follow-up Agent" — scout gets reminder on May 23

Full script and control panel routes in `src/context/demo-guide.md`.
