# Quanta Scout OS — Unconstrained Vision
## Additions, Substitutions, and Full-Scale Architecture

> This document covers what Quanta Scout OS would look like with no budget constraints — full production channels, upgraded AI stack, native mobile apps, and enterprise-grade infrastructure. Each section marks whether it is an **Addition** (new capability) or **Substitution** (replacing something currently in the system).

---

## Table of Contents

1. [Scout Input Channels](#1-scout-input-channels)
2. [AI Stack Upgrades](#2-ai-stack-upgrades)
3. [Scout Experience](#3-scout-experience)
4. [Quanta Team Experience](#4-quanta-team-experience)
5. [Data & Intelligence Layer](#5-data--intelligence-layer)
6. [Infrastructure & Reliability](#6-infrastructure--reliability)
7. [Full Stack Comparison Table](#7-full-stack-comparison-table)

---

## 1. Scout Input Channels

### 1.1 Telegram Bot — Full Two-Way Integration
**Type:** Substitution (replaces simulated OpenClaw)
**Cost driver:** WhatsApp Business API ($0.005–$0.08/conversation) + OpenClaw or custom gateway

The current system has OpenClaw wired at the gateway layer but messages are simulated. In production:

- Scouts submit leads by **texting a Quanta Telegram bot** — no app, no portal, no friction
- Message arrives → Intake Agent structures it → bot replies with one follow-up question → scout answers → deal is created
- Bot handles follow-up reminders, check-ins, and questions from the Quanta team — all in the same Telegram thread the scout already uses
- Conversation state is maintained per-scout so a scout can send fragmented updates over multiple days and they are stitched together correctly

**Implementation:**
```
Scout texts: "Met a founder building AI for trucking dispatch, 3 pilots, raising $500K seed"
Bot replies:  "Interesting. What's their background — have they worked in logistics before?"
Scout texts: "Yeah, ex-Delhivery ops. Name is Arjun Mehta."
Bot replies:  "Got it. Submitted to Quanta. I'll follow up if they need more info."
```

---

### 1.2 WhatsApp Business API
**Type:** Addition
**Cost driver:** Meta WhatsApp Business API (~$0.005–$0.08/conversation) + verified business number

WhatsApp is the dominant messaging channel for scouts in India. The exact same flow as Telegram — but scouts never leave their primary app.

- Requires Meta Business Verification and a dedicated WhatsApp number
- Template messages for check-ins (Meta requires pre-approved templates for outbound)
- Free-form replies work within 24-hour conversation windows
- Attachments (pitch decks, voice notes) handled natively

---

### 1.3 Slack App
**Type:** Addition
**Cost driver:** Slack app listing + Slack API (free for basic, Slack Connect for enterprise)

For scouts embedded in VC ecosystems, accelerators, or tech communities who already live in Slack:

- `/quanta submit` slash command → opens a modal for quick submission
- Bot DMs the scout follow-up questions
- Quanta team gets a `#new-deals` channel with real-time deal cards
- Partner can react with 🔥 (high priority) or ❌ (pass) directly in Slack to update deal status

---

### 1.4 SMS Fallback
**Type:** Addition
**Cost driver:** Twilio SMS (~$0.0079/message)

For scouts in low-connectivity or low-smartphone regions:

- Basic text-based intake: scout texts a number, structured bot conversation collects the deal
- No rich formatting — plain text Q&A
- Works on any phone, any network

---

### 1.5 Email-Native Submission
**Type:** Addition
**Cost driver:** Mailgun or SendGrid inbound parsing (free tier available)

Scout forwards a founder's email or their own notes to `submit@scout.quantaventures.com`:

- Inbound email parsed → AI extracts deal details from the body
- Attachments (PDFs, decks) automatically processed by the enrichment agent
- Reply thread becomes the deal conversation

---

## 2. AI Stack Upgrades

### 2.1 Web Research & Live Enrichment
**Type:** Substitution (replaces document-only enrichment)
**Cost driver:** Exa API ($5/1,000 searches) or Perplexity API ($5/1,000 requests)

Current enrichment only runs on uploaded documents. With a live search API:

- After every submission, automatically search the web for the startup, founders, and market
- Pull: LinkedIn profiles, Crunchbase data, AngelList presence, news mentions, domain traffic estimates (SimilarWeb), GitHub activity for technical founders
- Cross-reference what the scout said with what is publicly available — flag discrepancies
- Auto-populate founder backgrounds without the scout needing to provide LinkedIn URLs

**Prompt pattern:**
```
Search: "[Startup Name] [Founder Name] startup"
Extract: funding rounds, team size, press coverage, product URLs, customer logos
Flag: if public data contradicts scout's claims (e.g., scout says "pre-seed" but Crunchbase shows Series A)
```

---

### 2.2 Semantic Duplicate Detection with pgvector
**Type:** Substitution (replaces text-similarity duplicate check)
**Cost driver:** OpenAI Embeddings API ($0.0001/1K tokens) + pgvector Supabase extension (free)

Current duplicate detection uses string matching on startup names and descriptions. This misses:
- Same company submitted under different names ("FlowOps" vs "Flow Operations")
- Semantically identical companies ("AI for trucking dispatch" and "logistics automation using ML")

With embeddings:

- Every deal description is embedded at submission time and stored in `deal_embeddings` table
- Cosine similarity search against all existing embeddings
- Threshold: >0.92 similarity → flag as likely duplicate
- Show matched deal to Quanta team with side-by-side comparison

**Schema addition:**
```sql
alter table deals add column embedding vector(1536);
create index deals_embedding_idx on deals using ivfflat (embedding vector_cosine_ops);
```

---

### 2.3 GPT-4o Vision — Pitch Deck from Photo
**Type:** Addition
**Cost driver:** GPT-4o API (~$0.01/1K input tokens for vision)

Scout photographs a slide deck, whiteboard, or product screenshot with their phone camera:

- Image sent to GPT-4o vision endpoint
- Extracts: company name, problem statement, solution, team slide, traction metrics, market size claims
- Structures into the same deal schema as manual entry or voice pitch
- Works for handwritten notes, napkin sketches, or physical whiteboards

---

### 2.4 Real Whisper API — Dedicated Endpoint
**Type:** Substitution (replaces Groq shared Whisper)
**Cost driver:** OpenAI Whisper API ($0.006/minute) or AssemblyAI ($0.0025/minute)

Current transcription uses Groq's free-tier Whisper which has:
- 28,800 audio seconds/day shared limit
- 25MB file size limit
- No speaker diarization

Production upgrade:
- Dedicated Whisper endpoint (OpenAI or AssemblyAI) with no shared limits
- **Speaker diarization**: separate scout voice from any other voices in a recording
- **Timestamps**: link specific transcript segments to specific questions
- **AssemblyAI add-ons**: auto-chapters, key phrases, sentiment per segment, filler word detection

---

### 2.5 Founder LinkedIn Auto-Fetch
**Type:** Addition
**Cost driver:** PhantomBuster or Proxycurl API ($49–$300/month)

Scout enters a LinkedIn URL → system automatically pulls:
- Full name, headline, current company
- Previous companies and tenures
- Education (university, degree, year)
- Number of connections (proxy for network strength)
- Recent posts / activity (proxy for thought leadership)

Auto-populates the `founders` table and pre-fills the Q&A answer for founder background.

---

### 2.6 Voice Conviction Scoring
**Type:** Addition
**Cost driver:** Groq / Assembly AI (already in stack)

Beyond transcription — analyse HOW the scout talks about a deal:
- **Specificity score**: does the scout cite actual numbers, names, and dates? Or is it vague?
- **Confidence markers**: count of hedging language ("I think", "maybe", "not sure") vs. conviction language ("absolutely", "best I've seen", "must look at this")
- **Coherence**: does the pitch flow logically from problem → solution → why now → traction?

Output added as a `voice_conviction_score` signal card alongside existing VC signals.

---

### 2.7 Structured Deal Comparison ("Comps Intelligence")
**Type:** Addition
**Cost driver:** Exa/Perplexity + OpenAI GPT-4o

When a deal is submitted, automatically:
1. Search for 3–5 comparable companies that raised in similar space + stage
2. Pull their funding amounts, investors, and outcomes
3. Present to Quanta team as a "How does this compare?" widget in the deal overview

---

## 3. Scout Experience

### 3.1 React Native Mobile App
**Type:** Substitution (replaces mobile web)
**Cost driver:** React Native development + App Store / Play Store ($25 one-time + $99/year)

Current scout experience is a mobile-optimised web app. A native app would add:

- **Background audio recording**: record a pitch while driving without keeping the screen on
- **Offline-first**: submit a deal with no internet — syncs automatically when connected
- **Push notifications**: "Quanta asked you a question about NeuralCart" — scout replies directly from the notification
- **Camera integration**: photograph a pitch deck or business card → auto-processed
- **Widgets**: home screen widget showing pending follow-ups
- **Haptic feedback**: satisfying "submitted" confirmation

**Tech stack:** React Native + Expo + Supabase Realtime

---

### 3.2 WhatsApp-Native Onboarding
**Type:** Addition

Current onboarding: Quanta team sends invite email → scout clicks link → creates account on web.

WhatsApp-native flow:
1. Quanta team sends a WhatsApp message to the scout's number
2. Scout replies "yes" → bot sends a one-time PIN
3. Scout enters PIN → account created
4. All submissions happen in WhatsApp from that point

Zero web friction. No email needed.

---

### 3.3 Smart Re-engagement Messages
**Type:** Addition

When a scout replies "nothing this week" to a check-in, instead of ending there:

- AI checks the scout's focus areas and past submissions
- Sends a **targeted prompt**: "What about the HealthTech space? You mentioned hospital-facing tools last month — anything new?"
- Or references a specific founder they mentioned earlier: "Any update from the Meesho alum you were meeting?"
- Uses GPT-4o with the scout's full history as context

---

### 3.4 Scout Leaderboard & Gamification
**Type:** Addition

Scout portal home page shows:
- Personal "Scout Score" based on quality and volume of submissions
- Rank within the network (anonymised)
- Streak: consecutive weeks with at least one signal
- Badges: "First Submission", "High Signal Scout", "5 Deals Under Review"

Not gamification for its own sake — gives scouts a tangible sense of their contribution to Quanta's deal flow.

---

## 4. Quanta Team Experience

### 4.1 Quanta CoPilot Sidebar
**Type:** Addition
**Cost driver:** GPT-4o + Exa web search + pgvector

While reviewing a deal, a persistent sidebar AI that answers questions using:
- Your full deal history
- Portfolio company data
- Live web search

Example queries:
- "How does this compare to our logistics bets?"
- "What's the market size for agri-fintech in Maharashtra?"
- "Have we seen any similar founders before?"
- "What did we learn from our last SaaS investment that applies here?"

---

### 4.2 Partner Weekly Digest Email
**Type:** Addition
**Cost driver:** Resend + GPT-4o (already in stack)

Every Monday morning, an AI-generated digest to Evan and Mateo:

```
This week in your deal flow:

NEW DEALS (3)
• NeuralCart — B2B SaaS, Seed · Strong founder, 25% MoM growth · Scout: Atharva
• AgriPulse — AgriTech, Pre-seed · Early signal · Missing: pitch deck
• HealthSync — HealthTech, Series A · Under review

FOLLOW-UPS DUE (2)
• Rahul Patil (FlowOps) promised pitch deck by May 25
• Priya Menon (NeuralCart) — awaiting pilot customer names

STATUS CHANGES
• CarbonLoop → Intro Requested (moved by Mateo)
• DevPulse → Monitor (no update in 3 weeks)

SUGGESTED ACTIONS
• NeuralCart: all signals green — consider scheduling a call
• AgriPulse: ask scout for deck before spending more time
```

---

### 4.3 One-Click Intro Email Drafting
**Type:** Addition
**Cost driver:** GPT-4o (already in stack)

On any deal detail page, a "Draft Intro" button:
- GPT writes a warm intro email from Evan/Mateo to the founder
- References specific deal details, scout context, and Quanta's investment thesis
- Scout conviction included naturally ("Our scout Atharva has been tracking this space for months…")
- Partner reviews and sends in one click

---

### 4.4 Supabase Realtime Deal Feed
**Type:** Substitution (replaces polling)
**Cost driver:** Supabase Realtime (included in Supabase Pro plan)

Current inbox refreshes on page load. With Realtime:
- New deal arrives → immediately appears in inbox with a subtle animation
- Scout sends a message → conversation thread updates live without refresh
- Status changes visible to all team members simultaneously
- "Evan is viewing this deal" presence indicators

---

### 4.5 Portfolio Conflict Detection
**Type:** Addition

When a new deal is submitted, automatically check against:
- Existing portfolio companies (competitive overlap)
- Existing deal pipeline (duplicate outreach risk)

Output: warning banner on the deal card — "Similar to [Portfolio Co] — check competitive dynamics before proceeding."

---

## 5. Data & Intelligence Layer

### 5.1 pgvector Semantic Deal Search
**Type:** Addition
**Cost driver:** pgvector extension (free on Supabase) + OpenAI Embeddings

Replace the current keyword search with semantic search:
- "Show me deals similar to AgriPulse" → finds all deals with similar problem, market, and stage
- "What B2B SaaS deals are in our pipeline?" → semantic matching, not just category tags
- Quanta team can search by concept: "founder with deep ops background in logistics" → finds relevant deals

---

### 5.2 Scout Performance Analytics
**Type:** Addition

Per-scout dashboard visible only to Quanta team:
- Signal quality ratio: % of submissions that reach "Under Review" or better
- Category hit rate: which sectors is this scout strongest in?
- Response rate: % of check-ins responded to within 48 hours
- Submission cadence: weekly, monthly, seasonal trends
- Comparative rank: anonymised benchmarking within the network

Used for: coaching scouts, deciding which scouts to activate for specific deal categories, rewarding top performers.

---

### 5.3 Market Theme Clustering
**Type:** Addition
**Cost driver:** GPT-4o + pgvector

Automatically clusters deals by emerging market theme:
- Detects when multiple scouts independently surface deals in the same space
- Generates a "Market Pulse" note: "3 scouts flagged climate logistics deals in 6 weeks — this may be a structural shift worth tracking"
- Surfaces to Quanta team as a thematic alert

---

### 5.4 Signal Drift Alerts
**Type:** Addition
**Cost driver:** Exa web search + cron job (already in stack)

For every deal in the pipeline, weekly automated check:
- Did this startup raise a round publicly? (Crunchbase, TechCrunch)
- Did the founder get press coverage?
- Did they launch a product (Product Hunt, LinkedIn post)?
- Did a competitor raise?

If yes → auto-flag the deal and update the record. Partner receives a notification.

---

### 5.5 CRM Export & Integration
**Type:** Addition
**Cost driver:** Salesforce / HubSpot API (varies)

One-click export of any deal or scout record to:
- Salesforce (for VCs already using it as a portfolio tracker)
- HubSpot (deal pipeline)
- Notion (as a structured database)
- Airtable (for team collaboration)
- CSV export for any report

---

## 6. Infrastructure & Reliability

### 6.1 Background Job Queue (Inngest or Trigger.dev)
**Type:** Substitution (replaces fire-and-forget pipeline calls)
**Cost driver:** Inngest ($0 free tier → $50/month Pro)

Current `runPostSubmissionPipeline` is a fire-and-forget Promise — if it fails, it fails silently with no retry.

With Inngest:
- Every pipeline step is a tracked, retryable job
- Full observability: see exactly which step failed, with the error and input
- Automatic exponential backoff retries (3× by default)
- Fan-out: Step 2A (signals), 2B (brief), and 2C (enrichment) run as truly parallel jobs, not concurrent promises
- Failure alerting: Slack / email notification when a job fails after all retries

---

### 6.2 Upstash Redis — Rate Limiting & Idempotency
**Type:** Addition
**Cost driver:** Upstash Redis ($0 free tier → $10/month)

- **Rate limiting**: prevent scouts from submitting 50 deals in 5 minutes (accidental or abuse)
- **Webhook idempotency**: OpenClaw may deliver the same message twice — Redis deduplication prevents duplicate deals
- **Session caching**: cache `user_roles` lookup per user for 5 minutes — eliminates DB query on every middleware call

---

### 6.3 Dedicated Vercel Edge Config
**Type:** Addition
**Cost driver:** Vercel Pro ($20/month)

- **Edge Config**: store feature flags, rate limits, and killswitches at the edge — changes take effect in <100ms globally
- **Edge Middleware analytics**: see exactly where scouts and team members are dropping off
- **Preview deployments**: every PR gets a full preview URL with isolated DB (via Supabase branching)

---

### 6.4 Supabase Branching for Safe Migrations
**Type:** Addition
**Cost driver:** Supabase Pro ($25/month)

- Each feature branch gets its own Supabase branch (isolated DB)
- Test schema changes and seed data without touching production
- Merge branch → migration applied automatically on merge to main
- Eliminates the risk of "I ran a migration in prod by accident"

---

### 6.5 Monitoring & Alerting (Sentry + Datadog)
**Type:** Addition
**Cost driver:** Sentry Developer ($26/month) + Datadog APM ($15/host/month)

- **Sentry**: captures every client-side and server-side exception with full stack trace, breadcrumbs, and session replay
- **Datadog APM**: traces every API request end-to-end — see exactly which DB query is slow, which AI call timed out
- **Custom alerts**: if `/api/startup/init` errors exceed 5% in 10 minutes → PagerDuty alert

---

## 7. Full Stack Comparison Table

| Layer | Current (Demo Build) | Unconstrained Vision |
|---|---|---|
| **Scout channels** | Web app only | Web + Telegram + WhatsApp + Slack + SMS + Email-in |
| **Transcription** | Groq Whisper (shared, 25MB limit) | Dedicated Whisper / AssemblyAI (unlimited, diarization) |
| **LLM** | Groq Llama (free tier) | GPT-4o + Groq hybrid (GPT-4o for precision, Groq for speed) |
| **Enrichment** | Uploaded docs only | Live web search (Exa/Perplexity) + LinkedIn auto-fetch + vision |
| **Duplicate detection** | Text similarity | pgvector semantic embeddings (cosine similarity) |
| **Mobile** | Mobile web | React Native app (iOS + Android) |
| **Realtime** | Polling | Supabase Realtime WebSockets |
| **Email** | Resend shared domain | Resend verified domain (any recipient) + weekly digest |
| **Pipeline jobs** | Fire-and-forget Promise | Inngest background jobs (retries, observability) |
| **Rate limiting** | None | Upstash Redis edge rate limiting |
| **Monitoring** | Console logs | Sentry + Datadog APM |
| **DB branching** | Manual migrations | Supabase Branching per PR |
| **Search** | None / keyword | pgvector semantic search |
| **Analytics** | Basic counts | Scout performance scoring, market clustering, signal drift |
| **Integrations** | None | Salesforce / HubSpot / Notion / Airtable export |
| **Auth** | Cookie-based | Supabase Auth + SAML SSO for enterprise Quanta team |

---

## Priority Order for Next Build Phases

If budget unlocks incrementally, this is the recommended build order by ROI:

| Priority | Feature | Why First |
|---|---|---|
| 1 | **Telegram / WhatsApp bot** | Highest scout engagement lift — removes all friction from submission |
| 2 | **React Native app** | Voice pitch quality improves dramatically on native audio APIs |
| 3 | **Inngest job queue** | Reliability — pipeline failures are invisible right now |
| 4 | **Live web enrichment (Exa)** | Every deal gets richer automatically — no extra scout effort |
| 5 | **pgvector semantic search + duplicate detection** | Prevents duplicate outreach and surfaces deal patterns |
| 6 | **Partner weekly digest** | Highest Quanta team leverage — turns the system into a CIO-level briefing |
| 7 | **Supabase Realtime** | Removes the "why isn't this updating" confusion |
| 8 | **Scout analytics + leaderboard** | Retention and quality improvement for the scout network |
| 9 | **GPT-4o vision (deck photos)** | High convenience for scouts who receive physical decks |
| 10 | **CRM integrations** | Enables Quanta to bridge Scout OS with existing portfolio management |

---

*Quanta Scout OS Vision Document — May 2026*
