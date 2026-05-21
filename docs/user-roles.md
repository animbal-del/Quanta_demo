# User Roles — Screens & Permissions

## Two Roles

| Role | Login method | Primary workspace |
|---|---|---|
| **Quanta Team** | Email + password (created in Supabase) | `/inbox` → full dashboard |
| **Scout** | Email + password (invited via Add Scout flow) | `/scout` → scout portal |

---

## Quanta Team — All Screens

### `/inbox` — Command Center
- Today's stats: updated deals, deals needing attention, total active
- Deal cards with status dot, signals, scout, next action
- Filter bar: All / Needs Info / Under Review / High Signal / Monitor
- **Card hover actions:**
  - 💬 Ask Scout → navigates to deal's Interaction tab
  - ★ Priority → toggles high/normal priority (live Supabase update)
  - ↗ Intro → sets status to `intro_requested` (live Supabase update)
- Clicking card → Deal Detail page

### `/deals` — Manage Applications
- Full deal list with search and status filters
- Review label badges: Strong Candidate / Worth Exploring / Needs More Info
- Signal indicators, scout attribution, days since last update
- Clicking any row → Deal Detail

### `/deals/:id` — Deal Detail (3 tabs)

**Overview tab:**
- AI Brief (what it does, why it matters, known facts, open questions, next action)
- Signal cards (Founder / Market / Traction / Scout Conviction — qualitative, no scores)
- Scout Q&A answers from submission question round
- Elevator pitch audio player (inline Play/Pause, Download)
- Transcript download
- Document files with download buttons
- Founders as cards with LinkedIn links
- Missing info tasks (✓ to mark done, auto-flagged by AI + commitment detection)
- Internal partner notes (add inline, visible only to team)

**Analyze tab:**
- Run market analysis (Groq llama-3.3-70b)
- Sourced TAM/SAM (with cited sources or methodology)
- AI-chosen charts: bar (market size), radar (founder capabilities)
- Tailwinds + headwinds
- Comparable companies (same vertical, same model — strictly filtered)
- Investment thesis + diligence questions
- Verdict: Promising / Neutral / Concerning

**Interaction tab:**
- Compose area (type question or click a suggestion to fill it)
- Rewrite button → AI reformulates for scout
- Send button → delivers via OpenClaw (or logs in simulate mode)
- AI-suggested questions (click to fill compose area, no modal)
- Sent partner questions history
- Full conversation thread (right panel)

**Status controls (visible on all tabs):**
- Status dropdown: Submitted → Needs Info → Under Review → Intro Requested → Monitor → Archived
- ★ Priority toggle: Normal ↔ High Priority
- Archive button
- Request Intro button

### `/scouts` — Scout Network
- Scout cards with focus areas, deal count, high signal count, responsiveness bar, last active
- **Card hover actions:**
  - 💬 Check-in → sends personalised check-in via Groq + delivers to scout (OpenClaw/simulate)
  - 📈 View submissions → navigates to scout detail
- + Add Scout → slide-over form (name + email + focus areas) → sends real Resend invite email
- Invite sent banner with success confirmation

### `/scouts/:id` — Scout Detail
- Profile: focus areas, responsiveness score, last active, last email sent/responded, joined date
- **Check-in button** → sends personalised Groq-generated message to scout
- **Email button** → opens compose modal (subject + body) → sends via Resend
- Activity stats: Submitted / Moved forward / Archived / Active
- Startups introduced: card grid linking to deal detail
- Email history: type, sent date, response (Had a lead / Nothing / No response)

### `/queue` — Follow-up Queue
- Overdue tasks (highlighted amber, due date passed)
- Pending tasks (no date committed)
- **Run Follow-up Agent** → calls scheduler, sends follow-up messages to all overdue scouts
- **Ask now** button per task → quick action

### `/analytics` — Analytics
- 4 stat cards: Total deals / Submitted / Needs info / Intro requested
- Area chart: deal submissions over last 8 weeks
- Horizontal bar: pipeline by status (colour-coded)
- Donut: category breakdown
- Bar chart: top scouts by deal count
- CSS bars: bottlenecks (most common missing items)

### `/profile` — Team Profile
- Name, email, role badge
- Demo mode indicator (if applicable)
- Sign out button

---

## Scout — All Screens

### `/scout` — Home
- Greeting with first name (fetched from session)
- "Add Startup" CTA button
- Stats strip: Submitted / In review / Need action
- Recent startups list with status badges and action indicators
- 🔔 Bell → Notifications dashboard
- 👤 Avatar → Profile

### `/add-startup` — Submit a Startup (6 steps)

**Step 1:** Choose mode — Voice Pitch / Manual Entry / Upload Document

**Step 2A (Voice):**
- 2-minute recording studio with countdown
- Visual indicator checklist (Problem / Product / Why interesting / Traction)
- Record button, file upload fallback
- Processing: 3-step progress indicator (Uploading → Transcribing → Extracting)

**Step 2B (Manual):** 5 text fields — startup name, founder, what it does, why interesting, traction

**Step 2C (Document):** Drag-drop upload of PDF/deck → AI extracts and autofills

**Step 3:** Review & Edit — all AI-extracted fields are tap-to-edit inline. Saves to Supabase on each field save.

**Step 4:** Question round — 3-5 AI-generated questions. Each has: Record voice answer (→ Whisper → AI polish → choose version) / Type answer / Skip

**Step 5:** Personal notes — Record voice (→ Whisper → polish → edit) or type freely

**Step 6:** Submit confirmation — fires 7-step pipeline in background

**Save as Draft button** appears at steps 2-5. Creates deal with `status='draft'` (visible in submissions, hidden from Quanta inbox).

### `/startups/:id` — Startup Detail
- Header: startup name, status badge
- Missing info section (amber cards with expected dates)
- Conversation thread with Quanta (scroll, reply inline)
- Generate Email modal (AI-written email to startup requesting docs)
- Upload Document (direct to Supabase Storage)
- Add Note (inline text input → saves to scout_notes)
- Reply input with Enter to send, AI responds, date commitments auto-detected

### `/submissions` — All My Submissions
- Filter chips: All / Need action / Under review / Monitoring / Archived
- Deal cards with status, next step, Quanta activity, last updated
- Action needed badge (indigo highlight) for pending questions
- + Submit another startup link

### `/dashboard` — Activity & Notifications
- 4 stats: Submitted / In review / Moved forward / Need action
- Notification feed: pending questions (indigo), status changes, intro requests
- Unread badge on Bell icon in home header

### `/profile` — Scout Profile
- Avatar with initials
- Email, channel
- Editable focus areas (save to Supabase)
- Activity stats: responsiveness score, last active
- Demo mode notice or Sign out button

### `/chat` — General Chat
- Direct messaging with Quanta AI
- Conversation history

---

## What Each Role Cannot Access

| Screen | Scout | Quanta Team |
|---|---|---|
| `/inbox`, `/deals`, `/scouts`, `/queue`, `/analytics` | ❌ Redirected to `/scout` | ✅ |
| `/scout`, `/add-startup`, `/startups/*`, `/submissions`, `/dashboard` | ✅ | ❌ Redirected to `/inbox` |
| `/profile` | ✅ (scout profile) | ✅ (team profile) |
| `/complete-signup` | ✅ (invite only) | ✅ |

Middleware enforces this on every request. In demo mode (cookie), enforcement is still role-based.

---

## How Missing Info Gets Flagged

The `missing_info_tasks` table is populated from 3 sources:

1. **AI Extraction** — When the scout submits, the extraction model identifies fields it couldn't find (no startup name, no founder, no deck) → creates `pending` tasks
2. **Enrichment Agent** — After submission, the enrichment agent reads uploaded docs and creates tasks for diligence gaps (e.g. "missing cap table", "no revenue data")
3. **Scout commitment detection** — If a scout writes "I'll get the deck by May 22" in the chat, the commitment extraction model creates a task with `expected_date = 2026-05-22` and `followup_date = 2026-05-23`

The Follow-up Agent runs daily (Vercel cron) and sends reminders for overdue tasks.
