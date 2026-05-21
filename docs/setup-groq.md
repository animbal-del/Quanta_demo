# Groq Setup Guide

Groq replaces OpenAI for all LLM completions and speech-to-text in this app.
It runs on custom LPU hardware that makes everything significantly faster.

**Cost:** Free tier — no credit card needed.

| What | Model | Free tier |
|---|---|---|
| LLM (extraction, signals, briefs) | `llama-3.3-70b-versatile` | 14,400 requests/day |
| LLM (quick tasks, formatting) | `llama-3.1-8b-instant` | 14,400 requests/day |
| Speech-to-text | `whisper-large-v3-turbo` | 28,800 audio seconds/day |

---

## Step 1 — Create a Groq Account

1. Go to **https://console.groq.com**
2. Click **Sign Up** (top right)
3. Sign up with Google, GitHub, or email
4. Verify your email if prompted

---

## Step 2 — Get Your API Key

1. In the Groq console, click **API Keys** in the left sidebar
   Direct link: https://console.groq.com/keys
2. Click **Create API Key**
3. Name it: `quanta-scout-os`
4. Click **Submit**
5. **Copy the key immediately** — it starts with `gsk_` and won't be shown again

---

## Step 3 — Add the Key to `.env.local`

Open `.env.local` in your project root and replace the placeholder:

```bash
GROQ_API_KEY=TODO_get_from_console_groq_com
```

with your actual key:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4 — Restart the Dev Server

```bash
# Stop the current server (Ctrl+C), then:
npm run dev
```

The app detects `GROQ_API_KEY` automatically. No other changes needed.

---

## Step 5 — Verify It's Working

Run the manual test script:

```bash
node tests/scripts/test-manual-flow.js
```

You should see it complete noticeably faster than before.

Or open `/add-startup` in the browser, go through the voice pitch flow — transcription should finish in **2–5 seconds** instead of 10–20.

---

## What Uses Groq vs OpenAI

| Task | Provider | Model |
|---|---|---|
| Deal extraction from transcript | Groq | `llama-3.3-70b-versatile` |
| Signal generation | Groq | `llama-3.3-70b-versatile` |
| Internal deal brief | Groq | `llama-3.3-70b-versatile` |
| Market analysis | Groq | `llama-3.3-70b-versatile` |
| Question generation | Groq | `llama-3.3-70b-versatile` |
| Partner question rewrite | Groq | `llama-3.3-70b-versatile` |
| Recommended messages | Groq | `llama-3.1-8b-instant` |
| Voice transcription (pitch, answers, notes) | Groq | `whisper-large-v3-turbo` |
| Check-in / follow-up messages | Groq | `llama-3.1-8b-instant` |
| Commitment date extraction | Groq | `llama-3.1-8b-instant` |
| Embeddings (duplicate detection) | OpenAI | `text-embedding-3-small` |

Groq has no embeddings API, so `generateEmbedding()` stays on OpenAI.
Everything else routes through Groq when `GROQ_API_KEY` is set.

---

## Fallback Behaviour

If `GROQ_API_KEY` is missing or starts with `TODO_`, the app automatically
falls back to OpenAI for all calls. This means:

- You can remove `GROQ_API_KEY` at any time to switch back to OpenAI
- Both keys can coexist in `.env.local` — Groq takes priority when present

---

## Free Tier Limits

| Resource | Limit |
|---|---|
| Requests per minute (llama-3.3-70b) | 30 |
| Tokens per minute (llama-3.3-70b) | 14,400 |
| Requests per day | 14,400 |
| Audio seconds per day | 28,800 (~8 hours) |

These limits are more than enough for development and demos.
For production, upgrade to a paid Groq plan or add rate limiting.

---

## Troubleshooting

**"Authentication failed" or 401 error:**
→ Double-check the key in `.env.local` — no extra spaces, no quotes around the value.
→ Restart the dev server after editing `.env.local`.

**"Model not found" error:**
→ The model name may have changed. Check https://console.groq.com/docs/models for current names.
→ Update `MODEL_MAP` in `src/lib/groq/client.ts`.

**Responses feel different from GPT-4o:**
→ `llama-3.3-70b-versatile` is very capable but may respond differently to some prompts.
→ If a specific prompt isn't working well, adjust it in `src/prompts/`.
→ For critical outputs (brief, signals), `llama-3.3-70b-versatile` is the right model.

**Rate limit hit (429 error):**
→ You've hit 30 requests/minute or 14,400/day on the free tier.
→ Add a short delay between bulk operations, or upgrade to Groq paid.
