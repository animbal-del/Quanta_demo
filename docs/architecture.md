# Quanta Scout OS — Architecture & Technical Reference

**Last updated:** 2026-05-21
**Stack:** Next.js 14 · Supabase · Groq (LLM + STT) · OpenAI (embeddings) · Resend

---

## 0. Multi-Agent Pipeline (Post-Submission)

When a scout submits a deal, a 7-step agent pipeline runs automatically in the background. The submit API returns immediately — the pipeline runs async so the scout never waits.

```
Scout hits "Submit to Quanta"
        │
        ▼
POST /api/startup/:id/submit
  ├── Sets deals.status = 'submitted'   (instant, scout sees confirmation)
  └── Fires runPostSubmissionPipeline() in background (non-blocking)

        ▼ Background — ~8-15 seconds total

┌──────────────────────────────────────────────────────────────────────┐
│                    POST-SUBMISSION PIPELINE                          │
│                   src/agents/pipeline/index.ts                       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 1  Duplicate Detection Agent                           │    │
│  │         src/agents/duplicate/index.ts                       │    │
│  │         Model: llama-3.1-8b-instant (Groq, fast)            │    │
│  │                                                             │    │
│  │  • Fetches last 30 submitted deals from Supabase            │    │
│  │  • LLM compares new deal vs existing (name, desc, founder)  │    │
│  │  • If confidence ≥ 80%: adds internal note flagging it      │    │
│  │  • If duplicate found: STOPS HERE (rest of pipeline skipped)│    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                │ (only if NOT duplicate)             │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 2  Parallel Analysis (Promise.allSettled)               │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ 2A  Signal Extraction Agent                          │   │   │
│  │  │     src/agents/signals/index.ts → generateSignals()  │   │   │
│  │  │     Model: llama-3.3-70b-versatile (Groq)            │   │   │
│  │  │     Prompt: prompts/signals/signal-extraction.prompt  │   │   │
│  │  │     Output: founder/market/traction/conviction levels │   │   │
│  │  │             + risk_flags[]                           │   │   │
│  │  │     Saves to: ai_outputs (type = signal_summary)     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ 2B  Internal Brief Agent                             │   │   │
│  │  │     src/agents/signals/index.ts → generateBrief()    │   │   │
│  │  │     Model: llama-3.3-70b-versatile (Groq)            │   │   │
│  │  │     Prompt: prompts/briefing/internal-brief.prompt    │   │   │
│  │  │     Output: what_it_does, why_it_may_matter,         │   │   │
│  │  │             known_facts, open_questions,              │   │   │
│  │  │             suggested_next_action                     │   │   │
│  │  │     Saves to: ai_outputs (type = internal_brief)     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ 2C  Enrichment Agent                                 │   │   │
│  │  │     src/agents/enrichment/index.ts                   │   │   │
│  │  │     Model: llama-3.3-70b-versatile (Groq)            │   │   │
│  │  │     Prompt: prompts/enrichment/enrichment.prompt      │   │   │
│  │  │     Input: extracted_text from uploaded deal_files    │   │   │
│  │  │     Output: fills missing deal fields from docs,      │   │   │
│  │  │             creates missing_info_tasks for gaps       │   │   │
│  │  │     Skipped if no files uploaded                     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 3  Review Label Agent                                   │   │
│  │         src/agents/signals/index.ts → assignReviewLabel()    │   │
│  │         Model: llama-3.1-8b-instant (Groq)                   │   │
│  │         Prompt: prompts/signals/review-label.prompt           │   │
│  │         Input: signal output from Step 2A                    │   │
│  │         Output: strong_candidate | worth_exploring |          │   │
│  │                 needs_more_info                               │   │
│  │         Writes to: deals.review_label                        │   │
│  └─────────────────────────────┬────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 4  Next Action Agent                                    │   │
│  │         src/agents/signals/index.ts → generateNextAction()   │   │
│  │         Model: llama-3.1-8b-instant (Groq)                   │   │
│  │         Prompt: prompts/signals/next-action.prompt            │   │
│  │         Input: brief + signals + missing tasks               │   │
│  │         Output: max 15-word specific action for Quanta       │   │
│  │         e.g. "Ask scout for founder intro and pilot names"   │   │
│  │         Saves to: ai_outputs                                 │   │
│  └─────────────────────────────┬────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 5  Status Promotion                                     │   │
│  │         Has pending missing_info_tasks? → needs_info         │   │
│  │         No missing tasks? → under_review                     │   │
│  │         Updates: deals.status                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Error handling: each step in try/catch — one failure never          │
│  blocks others. Uses Promise.allSettled for Step 2 parallel block.   │
│  Full step log printed to server console.                            │
└──────────────────────────────────────────────────────────────────────┘

        ▼
Deal appears in Quanta /inbox and /deals with:
  ✓ Signal cards (founder/market/traction/conviction + risk flags)
  ✓ Internal brief (facts, open questions, suggested action)
  ✓ Review label badge (Strong Candidate / Worth Exploring / Needs More Info)
  ✓ Duplicate flag (internal note if match found)
  ✓ Auto-promoted status (needs_info or under_review)
```

**Agent files:**
```
src/agents/
  pipeline/index.ts      ← orchestrator — calls all agents in sequence
  duplicate/index.ts     ← Step 1: duplicate detection
  signals/index.ts       ← Steps 2A (signals), 2B (brief), 3 (label), 4 (next action)
  enrichment/index.ts    ← Step 2C: document enrichment
  intake/index.ts        ← submission-time extraction (called during add-startup flow)
  partner/index.ts       ← partner question rewrite + send via OpenClaw
  followup/index.ts      ← scheduled follow-up messages to scouts
  checkin/index.ts       ← weekly check-in messages to scouts
```

**Prompt files for pipeline agents:**
```
src/prompts/
  signals/
    signal-extraction.prompt.ts     ← qualitative VC signal cards
    review-label.prompt.ts          ← strong_candidate | worth_exploring | needs_more_info
    next-action.prompt.ts           ← 15-word specific next step
  briefing/
    internal-brief.prompt.ts        ← partner-facing deal summary
  enrichment/
    enrichment.prompt.ts            ← doc enrichment
    duplicate-detection.prompt.ts   ← LLM duplicate comparison
```

---

## 1. High-Level System Architecture (overview of all layers)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCOUT (mobile/web)                       │
│                                                                 │
│  /scout   /add-startup   /startups/:id   /submissions           │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS (Next.js App Router)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP (localhost:3000)                   │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │  Scout Pages    │    │  Internal Dashboard Pages        │   │
│  │  (app/scout)    │    │  /inbox /deals /scouts /queue    │   │
│  └────────┬────────┘    └──────────────┬───────────────────┘   │
│           │                            │                        │
│  ┌────────▼────────────────────────────▼───────────────────┐   │
│  │                   API Routes (app/api/)                  │   │
│  │                                                          │   │
│  │  /startup/:id/*   /internal/*   /transcribe              │   │
│  │  /scout/*         /auth/*       /email/*                 │   │
│  │  /openclaw/*      /upload/*                              │   │
│  └────────┬────────────────────────────┬────────────────────┘   │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
     ┌──────▼──────┐              ┌──────▼──────┐
     │  SUPABASE   │              │    GROQ      │
     │             │              │              │
     │  Postgres   │              │  llama-3.3   │
     │  Storage    │              │  -70b (LLM)  │
     │  Auth       │              │  whisper-    │
     │             │              │  turbo (STT) │
     └─────────────┘              └──────────────┘
                                        │
                                  ┌─────▼──────┐
                                  │  OPENAI    │
                                  │ embeddings │
                                  └────────────┘

External services:
  Resend → transactional + correspondence emails
  OpenClaw → Telegram/WhatsApp/Slack gateway (Phase 10)
```

---

## 2. Database Schema

```
scouts ────────────────────────────────────────────────────────────
  id, full_name, email, phone
  openclaw_user_id, preferred_channel
  status, invite_status, responsiveness_score
  last_active_at, last_email_sent_at, last_email_responded_at
  supabase_user_id → auth.users(id)

deals ─────────────────────────────────────────────────────────────
  id, startup_name, one_line_description, category, stage
  status: temp | draft | submitted | needs_info | under_review |
          intro_requested | monitor | archived | rejected
  review_label: strong_candidate | worth_exploring | needs_more_info
  submission_mode: voice | manual | document
  source_scout_id → scouts(id)
  scout_conviction, ai_confidence, priority

founders ─────────────────────────────────────────────────────────
  deal_id → deals(id), full_name, email, linkedin_url

deal_messages ────────────────────────────────────────────────────
  deal_id → deals(id), scout_id → scouts(id)
  sender_type: scout | ai | quanta | system
  channel, message_type, body

deal_files ───────────────────────────────────────────────────────
  deal_id → deals(id), storage_url (Supabase Storage)
  file_name, file_type, extracted_text, summary

missing_info_tasks ───────────────────────────────────────────────
  deal_id → deals(id), scout_id → scouts(id)
  info_needed, expected_date, followup_date
  status: pending | completed | deferred | stale | cancelled
  reminder_count

ai_outputs ───────────────────────────────────────────────────────
  deal_id → deals(id)
  output_type: extraction | signal_summary | internal_brief |
               followup_question | duplicate_check | enrichment
  model_name, input_snapshot (jsonb), output_json (jsonb)

deal_answers ─────────────────────────────────────────────────────
  deal_id → deals(id), scout_id → scouts(id)
  question, answer_text, answer_audio_url
  answer_type: text | voice | skipped

scout_notes ──────────────────────────────────────────────────────
  deal_id → deals(id), scout_id → scouts(id)
  note_text, audio_url, note_type: text | voice

internal_notes ───────────────────────────────────────────────────
  deal_id → deals(id), author_name, note (quanta-only)

partner_questions ────────────────────────────────────────────────
  deal_id → deals(id), scout_id → scouts(id)
  question_text, ai_rewritten_message
  status: pending | sent | answered | cancelled

user_roles ───────────────────────────────────────────────────────
  user_id → auth.users(id), role: scout | quanta | admin

scout_invites ────────────────────────────────────────────────────
  email, token (hex), scout_id → scouts(id)
  status: pending | accepted | expired, expires_at

email_correspondence ─────────────────────────────────────────────
  scout_id → scouts(id), email_type, resend_message_id
  sent_at, opened_at, clicked_at, response, responded_at
```

**Deal status flow:**
```
temp ──► draft ──► submitted ──► needs_info ──► under_review
                                                     │
                                              intro_requested
                                                     │
                                          monitor / archived / rejected
```
- `temp` = auto-created when scout starts flow, hidden from all views
- `draft` = explicitly saved by scout, visible in their submissions only
- `submitted` and beyond = visible to Quanta team

---

## 3. Scout Submission Flow

### 3A — Voice Pitch

```
Browser                    Next.js API              Groq           Supabase
   │                           │                     │                │
   │── POST /startup/init ─────►│                     │                │
   │◄─ { deal_id } ────────────│                     │                │
   │   (status = 'temp')        │                     │                │
   │                           │                     │                │
   │  [MediaRecorder captures   │                     │                │
   │   audio for up to 2 min]   │                     │                │
   │                           │                     │                │
   │── POST /startup/:id/audio ─►│                     │                │
   │  (FormData with .webm blob)│                     │                │
   │                           │── transcribe ────────►│                │
   │                           │◄─ transcript ─────────│                │
   │                           │── extract (llama) ───►│                │
   │                           │◄─ ExtractionOutput ───│                │
   │                           │                     │                │
   │                           │── save to deals ────────────────────►│
   │                           │── save to founders ─────────────────►│
   │                           │── save to ai_outputs ───────────────►│
   │                           │── upload audio to Storage ──────────►│
   │                           │                     │                │
   │◄─ { extraction } ─────────│                     │                │
   │  [Step 3: Scout reviews    │                     │                │
   │   and edits inline]        │                     │                │
   │                           │                     │                │
   │── POST /startup/:id/       │                     │                │
   │   questions ───────────────►│                     │                │
   │                           │── generate (llama) ──►│                │
   │◄─ { questions[] } ─────────│◄─ questions ──────────│                │
   │                           │                     │                │
   │  [Scout answers each by    │                     │                │
   │   voice (→ /transcribe)    │                     │                │
   │   or text]                 │                     │                │
   │                           │                     │                │
   │── POST /startup/:id/       │                     │                │
   │   answers ─────────────────►│─── save answers ─────────────────►│
   │                           │                     │                │
   │── POST /startup/:id/notes ─►│─── save notes ───────────────────►│
   │                           │                     │                │
   │── POST /startup/:id/submit ─►│                     │                │
   │                           │── status = submitted ───────────────►│
   │                           │── [background]        │                │
   │                           │   generate signals ──►│                │
   │                           │   generate brief ────►│                │
```

### 3B — Voice Answer in Question Round

```
   │  [Scout clicks mic on a question]
   │── POST /api/transcribe ────►│
   │  (FormData: audio, context="answer")
   │                           │── Groq whisper-turbo ─►│
   │                           │◄─ raw transcript ────────│
   │                           │── Groq llama (polish) ───►│
   │                           │◄─ cleaned text ───────────│
   │◄─ { transcript, polished } │
   │  [Scout sees both, picks one, can edit]
```

### 3C — Save as Draft

```
   │── POST /startup/:id/save-draft ─►│
   │  (current extracted fields)      │── UPDATE deals
   │                                  │   status = 'draft' ──────────►│
   │◄─ { saved: true } ───────────────│
   │  [Green "Draft saved" button,     │
   │   deal now appears in /submissions]
```

---

## 4. AI Pipeline

All requests route through `src/lib/openai/client.ts` which delegates to Groq when `GROQ_API_KEY` is present.

```
runStructuredCompletion(system, user, model)
  │
  ├── GROQ_API_KEY set?
  │     YES → groqStructuredCompletion()
  │              │── Groq API /chat/completions
  │              │   model: llama-3.3-70b-versatile
  │              │   response_format: { type: "json_object" }
  │              └── parse JSON → return T
  │
  └── NO → OpenAI /chat/completions
            model: gpt-4o
            └── parse JSON → return T

runTextCompletion(system, user, model)
  │
  ├── GROQ_API_KEY set?
  │     YES → groqTextCompletion()
  │              Groq model: llama-3.1-8b-instant
  └── NO → OpenAI gpt-4o-mini

transcribeAudio(buffer, filename)
  │
  ├── GROQ_API_KEY set?
  │     YES → transcribeWithGroq()
  │              Groq model: whisper-large-v3-turbo
  └── NO → OpenAI whisper-1

generateEmbedding(text)
  └── Always OpenAI text-embedding-3-small
      (Groq has no embeddings API)
```

**Model assignments by task:**

| Task | Model | Speed |
|---|---|---|
| Deal extraction | `llama-3.3-70b-versatile` | ~2s |
| Signal generation | `llama-3.3-70b-versatile` | ~2s |
| Internal brief | `llama-3.3-70b-versatile` | ~3s |
| Market analysis | `llama-3.3-70b-versatile` | ~3s |
| Question generation | `llama-3.3-70b-versatile` | ~2s |
| Partner question rewrite | `llama-3.3-70b-versatile` | ~1s |
| Voice transcription | `whisper-large-v3-turbo` | ~2-4s |
| Answer/note polish | `llama-3.1-8b-instant` | <1s |
| Check-in messages | `llama-3.1-8b-instant` | <1s |
| Commitment detection | `llama-3.1-8b-instant` | <1s |

---

## 5. File Upload Architecture

Files never pass through the Next.js server — they go directly to Supabase Storage.

```
Browser                   Next.js API              Supabase Storage
   │                          │                          │
   │── GET /api/upload/presign?bucket=deal-files ────────►│
   │                          │── createSignedUploadUrl()►│
   │◄─ { signed_url, storage_url } ────────────────────────│
   │                          │                          │
   │── PUT {signed_url} ─────────────────────────────────►│
   │  (file bytes directly)   │              file stored  │
   │                          │                          │
   │── POST /startup/:id/file ►│                          │
   │  { storage_url, file_name }│                         │
   │                          │── INSERT deal_files ─────►│
   │                          │── AI enrichment ─────────►Groq
   │◄─ { extraction } ─────────│                          │
```

**Why this approach:**
- Vercel has a 4.5MB body limit on API routes
- Pitch decks can be 5-25MB
- Supabase Storage handles any file size
- Next.js API route only receives the URL string, not the bytes

**Buckets:**
- `deal-files` — PDFs, decks, screenshots, documents
- `scout-audio` — voice pitch recordings, voice answers

---

## 6. Authentication Flow

```
Admin (Quanta team)        Next.js API              Supabase Auth
   │                          │                          │
   │  Adds scout via UI        │                          │
   │── POST /api/auth/invite ──►│                          │
   │                          │── INSERT scouts           │
   │                          │── INSERT scout_invites    │
   │                          │── Resend email sent       │
   │                          │                          │

Scout (receives email)
   │  Clicks invite link       │                          │
   │── GET /complete-signup    │                          │
   │   ?token=xxx              │                          │
   │                          │                          │
   │  Validates token          │                          │
   │── GET /api/auth/           │                          │
   │   complete-signup?token=xx►│                          │
   │◄─ { valid, email, name } ──│                          │
   │                          │                          │
   │  Fills password + phone   │                          │
   │── POST /api/auth/          │                          │
   │   complete-signup ─────────►│                          │
   │   { token, password }     │── auth.admin.createUser()►│
   │                          │◄─ { user } ───────────────│
   │                          │── INSERT user_roles       │
   │                          │── UPDATE scouts           │
   │                          │   supabase_user_id = user.id
   │                          │── UPDATE scout_invites    │
   │                          │   status = 'accepted'     │
   │◄─ { success } ────────────│                          │
   │  Redirected to login      │                          │
```

**Middleware protection** (`src/middleware.ts`):
- Development: permissive (all routes open, demo works without auth)
- Production: Supabase SSR session check → role-based redirect
  - No session → `/`
  - Scout tries `/inbox` → redirected to `/scout`
  - Quanta tries `/scout` → redirected to `/inbox`

---

## 7. Email System

```
Weekly check-in (every Monday 10am UTC via Vercel cron):
  Scheduler → GET /api/internal/scheduler?job=checkins
    └── runAllCheckins()
        └── For each active scout:
            └── Groq generates personalized message
            └── sendEmail() via Resend
            └── INSERT email_correspondence

Scout receives email with two buttons:
  "Yes, I've got something" → GET /api/email/respond?scout=:id&response=yes_have_startup
    └── UPDATE email_correspondence (response + responded_at)
    └── UPDATE scouts (last_email_responded_at)
    └── Redirect → /add-startup

  "Nothing this week" → GET /api/email/respond?scout=:id&response=nothing_this_week
    └── UPDATE email_correspondence
    └── Show HTML thank-you page
```

---

## 8. Quanta Team — Deal Review Flow

```
Partner opens /deals
  └── GET /api/internal/deals
      └── Supabase query:
          status NOT IN ('draft', 'temp')
          startup_name IS NOT NULL
          └── Joins: scouts, signals (from ai_outputs)

Partner opens deal detail /deals/:id
  └── GET /api/internal/deals/:id
      └── Parallel queries:
          deals + scouts + founders + messages + files +
          missing_info_tasks + ai_outputs (signals + brief) +
          internal_notes + partner_questions

Partner changes status (dropdown on detail page)
  └── PATCH /api/internal/deals/:id/status
      └── UPDATE deals SET status = :new_status

Partner adds internal note
  └── POST /api/internal/deals/:id/notes
      └── INSERT internal_notes

Partner clicks "Ask Scout"
  └── POST /api/internal/deals/:id/ask-scout
      └── Groq rewrites question for scout
      └── Sends via OpenClaw (or simulated in dev)
      └── INSERT partner_questions
      └── INSERT deal_messages (sender_type = 'quanta')

Partner clicks "Run Analysis" on Analyze tab
  └── POST /api/internal/deals/:id/analyze
      └── Assembles deal context
      └── Groq llama-3.3-70b generates market analysis
      └── INSERT ai_outputs (type = 'enrichment')
```

---

## 9. Prompt Files Reference

All prompts live in `src/prompts/`. Each file exports a `SYSTEM_PROMPT` constant and a `buildUserPrompt()` function.

```
src/prompts/
  intake/
    extraction.prompt.ts           → raw message → ExtractionOutput JSON
    next-question.prompt.ts        → picks best single follow-up question
    commitment-extraction.prompt.ts → detects date commitments
    question-generation.prompt.ts  → generates 3-5 scout questions
  signals/
    signal-extraction.prompt.ts    → qualitative VC signal cards
  briefing/
    internal-brief.prompt.ts       → partner-facing deal brief
  analysis/
    market-analysis.prompt.ts      → market landscape, comps, thesis
  partner/
    question-rewrite.prompt.ts     → rewrites internal questions for scouts
    recommended-messages.prompt.ts → suggests follow-up questions for partner
  checkin/
    weekly-checkin.prompt.ts       → personalized check-in messages
  followup/
    followup.prompt.ts             → follow-up messages for promised items
  enrichment/
    enrichment.prompt.ts           → doc/URL enrichment
    duplicate-detection.prompt.ts  → detect duplicate submissions
```

**To modify a prompt:** edit the file directly. The `SYSTEM_PROMPT` constant controls behavior. The `build*UserPrompt()` function controls what data is injected. Do not embed prompt strings in agent or API route files.

---

## 10. API Routes Reference

### Scout submission
| Method | Route | What it does |
|---|---|---|
| POST | `/api/startup/init` | Creates deal with `status='temp'` |
| POST | `/api/startup/:id/audio` | Whisper transcription + Groq extraction |
| POST | `/api/startup/:id/manual` | Manual form → extraction |
| POST | `/api/startup/:id/file` | Document enrichment |
| POST | `/api/startup/:id/questions` | Generate questions from extraction |
| POST | `/api/startup/:id/answers` | Save question answers |
| POST | `/api/startup/:id/notes` | Save personal notes |
| POST | `/api/startup/:id/save-draft` | Promote to `status='draft'`, save fields |
| POST | `/api/startup/:id/submit` | Set submitted, fire background AI |
| PATCH | `/api/startup/:id/update` | Update extracted fields (Step 3 edits) |
| GET | `/api/startup/:id/draft` | Get current draft state |
| GET | `/api/upload/presign` | Supabase Storage presigned URL |
| POST | `/api/transcribe` | Groq Whisper + polish (answers/notes) |

### Scout portal
| Method | Route | What it does |
|---|---|---|
| GET | `/api/scout/deals` | Scout's own deals (excludes temp) |
| POST | `/api/scout/deals/:id/reply` | Scout replies, detects commitments |

### Internal dashboard
| Method | Route | What it does |
|---|---|---|
| GET | `/api/internal/deals` | Deal inbox (excludes draft/temp) |
| GET | `/api/internal/deals/:id` | Full deal with all relations |
| PATCH | `/api/internal/deals/:id/status` | Update status or priority |
| POST | `/api/internal/deals/:id/ask-scout` | Rewrite + send via OpenClaw |
| POST | `/api/internal/deals/:id/notes` | Add internal partner note |
| POST | `/api/internal/deals/:id/analyze` | Run market analysis |
| GET | `/api/internal/deals/:id/recommended-messages` | AI follow-up suggestions |
| GET | `/api/internal/scouts` | All scouts with deal counts |
| GET | `/api/internal/scouts/:id` | Scout detail + deals + email history |
| GET | `/api/internal/queue` | Pending missing_info_tasks |
| GET | `/api/internal/analytics` | Totals, pipeline, categories, activity |
| POST | `/api/internal/scheduler` | Trigger scheduler jobs manually |

### Auth + email
| Method | Route | What it does |
|---|---|---|
| POST | `/api/auth/invite` | Create scout + send invite email |
| GET | `/api/auth/complete-signup` | Validate invite token |
| POST | `/api/auth/complete-signup` | Create Supabase user + set role |
| GET | `/api/auth/role` | Current session role |
| GET | `/api/email/respond` | Handle email CTA clicks |
| POST | `/api/openclaw/webhook` | Receive OpenClaw messages |

---

## 11. Environment Variables

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase database + storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Client-side Supabase queries |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side admin operations, bypasses RLS |
| `GROQ_API_KEY` | ✅ | All LLM + transcription (preferred) |
| `OPENAI_API_KEY` | ✅ | Embeddings (always), LLM fallback if no Groq |
| `RESEND_API_KEY` | ✅ | Sending emails |
| `RESEND_FROM_EMAIL` | ✅ | Email from address |
| `NEXT_PUBLIC_APP_URL` | ✅ | Email links, redirect URLs |
| `CRON_SECRET` | ✅ prod | Protects scheduler endpoint from outside calls |
| `OPENCLAW_API_KEY` | Phase 10 | Send messages via OpenClaw |
| `OPENCLAW_SIMULATE` | Dev | Log instead of sending (set `true`) |

---

## 12. Common Issues and Fixes

**Problem: Orphan draft deals appear in scout's submissions**
- Cause: Scout started the flow but didn't explicitly save
- Fix: Only deals with `status != 'temp'` appear. `temp` is set on init, `draft` only set when scout clicks "Save as Draft"

**Problem: "Unnamed" deals appear in team inbox**
- Cause: Test API calls that created deals without names
- Fix: Inbox query filters `startup_name IS NOT NULL AND status NOT IN ('draft', 'temp')`
- SQL cleanup: `DELETE FROM deals WHERE startup_name IS NULL AND status IN ('temp', 'draft');`

**Problem: Transcription is slow**
- Cause: Groq key not configured, falling back to OpenAI Whisper
- Fix: Check `GROQ_API_KEY` in `.env.local`, restart server

**Problem: AI responses look different from before**
- Cause: Groq's Llama may interpret prompts slightly differently from GPT-4o
- Fix: Adjust the specific prompt in `src/prompts/`. Common fix: be more explicit in system prompt.

**Problem: File upload fails with 4.5MB error**
- Cause: Large file sent through Next.js API route instead of direct to Supabase
- Fix: Always use presigned URL flow (`/api/upload/presign` → PUT to signed URL → `/api/startup/:id/file`)

**Problem: Deal submitted but no signals/brief generated**
- Cause: Background AI generation failed silently after submit
- Fix: Check server logs for "Background AI generation failed". Re-trigger manually via deal detail → Analyze tab → Run Analysis

**Problem: Email CTA links don't work in development**
- Cause: `NEXT_PUBLIC_APP_URL` is set to localhost but email was received elsewhere
- Fix: Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` and open the link on the same machine

**Problem: Scout can't see their draft after saving**
- Cause: Draft has `status='temp'` not `status='draft'`
- Fix: Ensure scout clicked "Save as Draft" — the button promotes to `draft` status

---

## 13. Cron Jobs (Vercel)

Defined in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/internal/scheduler?job=followups", "schedule": "0 9 * * *" },
    { "path": "/api/internal/scheduler?job=checkins",  "schedule": "0 10 * * 1" }
  ]
}
```

- Daily at 9am UTC: send follow-up reminders for overdue missing_info_tasks
- Monday at 10am UTC: send weekly check-ins to active scouts

In development, trigger manually: click "Run Follow-up Agent" button on `/queue` page, or POST to `/api/internal/scheduler` with `{ "job": "followups" | "checkins" | "all" }`.

---

## 14. Phases Completed vs Remaining

See `PHASES.md` for the full tracker.

**Completed:** Phases 1-8 (foundation → auth → scout submission → scout review → Quanta inbox → scout management → email correspondence → analytics)

**Remaining:**
- Phase 9: Real-time indicator ticking during voice recording (3s audio chunks → Groq → tick UI)
- Phase 10: Vercel deploy + Telegram bot via OpenClaw
