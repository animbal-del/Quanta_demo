# Resend Email Setup Guide

**Package:** Already installed (`resend@6.12.3` in package.json) ✅
**Cost:** Free tier — 3,000 emails/month, 100/day. No credit card needed.

---

## Step 1 — Create a Resend Account

1. Go to **https://resend.com**
2. Click **Get Started** (top right)
3. Sign up with your email (use your personal or Quanta email)
4. Verify your email address

---

## Step 2 — Get Your API Key

1. After logging in, go to **API Keys** in the left sidebar
   Direct link: https://resend.com/api-keys
2. Click **Create API Key**
3. Name it: `quanta-scout-os-dev`
4. Permission: **Sending access** (default)
5. Click **Add**
6. **Copy the key immediately** — it won't be shown again

---

## Step 3 — Add the API Key to Your .env.local

Open `.env.local` and add:

```bash
# ─── Resend (email) ──────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

> **Important:** On the free plan without a custom domain, use `onboarding@resend.dev` as the FROM address. This is Resend's shared sending domain that works without domain setup.

---

## Step 4 — (Optional but Recommended) Add a Custom Domain

With a custom domain you can send from `scout@quantaventures.com` instead of Resend's default.

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g. `quantaventures.com`)
4. Resend will give you DNS records to add:
   - SPF record (TXT)
   - DKIM records (TXT × 2)
   - DMARC record (TXT)
5. Add these in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
6. Click **Verify** after adding — takes 5-60 minutes to propagate
7. Once verified, update `RESEND_FROM_EMAIL=scout@quantaventures.com`

> Skip this for now during development. `onboarding@resend.dev` works fine for testing.

---

## Step 5 — Verify the Setup

The Resend client is at `src/lib/resend/client.ts`. To test it's working:

```bash
# In a new terminal in the project folder
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your@email.com"}'
```

> This test endpoint will be built in Phase 7. For now, just confirm the API key is in .env.local.

---

## Step 6 — Understand Free Tier Limits

| Limit | Free Tier |
|---|---|
| Emails per month | 3,000 |
| Emails per day | 100 |
| Custom domains | 1 |
| Team members | 1 |
| Email logs retained | 3 days |

These limits are more than enough for development and early demos.

---

## What Resend Is Used For (in This App)

| Email Type | Trigger | Template |
|---|---|---|
| Scout invite | Admin adds scout | `emails/invite.tsx` (Phase 7) |
| Weekly check-in | Monday 10am cron | `emails/weekly-checkin.tsx` (Phase 7) |
| Follow-up reminder | Scheduler job | `emails/followup.tsx` (Phase 7) |
| Submission confirmation | Scout submits startup | `emails/submission-confirm.tsx` (Phase 7) |

---

## Troubleshooting

**"API key is invalid" error:**
→ Make sure there's no trailing space in the key in `.env.local`. Restart the dev server after editing.

**Emails going to spam:**
→ Use a custom domain with SPF/DKIM records (Step 4). The `onboarding@resend.dev` domain is generally trusted.

**"Daily sending limit exceeded":**
→ You hit 100 emails/day. Wait until midnight UTC or upgrade to a paid plan.
