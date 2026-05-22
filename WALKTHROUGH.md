# Quanta Scout OS
## AI-Powered Venture Scout Intelligence System

**Prepared for:** Evan & Mateo, Quanta Ventures
**Version:** 1.0 · May 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Demo Access](#2-demo-access)
3. [Product Architecture](#3-product-architecture)
4. [Agent Responsibilities](#4-agent-responsibilities)
5. [Scout Flow](#5-scout-flow)
6. [Quanta Team Flow](#6-quanta-team-flow)
7. [Email System](#7-email-system)
8. [Data Model](#8-data-model)
9. [Demo Walkthrough Script](#9-demo-walkthrough-script)
10. [Final Notes](#10-final-notes)

---

## 1. Executive Summary

Quanta Scout OS is an AI-native venture scout intelligence platform built to close the gap between how scouts naturally share information and how investment teams actually need to receive it.

Scouts submit startup leads the way they would text a colleague — conversationally, with voice, documents, or a quick form. The system structures that input, identifies what's missing, follows up automatically, and delivers a clean, signal-rich deal record to the Quanta team.

**The product has two distinct experiences:**

| | Scout App | Quanta Team Dashboard |
|---|---|---|
| **Design focus** | Mobile-first, frictionless | Desktop, analytical |
| **Primary action** | Submit leads, reply to Quanta | Review deals, triage, follow up |
| **AI role** | Intake, structure, next-question | Signals, brief, market analysis |
| **Core principle** | Feels like texting Quanta | Structured investment workflow |

The system is not a CRM. It is a scout engagement and investment intelligence layer — one that scouts actually want to use and that gives the Quanta team the right information at the right time.

---

## 2. Demo Access

**App URL:** [https://quanta-scout-os.vercel.app](https://quanta-scout-os.vercel.app)

### Quanta Team Login
```
Email:    team@quanta.vc
Password: Quanta@123
```
→ Lands on the internal Deal Inbox dashboard.

### Scout Login
```
Email:    atharvanimbalkar36@gmail.com
Password: Atharva@29
```
→ Lands on the Scout Portal home.

---

> **Email Note:** The app uses [Resend](https://resend.com) for transactional email. The Resend account is currently in test mode with no verified sending domain attached. As a result, outbound emails only deliver to `atharvanimbalkar36@gmail.com`. Example app emails (check-in, invite, follow-up) are included as a separate attachment for reference.

---

## 3. Product Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCOUT INPUTS                             │
│                                                                 │
│   📱 Mobile App    📧 Email Check-in    🎤 Voice Pitch          │
│   📄 Document Upload              ✍️  Manual Submission         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                              │
│                                                                 │
│   Next.js 14 API Routes (App Router)                           │
│   ├── Supabase Postgres          (structured data)             │
│   ├── Supabase Storage           (files, audio)                │
│   ├── Supabase Auth              (role-based sessions)         │
│   └── Resend Email API           (check-ins, invites)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI AGENT LAYER                             │
│                           (Groq LLMs)                           │
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │  Intake Agent   │    │ Extraction Agent │                   │
│   │  (structuring)  │    │ (fields + gaps)  │                   │
│   └────────┬────────┘    └────────┬─────────┘                  │
│            └──────────┬───────────┘                            │
│                       ▼                                         │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │ Signal Extract. │    │ Market Analysis │                    │
│   │ (VC signals)    │    │ (TAM/SAM/comp.) │                    │
│   └────────┬────────┘    └────────┬─────────┘                  │
│            └──────────┬───────────┘                            │
│                       ▼                                         │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │ Internal Brief  │    │  Follow-up Agt  │                    │
│   │ (deal summary)  │    │ (missing info)  │                    │
│   └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│   ┌─────────────────────────────────────────┐                  │
│   │       Partner Question Agent            │                  │
│   │   (rewrites team questions for scouts)  │                  │
│   └─────────────────────────────────────────┘                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
│              Supabase Postgres + Storage                        │
│   deals · founders · deal_messages · ai_outputs                │
│   missing_info_tasks · partner_questions · scout_notes         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  QUANTA TEAM DASHBOARD                          │
│                                                                 │
│   📥 Deal Inbox          🔍 Deal Detail View                   │
│   📊 Analyze Tab         💬 Interaction Tab                     │
│   👥 Scout Management    📋 Follow-up Queue                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    Follow-up emails,
                    check-ins, questions
                            │
                            ▼
                      Back to Scout
```

---

## 4. Agent Responsibilities

| Agent | Purpose | Input | Output |
|---|---|---|---|
| **Scout Intake Agent** | Converts conversational scout input into a structured startup record | Raw text, voice transcript, or form fields | Populated `deals` record with name, description, category, stage |
| **Extraction Agent** | Identifies and extracts key startup data; flags missing fields | Deal record + scout messages | Structured fields; `missing_info_tasks` for gaps |
| **Signal Extraction Agent** | Generates qualitative VC signals — no numeric scores | Deal context, Q&A, founder data, traction | `founder_signal`, `market_signal`, `traction_signal`, `scout_conviction` — each with level (`strong / medium / early / weak`) and evidence |
| **Market Analysis Agent** | Produces a full market deep-dive on demand | Deal + signal context | Market overview, TAM/SAM estimates, tailwinds/headwinds, comparable companies, investment thesis, diligence questions |
| **Internal Briefing Agent** | Creates a clean, investor-ready deal summary | Deal context + signals | `what_it_does`, `why_it_may_matter`, known facts, open questions, suggested next action |
| **Follow-up Agent** | Tracks promised information and triggers reminders | `missing_info_tasks` with due dates | Reminder emails to scouts; updates task status |
| **Partner Question Agent** | Rewrites internal team questions into scout-friendly messages | Raw partner question text | Rewritten message suitable for the scout's communication style |

> All agents use Groq-hosted Llama 3 models. Structured outputs use JSON mode. Plain text outputs (check-in messages, liaison replies) use standard completions. All outputs are saved to `ai_outputs` for auditability.

---

## 5. Scout Flow

The scout experience is designed to feel like texting Quanta — not filling out a CRM. Every step is optimised for mobile and short sessions.

```
  [Login]
     │
     ▼
  [Scout Home]
  · My startups list
  · Pending follow-ups
  · Check-in notifications
     │
     ▼
  [Add Startup]
     │
     ├──── 🎤 Voice Pitch
     │         Record → Groq Whisper transcription → AI structures fields
     │
     ├──── 📄 Document Upload
     │         PDF/deck → text extraction → AI enrichment
     │
     └──── ✍️  Manual Entry
               Name, description, founder details
     │
     ▼
  [AI Review + Q&A]
  · System asks ONE follow-up question at a time
  · Scout answers in natural language
  · Missing info flagged automatically
     │
     ▼
  [Personal Notes]
  · Voice or text note (private to scout)
     │
     ▼
  [Submit]
  · Post-submission pipeline runs in background
  · Scout sees confirmation; deal appears in their list
     │
     ▼
  [Startup Detail Page]
  · Overview tab: deal info, rating, submitted answers
  · Interaction tab: live chat thread with AI/Quanta
       · "Still needed" banner shows outstanding items
       · Scout can reply, upload, or answer inline
```

**Key design principle:** The scout never navigates a CRM. They see their startups, reply to messages, and upload when asked. The system handles structure, follow-up, and routing.

---

## 6. Quanta Team Flow

The Quanta dashboard is optimised for desktop review. It is designed for speed — triage in seconds, deep-dive when needed, and a direct line to the scout when something is worth pursuing.

```
  [Login as team@quanta.vc]
     │
     ▼
  [Deal Inbox]
  · Filtered list of submitted deals
  · Status badges: Submitted / Needs Info / Under Review / Intro Requested
  · Priority flags, scout name, signal level visible at a glance
     │
     ▼
  [Deal Detail — Overview Tab]
  · AI Brief (auto-generated): what it does, why it matters,
    known facts, open questions, suggested next action
  · Signal Cards: Founder / Market / Traction / Scout Conviction
    — qualitative levels, not scores
  · Scout Q&A thread: all questions and answers in one view
  · Missing info tasks with due dates
  · Founder cards with LinkedIn
  · Uploaded files and voice pitches
  · Internal notes (visible only to Quanta team)
     │
     ▼
  [Deal Detail — Analyze Tab]
  · On-demand market analysis
  · Market overview + sourced TAM/SAM assumptions
  · Tailwinds and headwinds
  · Comparable companies with outcomes
  · Investment thesis
  · Key diligence questions
  · AI-chosen charts (bar, radar, funnel)
     │
     ▼
  [Deal Detail — Interaction Tab]
  · Full conversation thread between scout, AI liaison, and Quanta
  · Compose a question → AI rewrites it into scout-friendly language
  · AI-suggested questions based on deal gaps
  · Send directly to scout; reply tracked in thread
     │
     ▼
  [Follow-up Queue]
  · All pending missing_info_tasks across all deals
  · Overdue items highlighted
  · "Run Follow-up Agent" sends reminder emails in bulk
     │
     ▼
  [Scout Management]
  · Full scout network list with responsiveness scores
  · Last active, deal count, high-signal count
  · Send individual check-in or invite a new scout
  · "Send Check-in to All" bulk trigger
```

---

## 7. Email System

All emails are sent via **Resend** using the `onboarding@resend.dev` sender address (Resend's free-tier shared domain).

| Email Type | Trigger | Recipient | Content |
|---|---|---|---|
| **Scout Invite** | Quanta team adds a scout via dashboard | New scout email | Personalised welcome + one-click signup link (7-day expiry) |
| **Weekly Check-in** | Cron job — every Saturday 9am UTC | All active scouts | AI-personalised message + Yes / No / Submit CTA buttons |
| **Follow-up Reminder** | Follow-up Agent — when task is overdue | Scout who made the commitment | Specific reminder of the promised item + deadline |
| **Manual Reminder** | Quanta team clicks check-in on scout row | That scout | Quick "seen anything interesting?" email with Yes / No buttons |

**Resend limitation for this demo:**
Without a verified sending domain, Resend restricts delivery to the account owner's email only (`atharvanimbalkar36@gmail.com`). In production, attaching a verified domain (e.g. `scout@quantaventures.com`) removes this restriction and enables delivery to all scouts. Example emails are included separately.

---

## 8. Data Model

| Table | Description |
|---|---|
| `scouts` | Scout profiles — name, email, focus areas, responsiveness score, activity timestamps |
| `deals` | Core startup records — name, description, category, stage, status, priority, conviction |
| `founders` | Founder records linked to a deal — name, LinkedIn, background, email |
| `deal_messages` | Full conversation thread per deal — scout, AI, and Quanta messages with timestamps |
| `deal_files` | Uploaded documents and audio files — storage URL, extracted text, AI summary |
| `missing_info_tasks` | Tracked gaps — what's needed, who committed, expected and follow-up dates |
| `ai_outputs` | All AI agent outputs — type, model, input snapshot, output JSON (auditable) |
| `partner_questions` | Questions from the Quanta team — original and AI-rewritten versions, sent/answered status |
| `internal_notes` | Quanta-only notes on a deal — not visible to scouts |
| `scout_invites` | Pending invite tokens — email, expiry, acceptance status |
| `email_correspondence` | Log of all outbound emails — type, Resend message ID, sent and response timestamps |

All tables use UUID primary keys. Row-level security is enabled on user-facing tables. The Quanta team dashboard uses the Supabase service role (bypasses RLS). Scout-facing routes use the authenticated user session.

---

## 9. Demo Walkthrough Script

**Estimated time: 5–7 minutes**

---

### Act 1 — Scout Experience (2 min)

**1. Log in as Scout**
→ Go to [quanta-scout-os.vercel.app](https://quanta-scout-os.vercel.app)
→ Select **Scout** tab · enter `atharvanimbalkar36@gmail.com` / `Atharva@29`
→ Scout home shows submitted startups and any pending follow-ups.

**2. Add a Startup**
→ Tap **+ Add Startup**
→ Choose **Manual** entry (or try **Voice** to demo Groq Whisper transcription)
→ Fill in a startup name, one-liner, founder name
→ The system asks a single follow-up question — answer it naturally
→ Add a quick personal note via voice or text

**3. Submit**
→ Hit **Submit** — deal is marked submitted, multi-agent pipeline runs in background
→ Navigate into the startup detail
→ Show the **Interaction** tab — Q&A thread visible, "Still needed" banner showing open items

---

### Act 2 — Quanta Team Experience (3 min)

**4. Switch to Team Login**
→ Log out, select **Quanta Team** tab · enter `team@quanta.vc` / `Quanta@123`
→ Deal Inbox loads — the submitted deal is visible with status badge

**5. Open the Deal**
→ Click the deal card
→ **Overview tab** loads:
  - AI Brief auto-generates (30–45 sec on first load)
  - Signal cards show qualitative levels with evidence
  - Scout Q&A answers are threaded below
  - Missing info tasks visible in the sidebar

**6. Analyze Tab**
→ Click **Analyze** → **Run Analysis**
→ Wait ~20 seconds for Groq to generate:
  - Market overview with TAM/SAM
  - Tailwinds and headwinds
  - Comparable companies
  - Investment thesis
  - AI-chosen charts

**7. Ask the Scout a Follow-up**
→ Click **Interaction** tab
→ Type a raw question (e.g. "Do they have any LOIs or pilot customers?")
→ Click **Rewrite** — AI rewrites into scout-friendly language
→ Click **Send** — message appears in the thread; scout sees it in their portal

**8. Scout Management + Email**
→ Navigate to **Scouts** in the sidebar
→ Show the scout list with responsiveness scores
→ Hover a row and click the envelope icon — sends a check-in email to that scout
→ Point out the **Send Check-in to All** button for bulk outreach

---

## 10. Final Notes

### What this system is not

This is not a submission form. It is not a CRM. It is a scout engagement and investment intelligence workflow.

### The core product insight

Most VC scout systems fail at the same place: the gap between how scouts naturally talk about deals and the structured data an investment team needs to make decisions.

Quanta Scout OS closes that gap with two dedicated experiences:

**For scouts** — submit anything, any way, on mobile. The system handles structure, follow-up, and routing. Scouts feel like they are texting Quanta, not filing a report.

**For the Quanta team** — every deal arrives pre-structured, with qualitative signals, an investor-ready brief, open questions surfaced, and a direct line to the scout. Triage takes seconds. Deep research is one click away.

### Key design decisions

- **No numeric scores** — signals are qualitative (`strong / medium / early / weak`) to avoid false precision
- **One question at a time** — the AI never interrogates the scout; it asks one thing and waits
- **Background pipeline** — all AI processing is non-blocking; scouts and team never wait for agents
- **Full auditability** — every AI output is logged with its input snapshot in `ai_outputs`
- **Email-first follow-up** — scouts respond to emails with one click; no portal login required for simple responses

---

*Quanta Scout OS — Built for Quanta Ventures, May 2026*
