# Demo Guide

## Demo Storyline (10 minutes)

### Scene 1 — Scout receives check-in
**Channel:** Telegram (or web chat)
**What happens:** Scheduler sends weekly check-in to scout "Amit"

> "Any founders cross your radar this week?"

**Scout replies:**
> "Met Rohan at Purdue hackathon. He's building FlowOps, AI agents for logistics dispatch. No deck yet but he mentioned 3 pilot conversations."

**What to show:** Message appears in web chat UI instantly.

---

### Scene 2 — AI captures deal
**What happens:** System extracts structured deal data, asks follow-up

> "Got it. What made FlowOps stand out?"

**Scout replies:**
> "Rohan seemed very technical and fast-moving."

**What to show:** Deal card appears on the Quanta Dashboard (Deal Inbox).

---

### Scene 3 — Missing info captured
**What happens:** AI asks about deck/intro

> "Do you know when you can get the deck or founder intro?"

**Scout replies:**
> "I can get the deck by May 22."

**What to show:**
- `missing_info_tasks` record created with `expected_date: 2026-05-22`
- Deal shows "Waiting on deck" badge
- Follow-up queue shows FlowOps scheduled for May 23

---

### Scene 4 — Quanta dashboard
**Switch to:** Internal dashboard view

**What to show:**
- Deal Inbox with FlowOps card
- Signal card: "Founder: Strong | Traction: Early"
- Missing info section: "Deck — pending May 22"
- Internal Brief: "FlowOps: AI agents for logistics dispatch"

---

### Scene 5 — Partner asks question
**Action:** Partner clicks "Ask Scout" on FlowOps deal

**Partner types:**
> "Ask who the 3 pilot customers are and whether founder can intro us"

**What to show:**
- AI rewrites to: "Quanta had one quick follow-up on FlowOps: do you know who the 3 pilot customers are, and would Rohan be open to an intro?"
- Confirmation modal with edit option
- Click "Send via OpenClaw"
- Message appears in Telegram / web chat

---

### Scene 6 — Scheduler follow-up
**Action:** Click "Run Follow-up Agent" button on Follow-up Queue page

**What happens:** System sends to scout:
> "You mentioned you'd try to get FlowOps' deck by May 22. Were you able to get it?"

**What to show:** Message appears in scout chat. Deal thread updates.

---

## Demo Reliability Checklist

Before any demo:
- [ ] Seed data loaded (use "Reset Demo" button on demo control panel)
- [ ] FlowOps deal exists with status `needs_info`
- [ ] missing_info_task exists for FlowOps deck with `followup_date = today`
- [ ] Scout "Amit" exists with `openclaw_user_id` mapped
- [ ] OpenClaw Telegram bot responding (if using live channel)
- [ ] Web chat fallback working (if not using Telegram)

---

## Demo Control Panel Routes

| Route | Purpose |
|---|---|
| `/demo/seed` | Load seed data (scouts, deals, tasks) |
| `/demo/reset` | Reset all demo data to initial state |
| `/demo/scheduler` | Manually trigger scheduler jobs |
| `/demo/simulate-followup` | Simulate May 23 follow-up for FlowOps |
| `/demo/simulate-checkin` | Trigger check-in for Amit |

---

## Honest Demo Notes (What to Say)

**On enrichment:**
> "For the prototype, enrichment is implemented for uploaded docs and structured text. In production, the same agent runs web enrichment and founder profile research."

**On OpenClaw channels:**
> "OpenClaw supports Telegram, WhatsApp, Slack, and more. For the demo we're using Telegram as the live channel. The same backend works across all channels with no code changes."

**On scoring:**
> "We deliberately don't use a numeric score. These qualitative signals are more honest and more useful for early-stage triage."

---

## Key Interview Lines

> "I used OpenClaw as the scout-facing gateway, because scouts should interact through the channels they already use. The product layer behind it structures messy inputs, remembers commitments, follows up automatically, and gives Quanta a clean investment signal inbox."

> "The core design principle is that scouts should feel like they're texting Quanta, not filling out a CRM. Every UX decision flows from that."

> "We ask one question at a time. Never a form. Never a checklist. The AI decides what's most important to ask next based on what's already known."
