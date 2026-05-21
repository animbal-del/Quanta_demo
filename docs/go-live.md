# Go Live — Real Mode + Vercel Deployment

This guide takes the app from demo mode to production with real user accounts.

---

## Part 1 — Create Real User Accounts in Supabase

### 1.1 Create the Quanta Team account

In your **Supabase dashboard → Authentication → Users → Add user**:

| Field | Value |
|---|---|
| Email | `team@quanta.vc` (or any real email) |
| Password | choose a strong password |
| Email confirm | ✅ check "Auto Confirm User" |

Click **Create user**.

Then run this in the **SQL Editor** to assign the team role:

```sql
-- Assign quanta role to the team account
insert into user_roles (user_id, role)
select id, 'quanta'
from auth.users
where email = 'team@quanta.vc';
```

✅ The team can now log in at your app URL with that email + password.

---

### 1.2 Create scout accounts (two options)

**Option A — Invite flow (recommended):**
1. Log in as the team → go to `/scouts`
2. Click **+ Add Scout** → enter name + email → Send Invite
3. Scout receives a Resend email with a link to `/complete-signup?token=...`
4. Scout clicks the link → sets password → account created with `scout` role
5. Scout logs in with their email + password

**Option B — Manual (for existing demo scouts):**
```sql
-- Run for each scout you want to give a real account to.
-- After creating the user in Supabase Auth dashboard:

-- Replace the email with the actual email you created:
update scouts
set supabase_user_id = (
  select id from auth.users where email = 'amit@example.com'
)
where full_name = 'Amit Sharma';

insert into user_roles (user_id, role)
select id, 'scout'
from auth.users
where email = 'amit@example.com';
```

---

### 1.3 Verify accounts work

1. Go to your app → login page
2. Enter team email + password → select Quanta Team → Sign in
3. Should land on `/inbox` with real Supabase data
4. Log out → log in with a scout email → should land on `/scout`

---

## Part 2 — Deploy to Vercel

### 2.1 Push code to GitHub

```bash
cd /Users/atharva/Documents/Quanta-Demo
git status  # make sure working tree is clean
git push origin main
```

### 2.2 Import to Vercel

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **Add New → Project**
3. Find `Quanta_Scout_OS` → click **Import**
4. Framework: **Next.js** (auto-detected)
5. Root directory: `.` (default)
6. Click **Deploy** — first deploy will fail because env vars are missing, that's fine

### 2.3 Add environment variables

In Vercel → your project → **Settings → Environment Variables**.

Add each variable below (set Environment to: **Production, Preview, Development**):

```
NEXT_PUBLIC_SUPABASE_URL          = https://qadktgehqbqjsjkdlrlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJhbGci... (your full anon key)
SUPABASE_SERVICE_ROLE_KEY         = eyJhbGci... (your full service role key)
OPENAI_API_KEY                    = sk-proj-...
GROQ_API_KEY                      = gsk_...
RESEND_API_KEY                    = re_...
RESEND_FROM_EMAIL                 = onboarding@resend.dev
NEXT_PUBLIC_APP_URL               = https://your-project.vercel.app
CRON_SECRET                       = (generate below)
OPENCLAW_SIMULATE                 = true
```

**Generate CRON_SECRET** — run this in your terminal:
```bash
openssl rand -hex 32
```
Copy the output and paste it as `CRON_SECRET`.

### 2.4 Redeploy

After adding all env vars:
- Vercel → **Deployments** → click the latest → three dots → **Redeploy**

### 2.5 Update NEXT_PUBLIC_APP_URL

Once deployed, Vercel gives you a URL like `https://quanta-scout-os-xyz.vercel.app`.

1. In Vercel → Settings → Environment Variables → update `NEXT_PUBLIC_APP_URL` to your real URL
2. Redeploy again

### 2.6 Update Supabase with your Vercel URL

In Supabase → **Authentication → URL Configuration**:

1. **Site URL:** `https://your-project.vercel.app`
2. **Redirect URLs** (add each):
   ```
   https://your-project.vercel.app
   https://your-project.vercel.app/**
   https://your-project.vercel.app/complete-signup
   ```
3. Save

### 2.7 Set up a custom domain (optional)

Vercel → Settings → Domains → Add → enter your domain → follow DNS instructions.

After domain is live, update:
- `NEXT_PUBLIC_APP_URL` in Vercel env vars
- Supabase Site URL and Redirect URLs

---

## Part 3 — Cron Jobs (automatic follow-ups)

The `vercel.json` already defines two cron jobs. They activate automatically on the Pro plan.

On the free Hobby plan, crons run but with limitations (1 per day max).

**Manual trigger** (works on any plan):
```bash
curl -X POST https://your-project.vercel.app/api/internal/scheduler \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"job": "all"}'
```

---

## Part 4 — Production Checklist

Before announcing the app is live:

- [ ] Team account created in Supabase + role assigned
- [ ] At least one scout invited and account completed
- [ ] Demo seed data loaded (run `supabase/seed/demo-seed-v2.sql`)
- [ ] Vercel deployed with all env vars
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Supabase redirect URLs updated
- [ ] Login works for team (email + password → `/inbox`)
- [ ] Login works for scout (email + password → `/scout`)
- [ ] Invite flow works (+ Add Scout → email received → complete-signup → login)
- [ ] Submission flow works (add-startup → 6 steps → deal in `/inbox`)
- [ ] Groq transcription works (voice pitch → transcript shown)
- [ ] Resend emails working (invite email arrives)
- [ ] Cron secret set for scheduler protection

---

## Environment Variables Reference

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Project Settings → API → service_role key |
| `OPENAI_API_KEY` | ✅ | platform.openai.com → API Keys |
| `GROQ_API_KEY` | ✅ | console.groq.com → API Keys |
| `RESEND_API_KEY` | ✅ | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | ✅ | `onboarding@resend.dev` (free) or your domain |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your Vercel URL or custom domain |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32` |
| `OPENCLAW_SIMULATE` | — | `true` (keep until OpenClaw is connected) |

---

## Removing the Demo Button

Once real accounts are live, remove the "Explore demo without an account" option:

Edit `src/app/page.tsx` — delete the demo login button section:
```tsx
// Remove these lines from page.tsx:
<div className="mt-4 pt-4 border-t border-gray-100">
  <button onClick={handleDemoLogin} ...>
    Explore demo without an account →
  </button>
</div>
```

Also delete `src/app/api/auth/demo/route.ts` so the demo endpoint no longer exists.

---

## Troubleshooting

**Login redirects back to `/` immediately:**
→ Role not assigned. Run the SQL in step 1.1 to assign `quanta` role.

**Invite email not received:**
→ Check Resend dashboard for delivery logs. Check spam folder.

**"Invalid invite link" on complete-signup:**
→ Token expired (7 days). Re-invite the scout from `/scouts`.

**Groq transcription returns empty:**
→ Verify `GROQ_API_KEY` is set in Vercel env vars (not just `.env.local`).

**Cron not running:**
→ `CRON_SECRET` must match what's in Vercel env vars. Trigger manually to test.
