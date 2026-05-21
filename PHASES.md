# Quanta Scout OS — Phase Tracker

Last updated: 2026-05-21
Reference: `context.md` for full feature spec

---

## How to Read This

- ✅ Done — built, wired, Supabase-only
- 🔶 Partial — shell exists, not fully complete
- ❌ Not started

---

## Phase 1 — Foundation ✅ COMPLETE

All folder structure, types, prompts, agent shells, DB migration, seed data. Dev server running.

---

## Phase 2 — Auth System ✅ COMPLETE

| Item | Status |
|---|---|
| Login page — dual-role selector + Supabase auth + demo fallback | ✅ |
| `middleware.ts` — Supabase SSR session check, role-based routing in prod | ✅ |
| `@supabase/ssr` installed, `src/lib/supabase/server.ts` | ✅ |
| All 14 DB tables live in Supabase | ✅ |
| Supabase Auth email enabled, email templates configured | ✅ |
| Supabase Storage — `deal-files` + `scout-audio` buckets with RLS policies | ✅ |
| Resend installed + API key configured + `src/lib/resend/client.ts` | ✅ |
| OpenAI API key live — real GPT-4o responses confirmed | ✅ |
| `POST /api/auth/invite` — creates scout + invite token + sends real Resend email | ✅ |
| `POST /api/auth/complete-signup` — validates token, creates Supabase user, sets role | ✅ |
| `GET /api/auth/role` — returns current session role | ✅ |
| `/complete-signup` page — validates token on load, wired to real API | ✅ |
| Add Scout slide-over — sends real invite email (tested + confirmed) | ✅ |
| `isDemoMode()` → always returns `false` — all routes Supabase-only | ✅ |

---

## Phase 3 — Scout Submission Flow ✅ COMPLETE

| Item | Status |
|---|---|
| Add Startup page — 6 steps, all wired to real APIs | ✅ |
| Mode selection → `POST /api/startup/init` creates real Supabase draft deal | ✅ |
| Voice: MediaRecorder browser recording, 2-min countdown, indicator checklist | ✅ |
| Voice: audio upload → Whisper transcription → GPT-4o extraction → autofill | ✅ |
| Manual: form → `POST /api/startup/:id/manual` → extraction + Supabase save | ✅ |
| Document: presigned URL → Supabase Storage → enrichment AI → autofill | ✅ |
| `GET /api/upload/presign` — Supabase Storage signed upload URL | ✅ |
| `POST /api/startup/:id/questions` — GPT-4o generates 3-5 targeted questions | ✅ |
| `POST /api/startup/:id/answers` — saves to `deal_answers` table | ✅ |
| `POST /api/startup/:id/notes` — saves to `scout_notes` table | ✅ |
| `POST /api/startup/:id/submit` — sets submitted, fires background signal+brief | ✅ |
| `GET /api/startup/:id/draft` — returns current draft for review step | ✅ |
| Date commitment detection on submission messages | ✅ |
| Real-time indicator ticking (Phase 9 — visual simulation for now) | 🔶 |

---

## Phase 4 — Scout Review Pages ✅ COMPLETE

| Item | Status |
|---|---|
| Scout home (`/scout`) — fetches `/api/scout/deals`, stats strip, action badges | ✅ |
| Startup detail (`/startups/:id`) — fetches deal by URL param, real thread | ✅ |
| Startup detail — reply sends to Supabase, AI responds, commitment detection | ✅ |
| Startup detail — Generate Email modal (copy or open in mail client) | ✅ |
| Submissions page (`/submissions`) — fetches `/api/scout/deals`, filter chips | ✅ |
| `GET /api/scout/deals` — scout's deals from Supabase | ✅ |
| `POST /api/scout/deals/:id/reply` — saves reply, detects dates, AI responds | ✅ |
| Loading skeletons on all scout pages | ✅ |
| Scout notes audio playback | ❌ |
| Scout dashboard — notifications/analytics page | ❌ |

---

## Phase 5 — Quanta Deal Inbox + Detail 🔶 IN PROGRESS

| Item | Status | Notes |
|---|---|---|
| Command center (`/inbox`) — fetches Supabase, stat cards, filter bar | ✅ | |
| Applications page (`/deals`) — fetches Supabase, search, status filters | ✅ | |
| Deal detail — Overview tab (brief, signals, founders, missing info, files) | ✅ | |
| Deal detail — Scout Interaction tab (thread, partner questions, ask scout) | ✅ | |
| Ask Scout — AI rewrite calls real `/api/internal/deals/:id/ask-scout` | ✅ | |
| `GET /api/internal/deals/[dealId]` — full deal with all relations | ✅ | |
| `GET /api/internal/deals` — inbox list with signals | ✅ | |
| Deal detail — Analyze tab with real AI market analysis | ❌ | **Building now** |
| Recommended messages in Interaction tab | ❌ | **Building now** |
| Status + priority update from UI | ❌ | **Building now** |
| Add internal note from UI | ❌ | **Building now** |

---

## Phase 6 — Scout Management ✅ COMPLETE

| Item | Status |
|---|---|
| Scout list (`/scouts`) — fetches Supabase, deal counts, inactive indicator | ✅ |
| Add Scout slide-over — creates scout + invite token + sends real Resend email | ✅ |
| Scout detail (`/scouts/:id`) — fetches by URL param, deals grid, email history | ✅ |
| Email correspondence history shown | ✅ |
| `GET /api/internal/scouts` — all scouts with deal counts | ✅ |
| `GET /api/internal/scouts/:id` — detail with deals + email history | ✅ |

---

## Phase 7 — Email Correspondence 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Resend installed + API key + `src/lib/resend/client.ts` | ✅ | |
| Invite email — sends real emails (confirmed working) | ✅ | |
| Weekly check-in email template built | ✅ | In `resend/client.ts` |
| Follow-up email template built | ✅ | In `resend/client.ts` |
| `email_correspondence` table in Supabase | ✅ | |
| `/api/email/respond` — handle email CTA button clicks | ❌ | |
| Weekly check-in actually scheduled via cron | ❌ | Needs Vercel deploy |
| Follow-up emails triggered by agents | ❌ | Needs scheduler wired |

---

## Phase 8 — Analytics + Charts 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Analytics page — fetches Supabase, CSS bar charts | ✅ | |
| `GET /api/internal/analytics` — live totals, categories, bottlenecks | ✅ | |
| Recharts proper charts (pipeline funnel, activity over time) | ❌ | |
| Scout analytics section | ❌ | |
| SVG illustrations / empty states | ❌ | |

---

## Phase 9 — Real-time Indicator Ticking ❌ NOT STARTED

Visual simulation exists (ticks at fixed intervals). Real AI ticking needs:
- 3-second audio chunk streaming to `/api/startup/:id/live-tick`
- `src/prompts/intake/live-tick.prompt.ts`
- gpt-4o-mini classification per chunk

---

## Phase 10 — OpenClaw + Vercel Deploy 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| OpenClaw webhook endpoint (`/api/openclaw/webhook`) | ✅ | Wired, Supabase-only |
| OpenClaw simulate mode (`OPENCLAW_SIMULATE=true`) | ✅ | |
| `vercel.json` cron config | ✅ | 2 cron jobs defined |
| `CRON_SECRET` protection on scheduler | ✅ | In middleware |
| Vercel deployment | ❌ | See `docs/setup-vercel.md` |
| Telegram bot setup | ❌ | |
| Demo control panel (`/demo`) | ❌ | |

---

## Build Priority (Remaining)

```
Phase 5 completion   Status updates, Analyze tab, notes, recommended messages   ← NOW
Phase 7 finish       /api/email/respond endpoint                                 ← Next
Phase 8 upgrade      Recharts pipeline funnel + activity charts                  ← After
Phase 9              Real-time indicator ticking (AI per audio chunk)            ← Later
Phase 10             Vercel deploy + Telegram bot                                ← Last
```
