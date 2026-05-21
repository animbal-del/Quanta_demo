# Vercel Deployment Guide

**Cost:** Free Hobby tier — unlimited deployments, custom domains, 100GB bandwidth/month.

---

## Step 1 — Push Code to GitHub

Vercel deploys from a Git repository. Set one up first.

```bash
# In the project root
cd /Users/atharva/Documents/Quanta-Demo

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Quanta Scout OS setup"

# Create a new repo on GitHub (github.com → New repository)
# Name it: quanta-scout-os
# Keep it PRIVATE

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/quanta-scout-os.git
git branch -M main
git push -u origin main
```

> **Important:** `.env.local` is in `.gitignore` so your API keys won't be pushed. Never commit `.env.local`.

---

## Step 2 — Create a .gitignore

Make sure this exists at the project root:

```bash
cat > /Users/atharva/Documents/Quanta-Demo/.gitignore << 'EOF'
# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# env files — never commit these
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
```

---

## Step 3 — Deploy to Vercel

1. Go to **https://vercel.com**
2. Click **Sign Up** → Continue with GitHub
3. After signing in, click **Add New → Project**
4. Find your `quanta-scout-os` repo and click **Import**
5. On the configuration screen:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `.` (leave default)
   - **Build Command:** `npm run build` (leave default)
   - **Output Directory:** Leave empty (Next.js default)
6. Click **Deploy**

First deploy will take about 2 minutes.

---

## Step 4 — Add Environment Variables

After the first deploy, add your secrets:

1. In Vercel dashboard, go to your project → **Settings → Environment Variables**
2. Add each of these (one at a time, click Add):

```
NEXT_PUBLIC_SUPABASE_URL        = https://qadktgehqbqjsjkdlrlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci... (your full anon key)
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGci... (your full service role key)
OPENAI_API_KEY                  = sk-proj-...
RESEND_API_KEY                  = re_...
RESEND_FROM_EMAIL               = onboarding@resend.dev
NEXT_PUBLIC_APP_URL             = https://your-project.vercel.app
CRON_SECRET                     = (generate: openssl rand -hex 32)
OPENCLAW_SIMULATE               = true
```

3. For each variable, set **Environment** to: Production, Preview, Development (all three)
4. Click **Save**

---

## Step 5 — Redeploy with Environment Variables

After adding env vars:

1. Go to your project → **Deployments**
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Click **Redeploy** in the confirmation

---

## Step 6 — Update Supabase with Your Vercel URL

Once you have your Vercel URL (e.g. `https://quanta-scout-os.vercel.app`):

1. Go to Supabase dashboard → **Authentication → URL Configuration**
2. Update **Site URL** to your Vercel URL
3. Add to **Redirect URLs:**
   ```
   https://quanta-scout-os.vercel.app/auth/complete-signup
   https://quanta-scout-os.vercel.app/**
   ```
4. Save

---

## Step 7 — Configure Cron Jobs

The `vercel.json` at the project root sets up scheduled jobs. It's already created.

**What the crons do:**
- `0 9 * * *` — Runs follow-up reminders at 9am UTC daily
- `0 10 * * 1` — Runs scout check-ins at 10am UTC every Monday

**How to verify crons are running:**
1. Go to your Vercel project → **Cron Jobs** tab
2. You should see two cron entries listed

---

## Step 8 — Set Up a Custom Domain (Optional)

1. Go to your Vercel project → **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g. `scout.quantaventures.com`)
4. Vercel gives you DNS records to add to your domain registrar:
   - If using Vercel nameservers: automatic
   - If using external DNS: add CNAME record
5. Wait for DNS propagation (usually under 10 minutes on Cloudflare)
6. Update `NEXT_PUBLIC_APP_URL` environment variable to the custom domain
7. Update Supabase redirect URLs as well

---

## Vercel Free Tier Limits

| Limit | Free (Hobby) |
|---|---|
| Deployments | Unlimited |
| Bandwidth | 100 GB/month |
| Serverless function execution | 100 GB-hours/month |
| Cron jobs | 2 per project |
| Function timeout | 10 seconds (upgrade to Pro for 60s) |
| Team members | 1 |

> **Important:** The 10-second function timeout on the free tier may be too short for audio transcription (Whisper takes 5-15 seconds). You have two options:
> - Upgrade to Vercel Pro ($20/month) for 60-second timeouts
> - Use Supabase Edge Functions for the audio transcription endpoint (free)

---

## Continuous Deployment

After setup, every push to the `main` branch automatically deploys to production.

Every push to any other branch creates a preview URL automatically (great for testing features before merging).

```bash
# Feature branch workflow
git checkout -b feature/auth-system
# ... make changes
git add .
git commit -m "Add auth system"
git push origin feature/auth-system
# Vercel creates a preview URL automatically
```
