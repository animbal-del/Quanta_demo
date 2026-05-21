# Quanta Scout OS — Phase Tracker

Last updated: 2026-05-21 (post-Supabase setup)
Reference: `context.md` for full feature spec

---

## How to Read This

- ✅ Done — built and working
- 🔶 Partial — UI or shell exists, not wired to real data/APIs
- ❌ Not started

---

## Phase 1 — Foundation ✅ COMPLETE

| Item | Status | File/Location |
|---|---|---|
| Folder structure | ✅ | `/src/*` |
| TypeScript types | ✅ | `src/types/index.ts` |
| All AI prompt files | ✅ | `src/prompts/**` |
| Agent logic shells | ✅ | `src/agents/**` |
| API route shells | ✅ | `src/app/api/**` |
| Database migration | ✅ | `supabase/migrations/001_initial_schema.sql` |
| Demo seed data | ✅ | `supabase/seed/demo-seed.sql` |
| Demo mode system | ✅ | `src/lib/demo/scout-os.ts` |
| Dev server running | ✅ | `localhost:3001` |

---

## Phase 2 — Auth System 🔶 IN PROGRESS

| Item | Status | Notes |
|---|---|---|
| Login page UI (dual-role selector) | ✅ | `src/app/page.tsx` |
| Role-based redirect on login | ✅ | Sends to `/inbox` or `/scout` |
| Supabase credentials in env | ✅ | `.env.local` complete |
| Supabase SQL migrations run | ✅ | All 14 tables confirmed in dashboard |
| `user_roles` table | ✅ | Live in Supabase |
| `scout_invites` table | ✅ | Live in Supabase |
| Supabase Auth email enabled | ✅ | Configured in dashboard |
| Supabase Storage buckets | ✅ | `deal-files` + `scout-audio` created with policies |
| Resend installed + API key | ✅ | `re_DpZ11zdo_...` in `.env.local` |
| OpenAI API key | ✅ | Live — tested, returning real GPT-4o replies |
| Demo seed data loaded | ✅ | FlowOps/CampusPay/MedSync in Supabase |
| `@supabase/ssr` installed | ✅ | For Next.js App Router auth |
| Server-side Supabase client | ❌ | `src/lib/supabase/server.ts` — Phase 2B |
| `middleware.ts` real auth | ❌ | Currently permissive — Phase 2B |
| `/api/auth/invite` route | ❌ | Phase 2B |
| `/api/auth/complete-signup` route | ❌ | Phase 2B |
| Add Scout slide-over form | ❌ | Phase 2B |
| `/complete-signup` wired to Supabase | ❌ | Page shell exists — Phase 2B |
| Real session-based login | ❌ | Currently demo mode — Phase 2B |

**Currently building:** Phase 2B — invite flow, Add Scout form, Supabase session auth

---

## Phase 3 — Scout Submission Flow 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Add Startup page UI (6 steps) | ✅ | `src/app/(scout)/(routes)/add-startup/page.tsx` |
| Mode selection UI | ✅ | Voice / Manual / Document cards |
| Voice pitch studio UI | ✅ | Record button, timer, indicator checklist |
| Manual entry form UI | ✅ | All fields present |
| Document upload UI | ✅ | Drag-drop zone |
| AI autofill review step | ✅ | Static FlowOps demo |
| Question round UI | ✅ | 3 questions with Text/Voice/Skip |
| Scout notes step UI | ✅ | Record / Write options |
| Submit step UI | ✅ | Summary + Submit button |
| `/api/startup/init` | ❌ | Not built |
| Presigned URL upload | ❌ | Not built (`/api/upload/presign`) |
| MediaRecorder browser recording | ❌ | Not wired |
| `/api/startup/:id/audio` (Whisper) | ❌ | Not built |
| `/api/startup/:id/manual` | ❌ | Not built |
| `/api/startup/:id/file` | ❌ | Not built |
| `/api/startup/:id/answers` | ❌ | Not built |
| `/api/startup/:id/notes` | ❌ | Not built |
| `/api/startup/:id/submit` | ❌ | Not built |
| Question generation AI prompt | ❌ | `src/prompts/intake/question-generation.prompt.ts` |
| Real-time indicator ticking | ❌ | Phase 9 |
| Wire all steps to real APIs | ❌ | Blocked by API routes |

**Next step for Phase 3:** Build `/api/startup/init` → presigned URL route → audio/manual/file routes → wire steps

---

## Phase 4 — Scout Review Pages 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Scout home page | ✅ | `src/app/(scout)/(routes)/scout/page.tsx` |
| Startup detail page | ✅ | `src/app/(scout)/(routes)/startups/[id]/page.tsx` |
| Startup detail — conversation thread | ✅ | Static messages |
| Startup detail — generate email modal | ✅ | AI-generated email shown |
| Startup detail — uploads section | ✅ | Static list |
| Startup list / review page | ❌ | No `/scout/startups` page — only `/submissions` |
| Real API data on scout home | ❌ | Still static |
| Date commitment detection on replies | ❌ | Not wired |
| Upload extra files in chat | ❌ | UI button exists, not wired |
| Scout notes audio playback | ❌ | No audio player component |
| Scout dashboard (notifications/analytics) | ❌ | No `/scout/dashboard` page |

---

## Phase 5 — Quanta Deal Inbox + Detail 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Command center / inbox page | ✅ | `src/app/(dashboard)/(routes)/inbox/page.tsx` |
| Stat cards (new, need review, follow-ups) | ✅ | 3 cards at top |
| Deal cards with signals | ✅ | Status, signals, missing info, next action |
| Filter bar | ✅ | All / Needs Info / Under Review / High Signal / Monitor |
| Manage Applications page (`/deals`) | ❌ | No separate page — inbox doubles as it |
| Deal detail — Overview tab | ✅ | `src/app/(dashboard)/(routes)/deals/[id]/page.tsx` |
| Deal detail — Analyze tab | ❌ | Not built |
| Deal detail — Scout Interaction tab | ❌ | Only basic Ask Scout modal |
| Ask Scout — AI rewrite preview | ✅ | Works in modal (demo) |
| Recommended messages by AI | ❌ | Not built |
| Internal notes (partner-only) | ❌ | Not built |
| Status + priority update controls | ❌ | Buttons exist but no action |
| Real data from Supabase | ❌ | Demo mode fallback only |

---

## Phase 6 — Scout Management 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Scout list page | ✅ | `src/app/(dashboard)/(routes)/scouts/page.tsx` |
| Responsiveness bar | ✅ | Visual bar component |
| Add Scout slide-over form | ❌ | Button exists, no form |
| Add Scout → sends invite email | ❌ | No invite logic |
| Scout detail page | ❌ | `src/app/(dashboard)/(routes)/scouts/[id]/page.tsx` — not built |
| Email correspondence history | ❌ | Not built |
| Last email sent / responded columns | ❌ | Not in UI |
| Inactive indicator (14+ days) | 🔶 | Logic not real — static data |

---

## Phase 7 — Email Correspondence ❌ NOT STARTED

| Item | Status | Notes |
|---|---|---|
| Resend installed | ✅ | `npm install resend` done |
| Resend API key | ❌ | Sign up at resend.com |
| `src/lib/resend/client.ts` | ❌ | Needs API key first |
| Invite email template | ❌ | React Email |
| Weekly check-in email template | ❌ | React Email |
| Follow-up email template | ❌ | React Email |
| `/api/email/respond` endpoint | ❌ | Button-click tracking |
| `email_correspondence` table | ❌ | In migration 002 |

---

## Phase 8 — Analytics + Illustrations 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Analytics page shell | ✅ | Static numbers and bar chart CSS |
| Recharts installed | ❌ | Not in package.json |
| Real chart components | ❌ | Not built |
| SVG illustrations | ❌ | Not sourced |
| Scout analytics section | ❌ | Not built |

---

## Phase 9 — Real-time Indicator Ticking ❌ NOT STARTED

| Item | Status | Notes |
|---|---|---|
| MediaRecorder API browser recording | ❌ | |
| 3-second chunk upload | ❌ | |
| `/api/startup/:id/live-tick` | ❌ | |
| Live tick prompt | ❌ | `src/prompts/intake/live-tick.prompt.ts` |
| Indicator UI real-time update | ❌ | |

---

## Phase 10 — OpenClaw + Demo Layer 🔶 PARTIAL

| Item | Status | Notes |
|---|---|---|
| Demo mode system (`isDemoMode()`) | ✅ | Works without real credentials |
| Demo seed data | ✅ | SQL file ready to run |
| OpenClaw webhook endpoint | ✅ | `/api/openclaw/webhook` — wired to demo mode |
| OpenClaw simulate mode | ✅ | `OPENCLAW_SIMULATE=true` |
| Demo control panel page | ❌ | No `/demo` page |
| Seed data button (UI) | ❌ | |
| Reset demo button (UI) | ❌ | |
| Telegram bot setup | ❌ | Phase 10 |
| Vercel deployment | ❌ | See `/docs/setup-vercel.md` |

---

## Recommended Build Order (Now → Demo Ready)

```
Phase 2A  Run SQL migrations in Supabase        ← unblocks everything
Phase 5A  Manage Applications page (/deals)      ← needed for demo
Phase 5B  Deal detail 3 tabs                     ← needed for demo
Phase 6A  Add Scout form + Scout detail          ← needed for demo
Phase 2B  Auth invite flow                       ← needed for real users
Phase 3A  Startup submission API routes          ← needed for real scouts
Phase 7   Email system                           ← needed for real scouts
Phase 8   Analytics with real charts             ← nice to have for demo
```
