# Quanta Scout OS — Full Product Context

**Version:** 2.0 (post-vision revision)
**Status:** Blueprint for full implementation
**Deployment target:** Vercel + Supabase

---

## 1. What This Product Is

Quanta Scout OS is a venture scout management platform with two distinct user roles — **Scouts** (people who source startups) and the **Quanta Team** (the investment team that reviews them).

The product replaces messy WhatsApp chains, CRM forms, and spreadsheets with a structured but lightweight product. The experience is designed to feel minimal and fast — closer to Uber or Linear than Salesforce.

**The founding UX principle:** Scouts should never feel like they are doing admin work. Every screen has one job and gets out of the way.

**What's already built (Phase 1 foundation):**
- Full project folder structure with AI prompt files, agent logic, and API route shells
- Type definitions for all entities
- Database migration SQL
- Demo seed data (FlowOps, CampusPay, MedSync AI)
- Working UI pages: dashboard inbox, deal detail, follow-up queue, scouts board, scout chat, add-startup (mode selection through submit), startup detail page
- Demo mode system (works without real DB/API keys)
- Dev server running at localhost:3001

---

## 2. User Roles

| Role | Access | Entry Point |
|---|---|---|
| **Scout** | Scout portal (`/scout/*`) | Invited by admin, completes signup via email link |
| **Quanta Team** | Internal dashboard (`/inbox`, `/deals`, `/scouts`, etc.) | Admin-created account |
| **Admin** | Manages both sides | Supabase admin or a super-user role |

---

## 3. Complete Feature Map

### Scout Side

#### 3.1 Auth & Onboarding
- Admin adds scout via Scout Management page (name + email)
- System sends branded invite email via Resend
- Scout clicks link → lands on account setup page
- Scout sets: password + confirm password + phone number
- System sends OTP to phone via Twilio
- Scout enters OTP → verified → lands on scout home
- All managed via Supabase Auth (email + phone)

#### 3.2 Scout Home (`/scout`)
- Greeting with scout's name
- Prompt: "Seen any interesting startup recently?"
- CTA: `+ Add Startup` → navigates to add-startup flow
- List of recent submissions with status badges and quick-action buttons
- Notification dot for pending questions from Quanta

#### 3.3 Add Startup Flow (`/add-startup`) — 6 steps, single page with step progression

**Step 1 — Mode Selection**
- Three cards: Voice Pitch · Manual Entry · Document Upload
- Selection persists through the session

**Step 2A — Voice Pitch Studio**
- Large record button (indigo → red when active)
- Hard 2-minute limit with visible countdown timer
- Soft indicator checklist: Problem · Product · Why Interesting · Traction
- Real-time AI tick-off: as user speaks, indicators get checked when topics are detected
  - Implementation: stream audio in 3-second chunks to a real-time transcription endpoint
  - Each chunk runs a lightweight classification prompt → if topic detected → tick the indicator
- Stop button ends recording early
- OR: upload a pre-recorded voice file via file picker
- On stop → POST audio to `/api/startup/:id/audio` → Whisper transcription → extraction AI → autofill draft

**Step 2B — Manual Entry**
- Fields: Startup Name · Founder · What are they building? · Why is it interesting? · Any traction?
- All textarea fields, no required fields enforced at this step
- POST `/api/startup/:id/manual`

**Step 2C — Document Upload**
- Drag-and-drop or click-to-upload
- Accepts: PDF, PPTX, images, DOCX
- File size limit: 25MB
- POST to Supabase Storage → extract text → AI extraction → autofill draft
- POST `/api/startup/:id/file`

**Step 3 — AI Autofill Review**
- Shows extracted fields: Startup · Founder · What it does · Why interesting
- Editable fields — scout can correct any AI extraction error
- Shows "Missing" tags for fields the AI couldn't fill
- Option to attach additional documents (deck, screenshots) for better context
- Attached docs are processed and their data merged into existing fields

**Step 4 — Question Round**
- AI generates 3–5 questions based on what's still unclear in the extraction
- Scout can: answer via text · answer via voice (voice note per question) · skip
- Scout can also write in their own additional questions
- For voice answers: small recording widget per question (30-second limit)
- POST `/api/startup/:id/answers`
- Responses stored as `deal_messages` with `type: scout_answer`

**Step 5 — Scout Notes (Personal)**
- Two options: Record Voice Note · Write Thoughts
- These are the scout's private opinions/gut feel — not structured fields
- Stored as `deal_messages` with `type: scout_note`
- POST `/api/startup/:id/notes`

**Step 6 — Submit**
- Summary card: startup name, what it does, missing fields count
- One big "Submit to Quanta" button
- POST `/api/startup/:id/submit` → sets `deal.status = submitted`
- Triggers: Quanta dashboard notification + background enrichment job

#### 3.4 Review / Startup List Page (`/scout/startups`)
- Card view of all submitted startups
- Card shows: name · status badge · last activity · quick action
- Filter bar: All · Needs Info · Answered · Under Review
- Search by startup name
- Click card → Startup Detail page

#### 3.5 Startup Detail Page (`/scout/startups/:id`)
- Header: startup name · status badge · category
- Summary section (editable): what it does, why interesting, founder, category
- Missing info section: list of pending items with status and dates
- **Dedicated Conversation Thread** (per startup):
  - Shows all messages between scout and Quanta team (AI-relayed)
  - Scout can reply inline
  - System auto-detects date commitments in replies ("I'll get it by Friday") → creates `missing_info_task`
  - Scout can upload documents directly in the chat (stored as `deal_files` linked to that deal)
  - System messages appear for automated reminders ("Follow-up: May 23")
- **Scout Voice Notes** section: recordings the scout added about this startup
- **Uploads** section: all files linked to this deal
- **Generate Email** button: opens modal with AI-written email to startup requesting missing docs/info
  - Editable before sending
  - Copy or Send via Gmail (Gmail API OAuth or mailto link)
- Action buttons: Add Update · Upload Document · Record Note · Generate Email

#### 3.6 Scout Dashboard / Notifications (`/scout/dashboard`)
- Weekly reminder: "Any new startups this week?"
- Notifications: pending questions, follow-up reminders, status changes
- Analytics of scout's own portfolio: submissions accepted, in review, archived
- Simple stats: total submitted · high signal · pending action

---

### Quanta Team Side

#### 3.7 Command Center / Dashboard (`/inbox`)
- Today's summary: new startups · pending reviews · high priority
- High-priority deal cards with quick actions
- Recent activity feed (new submissions, answered questions, status changes)
- Distribution charts: by status, by category, by scout

#### 3.8 Manage Applications (`/deals`)
- Card view (not table) — each card shows:
  - Startup name · one-line description · category
  - Scout name
  - Signal indicators (Founder / Traction / Market — qualitative labels only, no numbers)
  - Status badge
  - Days since last activity
  - Score/review indicator (derived from AI analysis + scout conviction — see below)
- Filters: All · New · Needs Info · High Signal · Under Review · Archived
- Search by startup name, scout, category
- Sort: Newest · Most Active · Priority

**Score/Review Indicator:**
Not a fake numeric score. Instead, a 3-tier label derived from:
- AI signal extraction (founder/traction/market levels)
- Scout conviction level
- Completeness of submission
- Output: "Strong Candidate" · "Worth Exploring" · "Needs More Info"

Click card → Deal Detail Page

#### 3.9 Deal Detail Page (`/deals/:id`)
Single-page view with tab navigation. Everything about one company in one place.

**Tab 1 — Overview**
- Startup name, one-line description, category, stage, source
- Founder info: name, LinkedIn, background summary
- Full field answers from the submission (structured)
- Scout voice notes (audio player inline)
- All uploaded files with previews
- AI Brief panel: what it does · why it may matter · known facts · open questions · suggested next action
- Signal cards: Founder Signal · Traction Signal · Market Signal · Scout Conviction (each with evidence text)
- Risk flags list
- Internal notes (partner-only, not visible to scout)
- Status + priority controls

**Tab 2 — Analyze** (`/deals/:id?tab=analyze`)
- AI-generated analysis section with:
  - Market landscape: similar startups (via web research or embedding similarity search)
  - Industry insights: relevant trends matching this startup's category
  - Comparable deals in the Quanta portfolio or known investments
  - Open questions for deeper diligence
- Powered by: OpenAI GPT-4o with web search (or structured prompts against enrichment data)
- "Refresh Analysis" button to re-run with latest data
- Important: This tab is clearly labeled as "AI-generated — verify independently"

**Tab 3 — Scout Interaction** (`/deals/:id?tab=interaction`)
- Left panel: conversation thread (full history, read-only)
- Right panel: compose area
  - Text input for partner's internal question
  - "Rewrite for Scout" button → AI reformulates in casual, non-CRM language → preview shown
  - Edit before sending
  - "Send via OpenClaw" button (or simulated send in demo mode)
  - Last activity timestamp
  - "Scout has X pending questions" indicator
- Recommended messages: AI suggests 2–3 relevant follow-up questions based on what's missing
- Below compose: full chronological interaction history (all messages, questions, answers)

#### 3.10 Scout Management (`/scouts`)
- List view with cards: scout name · focus areas · submissions count · last active · responsiveness score
- Filter: Active · Inactive · Paused
- "Add Scout" button → opens small slide-over form:
  - Name
  - Email
  - Focus areas (multi-select)
  - Preferred channel (Telegram / Web)
  - Submit → system sends invite email → scout record created with `status: invited`
- Last email sent column: shows when last correspondence email was sent
- Last response: when did scout last reply to anything (message, email, submission)
- If inactive for 14+ days: show amber indicator

**Scout Detail Page (`/scouts/:id`)**
- Scout profile: name, contact, focus areas, channel, responsiveness score
- Activity timeline: last active, last submission, last email opened, last check-in
- Startups they've introduced: card grid (same card format as deal list)
- Mini analytics:
  - Submissions over time (simple bar chart)
  - Signal quality distribution: how many high/medium/low signal submissions
  - Response rate to follow-up questions
- Actions: Send Check-in · Edit Profile · Pause Scout · Remove Scout

---

## 4. Email System

### 4.1 Transactional Emails (via Resend)
| Email | Trigger | Content |
|---|---|---|
| Invite | Admin adds scout | Welcome + CTA to complete signup |
| OTP | Phone verification | 6-digit code |
| Password Reset | Scout requests | Reset link |
| Submission Confirmation | Scout submits startup | Deal received confirmation |

### 4.2 Correspondence Emails (Branded, Interactive)

Sent to scouts on a schedule. Custom HTML design — minimal, clean, Uber-style.

**Weekly Check-in Email:**
- Subject: "What's been crossing your radar?"
- Body: friendly 2-3 sentence message
- Two CTA buttons:
  - **"Yes, I've got something"** → links to `/add-startup` (auto-authenticated via magic link token)
  - **"Nothing this week"** → hits a webhook endpoint that logs the response and updates `scout.last_responded_at`
- If scout clicks "nothing this week" → website updates `scout.email_response = "nothing"` for that week
- If scout clicks "yes" → redirects to add-startup with session restored

**Email design:** Use React Email (component-based email templates) with Resend delivery.

---

## 5. Authentication Architecture

### 5.1 Supabase Auth Setup
- Email/password auth via Supabase Auth
- Phone OTP via Supabase Auth (uses Twilio under the hood)
- Row-level security (RLS) on Supabase tables to enforce role isolation

### 5.2 Role System
Two roles tracked in a `user_roles` table (or Supabase custom claims):
- `scout` — accesses `/scout/*` routes only
- `quanta` — accesses `/inbox`, `/deals`, `/scouts`, `/analytics`, `/queue`

### 5.3 Auth Flow
```
Admin creates scout → Supabase invite email sent via Resend
Scout clicks link → /auth/complete-signup?token=xxx
Scout fills: password + confirm + phone
System: creates Supabase user → sends OTP → verifies phone → sets role = scout → redirects /scout
```

### 5.4 Middleware (Next.js)
`middleware.ts` at project root:
- Reads Supabase session cookie on every request
- `/scout/*` routes: redirect to `/login` if no session, redirect to `/scout` if session has role `quanta`
- `/inbox`, `/deals`, `/scouts` routes: redirect to `/login` if no session, redirect to `/inbox` if role is `scout`
- `/login` and `/auth/*`: always accessible

---

## 6. Vercel Deployment Architecture

### 6.1 What Vercel Handles
- Next.js App Router (server components + API routes)
- Static assets (CSS, images, fonts)
- Edge middleware (auth + route protection)
- Cron jobs (via `vercel.json` cron config)

### 6.2 What Supabase Handles
- Postgres database (all tables)
- File storage (audio files, decks, PDFs, images)
- Auth (sessions, OTP, invite tokens)
- Row-level security

### 6.3 What External Services Handle
| Service | Purpose | SDK |
|---|---|---|
| OpenAI | Text extraction, signals, brief, question rewrite, real-time indicator ticking | `openai` npm package |
| Resend | All outbound email (transactional + correspondence) | `resend` npm package |
| Twilio | Phone OTP (via Supabase Auth config) | Supabase handles, no direct SDK needed |

### 6.4 Vercel Function Constraints
Every API route runs as a Vercel Serverless Function:
- **Default timeout:** 10 seconds (Hobby plan) / 60 seconds (Pro)
- **Body size limit:** 4.5MB for standard functions
- **Audio files:** Voice pitches (up to 2 min at 128kbps ≈ 2MB compressed) → fine for direct upload
- **PDF/deck files:** Up to 25MB → must upload directly to Supabase Storage from browser, not through the API route. API route only receives the storage URL.
- **Long AI jobs:** Signal extraction, brief generation, enrichment → run as background jobs (Supabase Edge Functions triggered after submission), not inline in the API response

### 6.5 File Upload Strategy (Critical)
```
Browser → Supabase Storage (direct upload, presigned URL)
Browser sends storage_url to API → API creates deal_files record
Background: API route triggers enrichment job async (non-blocking)
```

This avoids hitting Vercel's 4.5MB body limit and keeps the API response fast.

```ts
// Pattern for file upload:
// 1. Client calls GET /api/upload/presign → gets a Supabase presigned URL
// 2. Client uploads file directly to Supabase Storage URL
// 3. Client calls POST /api/startup/:id/file { storage_url, file_name, file_type }
// 4. API creates deal_files record, enqueues enrichment
```

### 6.6 Audio Processing Strategy (Critical)
Voice pitch recording (up to 2 min):
- Record in browser using `MediaRecorder` API → produces WebM/OGG blob
- Compress client-side if needed (target <4MB)
- Upload to Supabase Storage → get storage_url
- POST storage_url to `/api/startup/:id/audio`
- API downloads file from Supabase Storage → streams to Whisper API → returns transcript
- Transcript goes to extraction prompt → returns structured data
- Timeline: ~8-15 seconds total processing — fits within 60s Vercel Pro timeout

**Real-time indicator ticking during recording:**
- Every 3 seconds during recording, send the last 3-second audio chunk to `/api/startup/live-tick`
- That endpoint runs Whisper on the chunk → runs a fast classification prompt (gpt-4o-mini) → returns which indicators were mentioned
- Client updates indicator UI
- This requires careful streaming — use Vercel's streaming response support (`Response` with readable stream)
- Fallback: disable real-time ticking for Hobby plan (run all at once on stop)

### 6.7 Cron Jobs (Vercel Cron)
Defined in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/internal/scheduler?job=followups&cron=1",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/internal/scheduler?job=checkins&cron=1",
      "schedule": "0 10 * * 1"
    }
  ]
}
```
- Protect cron endpoints with `CRON_SECRET` environment variable
- Vercel sends the secret as a header: `Authorization: Bearer {CRON_SECRET}`

### 6.8 Environment Variables for Vercel
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# OpenAI
OPENAI_API_KEY

# Resend (email)
RESEND_API_KEY
RESEND_FROM_EMAIL=scout@quantaventures.com

# App
NEXT_PUBLIC_APP_URL=https://quanta-scout-os.vercel.app
CRON_SECRET=<random-secret>

# OpenClaw (Phase 7)
OPENCLAW_BASE_URL
OPENCLAW_API_KEY
OPENCLAW_SIMULATE=false
```

---

## 7. Database Schema Changes (v2)

Additions needed beyond the existing `001_initial_schema.sql`:

### New tables

**`user_roles`**
```sql
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('scout', 'quanta', 'admin')),
  created_at timestamptz default now()
);
```

**`scout_invites`**
```sql
create table scout_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  invited_by text,
  status text default 'pending', -- pending / accepted / expired
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);
```

**`email_correspondence`**
```sql
create table email_correspondence (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references scouts(id) on delete cascade,
  email_type text not null, -- weekly_checkin / followup / invite / custom
  subject text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  response text, -- 'yes_have_startup' / 'nothing_this_week' / null
  responded_at timestamptz,
  resend_message_id text
);
```

**`deal_answers`**
```sql
create table deal_answers (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id),
  question text not null,
  answer_text text,
  answer_audio_url text,
  answer_type text default 'text', -- text / voice / skipped
  created_at timestamptz default now()
);
```

**`scout_notes`**
```sql
create table scout_notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id),
  note_text text,
  audio_url text,
  note_type text default 'voice', -- voice / text
  created_at timestamptz default now()
);
```

### Changes to existing tables

**`scouts` — add columns:**
```sql
alter table scouts
  add column supabase_user_id uuid references auth.users(id),
  add column phone_verified boolean default false,
  add column invite_status text default 'invited', -- invited / active / paused
  add column last_email_sent_at timestamptz,
  add column last_email_responded_at timestamptz;
```

**`deals` — add columns:**
```sql
alter table deals
  add column submission_mode text, -- voice / manual / document
  add column review_label text; -- 'strong_candidate' / 'worth_exploring' / 'needs_more_info'
```

---

## 8. AI Pipeline Map

| Feature | Prompt File | Model | Output |
|---|---|---|---|
| Voice transcription | — (Whisper) | `whisper-1` | Plain text transcript |
| Deal extraction from transcript | `intake/extraction.prompt.ts` | `gpt-4o` | `ExtractionOutput` JSON |
| Real-time indicator ticking | `intake/live-tick.prompt.ts` (new) | `gpt-4o-mini` | `{indicators_covered: string[]}` |
| Question generation for scout | `intake/question-generation.prompt.ts` (new) | `gpt-4o` | `{questions: string[]}` |
| Document enrichment | `enrichment/enrichment.prompt.ts` | `gpt-4o` | Structured enrichment JSON |
| Duplicate detection | `enrichment/duplicate-detection.prompt.ts` | `gpt-4o-mini` | `DuplicateCheckOutput` |
| Signal extraction | `signals/signal-extraction.prompt.ts` | `gpt-4o` | `SignalOutput` |
| Internal brief | `briefing/internal-brief.prompt.ts` | `gpt-4o` | `InternalBrief` |
| Review label | `signals/review-label.prompt.ts` (new) | `gpt-4o-mini` | `strong_candidate / worth_exploring / needs_more_info` |
| Market analysis | `analysis/market-analysis.prompt.ts` (new) | `gpt-4o` | `MarketAnalysis` JSON |
| Partner question rewrite | `partner/question-rewrite.prompt.ts` | `gpt-4o` | `PartnerQuestionRewrite` |
| Recommended messages | `partner/recommended-messages.prompt.ts` (new) | `gpt-4o-mini` | `{messages: string[]}` |
| Scout check-in | `checkin/weekly-checkin.prompt.ts` | `gpt-4o-mini` | Plain text |
| Follow-up message | `followup/followup.prompt.ts` | `gpt-4o-mini` | Plain text |
| Generate email to startup | `scout/startup-email.prompt.ts` (new) | `gpt-4o` | Email subject + body |

---

## 9. New Prompts to Build

```
src/prompts/
  intake/
    live-tick.prompt.ts               ← real-time indicator detection from 3s audio chunk
    question-generation.prompt.ts     ← generate 3-5 questions from extracted deal data
  signals/
    review-label.prompt.ts            ← derive Strong Candidate / Worth Exploring / Needs More Info
  analysis/
    market-analysis.prompt.ts         ← market landscape, comps, industry trends
  partner/
    recommended-messages.prompt.ts    ← suggest 2-3 follow-up messages for partner
  scout/
    startup-email.prompt.ts           ← generate email to startup requesting docs/info
```

---

## 10. New API Routes to Build

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/invite` | POST | Admin invites scout — creates invite record + sends email |
| `/api/auth/complete-signup` | POST | Scout completes account from invite link |
| `/api/auth/verify-phone` | POST | Submit OTP, mark phone verified |
| `/api/upload/presign` | GET | Returns Supabase presigned URL for direct browser upload |
| `/api/startup/init` | POST | Creates draft deal, returns deal_id |
| `/api/startup/:id/audio` | POST | Receives storage_url of audio, triggers transcription + extraction |
| `/api/startup/:id/live-tick` | POST | Real-time indicator check from 3s audio chunk |
| `/api/startup/:id/manual` | POST | Save manual form fields |
| `/api/startup/:id/file` | POST | Receives storage_url of file, triggers enrichment |
| `/api/startup/:id/answers` | POST | Save question-round answers |
| `/api/startup/:id/notes` | POST | Save scout voice/text notes |
| `/api/startup/:id/submit` | POST | Finalize deal → status = submitted |
| `/api/scout/dashboard` | GET | Scout home data (deals, pending questions, notifications) |
| `/api/scout/deals` | GET | All deals for a scout |
| `/api/internal/deals/:id/analyze` | POST | Trigger market analysis AI job |
| `/api/internal/deals/:id/generate-email` | POST | Generate email to startup from scout |
| `/api/internal/scouts` | POST | Add scout (creates invite) |
| `/api/internal/scouts/:id` | GET | Scout detail with deal list |
| `/api/email/respond` | POST | Handles email CTA clicks (yes/nothing) for weekly check-in |

---

## 11. Page / Route Structure (Full)

```
app/
  (auth)/
    login/page.tsx                    ← shared login for both roles
    complete-signup/page.tsx          ← invite link → account setup
    verify-phone/page.tsx             ← OTP entry

  (scout)/
    scout/page.tsx                    ← scout home (exists, needs auth + real data)
    add-startup/page.tsx              ← 6-step submission flow (exists, needs wiring)
    startups/
      page.tsx                        ← startup list / review page (build)
      [id]/page.tsx                   ← startup detail + chat (exists, needs wiring)
    dashboard/page.tsx                ← scout analytics + notifications (build)
    chat/page.tsx                     ← general conversation with Quanta (exists)

  (dashboard)/
    inbox/page.tsx                    ← command center (exists, needs real data)
    deals/
      page.tsx                        ← manage applications card view (build)
      [id]/page.tsx                   ← deal detail with tabs (exists, needs 3 tabs)
    scouts/
      page.tsx                        ← scout management (exists, needs add scout)
      [id]/page.tsx                   ← scout detail (build)
    queue/page.tsx                    ← follow-up queue (exists)
    analytics/page.tsx                ← charts + illustrations (build)

  api/
    auth/
      invite/route.ts
      complete-signup/route.ts
      verify-phone/route.ts
    upload/
      presign/route.ts
    startup/
      init/route.ts
      [id]/
        audio/route.ts
        live-tick/route.ts
        manual/route.ts
        file/route.ts
        answers/route.ts
        notes/route.ts
        submit/route.ts
    scout/
      dashboard/route.ts
      deals/route.ts
    internal/
      deals/route.ts                  ← exists
      deals/[dealId]/
        route.ts                      ← detail (build)
        ask-scout/route.ts            ← exists
        analyze/route.ts              ← build
        generate-email/route.ts       ← build
      scouts/route.ts                 ← build
      scouts/[scoutId]/route.ts       ← build
      scheduler/route.ts              ← exists
    openclaw/
      webhook/route.ts                ← exists
    email/
      respond/route.ts                ← build
```

---

## 12. UI Design System

### Visual Language (Uber-Inspired Minimal)
- **Background:** Pure white (#FFFFFF) or off-white (#FAFAFA) — no gray backgrounds
- **Text:** Near-black (#0A0A0A) for headings, #6B6B6B for secondary
- **Accent:** A single strong color — keep indigo (#4F46E5) from current build, or switch to black/charcoal for a more Uber-like feel
- **Borders:** 1px solid #E5E5E5 — very subtle
- **Cards:** White with 1px border — no shadow unless hovered
- **Typography:** Single font — Inter or similar geometric sans
- **Iconography:** Lucide (already in use) — line style only, never filled
- **Motion:** Subtle only — transitions max 150ms ease-out. No bounce, no spring

### Component Patterns
- **Buttons:** No rounded-full for primary actions — use rounded-lg. Keep them tight.
- **Status badges:** Small pills, muted colors — no bright green/red unless critical
- **Cards:** No shadow by default. 1px border. Shadow only on hover.
- **Modals / Slide-overs:** Slide from bottom on mobile, center on desktop. Dark overlay.
- **Forms:** No floating labels. Simple top-labels with clean textarea/input borders.
- **Progress bars:** Segmented pills (current add-startup step bar is good)
- **Charts:** Use Recharts — minimal axes, no gridlines unless necessary

### Analytics Illustrations
- Use simple SVG illustrations for empty states and analytics summaries
- Source: hand-drawn style (e.g. Storyset, unDraw, or custom SVG)
- Placement: inside analytics cards as a background or sidebar element
- Never use stock photos

---

## 13. Implementation Sequence (Phased)

### Phase 1 — Foundation ✅ Done
Folder structure, types, prompts, agent shells, API route shells, demo pages, dev server running.

### Phase 2 — Auth System
- Supabase Auth setup (email + phone OTP)
- `user_roles` table + RLS policies
- Login page (shared, role-based redirect)
- Invite flow (admin adds scout → email sent → complete-signup page)
- `middleware.ts` for route protection
- New env vars: `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`

### Phase 3 — Scout Submission Flow (Wire to AI)
- `/api/startup/init` → creates draft deal
- Audio upload → Supabase Storage (presigned URL pattern)
- `/api/startup/:id/audio` → Whisper → extraction → autofill
- `/api/startup/:id/manual` and `/api/startup/:id/file`
- Question generation prompt + API
- Question answers save
- Scout notes save
- `/api/startup/:id/submit`
- Wire add-startup page steps 1-6 to real APIs

### Phase 4 — Scout Review Pages
- `/scout/startups` page with real deal list from DB
- Startup detail conversation thread — real messages, reply sends via API
- Date commitment detection on scout replies
- Upload extra files inline
- Scout notes playback (audio player)
- Generate email modal (AI prompt → editable → copy/send)

### Phase 5 — Quanta Deal Inbox + Detail
- Real data fetch for `/inbox` and `/deals`
- Deal detail tabs: Overview, Analyze, Scout Interaction
- Market analysis AI prompt + endpoint + tab UI
- Ask Scout flow with AI rewrite (currently mockup, needs wiring)
- Recommended messages AI
- Internal notes (partner-only)
- Status + priority updates

### Phase 6 — Scout Management
- Add scout form → invite email → `scout_invites` table
- Scout list with last activity, responsiveness, email correspondence status
- Scout detail page with deal card grid + mini analytics
- Deactivate / pause scout

### Phase 7 — Email Correspondence System
- React Email templates (invite, weekly check-in, follow-up)
- Resend integration
- Weekly check-in email with CTA buttons
- `/api/email/respond` endpoint for button-click tracking
- Email correspondence history in scout detail

### Phase 8 — Analytics + Illustrations
- Recharts: deal pipeline funnel, submissions by category, scout activity over time
- SVG illustrations in empty states and analytics headers
- Scout analytics: submissions accepted vs archived, response rate

### Phase 9 — Real-time Indicator Ticking
- MediaRecorder browser API for audio capture
- 3-second chunk streaming to `/api/startup/:id/live-tick`
- Classification prompt (gpt-4o-mini, very fast)
- UI indicator update on response

### Phase 10 — OpenClaw Integration + Demo Layer
- Telegram bot setup
- OpenClaw webhook fully wired (currently mockable)
- Demo control panel (seed, reset, simulate)
- Demo mode toggle preserved

---

## 14. Known Constraints and Decisions

**No numeric scores ever.** Review labels are categorical: "Strong Candidate", "Worth Exploring", "Needs More Info". This is a deliberate product decision.

**One question per conversation turn.** The conversation controller always asks exactly one question. This applies to both the chat-based flow and the question-round in add-startup.

**Web upload as fallback for all media.** OpenClaw channel media support varies. All audio and file upload is always available via web, regardless of channel. Do not build features that only work through Telegram.

**Files never pass through Vercel API routes.** All files go directly browser → Supabase Storage via presigned URL. The API route only receives the `storage_url` string. This keeps us well within Vercel's 4.5MB body limit.

**Long AI jobs are non-blocking.** Enrichment, signal extraction, and brief generation run after the API responds (queued via a lightweight Supabase Edge Function or triggered with a fire-and-forget fetch). The user never waits for them.

**Phone OTP is required for scouts.** Supabase Auth handles this natively with Twilio configured in the Supabase dashboard. No direct Twilio SDK needed in the app.

**The chat page stays.** It is useful for general communication between scout and Quanta team — not for startup capture. The add-startup flow handles capture. They serve different purposes.

**Demo mode is preserved.** All API routes check `isDemoMode()` from `src/lib/demo/scout-os.ts` and return realistic fixture data when env vars are placeholders. This means the product is always demoable without real credentials.
