# Quanta Scout OS — System Overview

## What This Is

Quanta Scout OS is an AI-native venture scout management system. Scouts submit startup leads through conversational channels (Telegram, WhatsApp, Slack, web chat). The system structures messy input, remembers commitments, follows up automatically, and delivers a clean deal intelligence inbox to the Quanta team.

**Core design principle:** Scouts should feel like they are texting Quanta, not filling out a CRM.

---

## System Layers

### 1. OpenClaw (Communication Gateway)
- Receives scout messages from all channels
- Routes to the correct agent based on message intent
- Sends AI-generated replies back to scouts
- Maintains channel-level session continuity
- Channels: Telegram (primary for demo), WhatsApp, Slack, Web Chat

### 2. Agent Routing Layer (5 agents)
| Agent | Trigger | Purpose |
|---|---|---|
| Scout Intake Agent | New message with deal signal | Capture and structure lead submissions |
| Weekly Check-in Agent | Scheduler | Keep scouts active without pressure |
| Follow-up Agent | Promised date passes | Retrieve missing info scouts committed to |
| Partner Question Agent | Partner action on dashboard | Deliver internal questions scout-friendly |
| Scout Status Agent | Scout asking about their deals | Tell scout what Quanta is doing |

### 3. Backend (Next.js API Routes + Supabase)
- Processes all agent inputs and outputs
- Manages deal lifecycle and state machine
- Runs AI extraction, signal generation, and brief creation
- Schedules follow-ups based on committed dates

### 4. AI Intelligence Layer (6 sub-agents)
| Agent | Purpose |
|---|---|
| Deal Enrichment Agent | Summarize docs, URLs, founder profiles |
| Signal Extraction Agent | Extract qualitative VC-style signals |
| Duplicate Detection Agent | Check if new deal matches existing one |
| Internal Briefing Agent | Generate partner-facing deal brief |
| Next Action Agent | Suggest what Quanta should do next |

### 5. Internal Product (Dashboard)
- Deal Inbox: triage view with status and signals
- Deal Detail: full brief, thread, files, missing info, actions
- Scout Management Board: activity and responsiveness tracking
- Follow-up Queue: date-based task view
- Analytics Dashboard (Phase 2)

---

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons
- **Backend:** Next.js API Routes (Node.js)
- **Database:** Supabase (Postgres)
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth
- **AI:** OpenAI API (GPT-4o with Structured Outputs, Whisper for voice, text-embedding-3-small)
- **Gateway:** OpenClaw (self-hosted multi-channel gateway)

---

## Deal Status State Machine

```
draft → submitted → needs_info → under_review → intro_requested
                                              ↓
                                           monitor
                                              ↓
                                           archived / rejected
```

---

## Key Design Decisions

1. **No numeric scoring** — Signal cards use qualitative levels (strong/medium/early/weak/unclear), not percentages.
2. **One question at a time** — The conversation controller enforces a single follow-up question per turn.
3. **Incomplete is fine** — Deals are created with partial data. The system collects the rest over time.
4. **Web upload as fallback** — File/media upload always works via web chat even if OpenClaw channel support varies.
5. **OpenClaw for demo** — Telegram is the live demo channel. Web chat is the fallback and prototype surface.
