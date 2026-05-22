# Supabase Setup Guide

**Status:** Credentials already in `.env.local` ✅
**What's left:** Run the SQL migrations and configure Auth settings.

---

## Step 1 — Confirm Your Project

Your Supabase project URL is already in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://qadktgehqbqjsjkdlrlb.supabase.co
```

Go to: https://supabase.com/dashboard/project/qadktgehqbqjsjkdlrlb

---

## Step 2 — Run the Database Migrations

### 2A — Run the full schema (fresh install)

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/migrations/001_initial_schema.sql` in your editor
4. Copy the entire file contents
5. Paste into the SQL editor
6. Click **Run** (or press Cmd+Enter)
7. You should see: "Success. No rows returned"

> If you get errors about tables already existing, skip to Step 2B instead.

### 2B — Run incremental v2 migration (if 001 already ran)

1. Click **New query** in the SQL editor
2. Open `supabase/migrations/002_v2_schema.sql`
3. Copy and paste the full contents
4. Click **Run**

### 2C — Load demo seed data

1. Click **New query**
2. Open `supabase/seed/demo-seed.sql`
3. Copy and paste the full contents
4. Click **Run**

You should now see 3 scouts and 3 deals in the database.

**Verify:** Go to **Table Editor** → click `scouts` → you should see Amit Sharma, Sarah Chen, Jordan Lee.

---

## Step 3 — Enable Email Auth

1. In the Supabase dashboard, go to **Authentication → Providers**
2. Find **Email** in the list
3. Make sure it is **Enabled** (toggle is on)
4. Under **Email** settings:
   - **Confirm email:** Toggle ON (scouts must confirm their email)
   - **Secure email change:** Toggle ON
5. Click **Save**

---

## Step 4 — Configure Email Templates

Supabase sends auth emails (confirmation, password reset). Customize these to match Quanta branding.

1. Go to **Authentication → Email Templates**
2. Update the **Confirm signup** template:

**Subject:**
```
You're invited to Quanta Scout OS
```

**Body** (HTML):
```html
<h2>Welcome to Quanta Scout OS</h2>
<p>Hi there,</p>
<p>You've been invited to join Quanta as a scout. Click the button below to complete your account setup.</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Complete Setup</a></p>
<p>This link expires in 24 hours.</p>
```

3. Click **Save**

---

## Step 5 — Configure Auth Settings

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3001`
   - Production (after Vercel deploy): `https://your-app.vercel.app`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:3001/auth/complete-signup
   http://localhost:3001/**
   https://your-app.vercel.app/auth/complete-signup
   https://your-app.vercel.app/**
   ```
4. Click **Save**

---

## Step 6 — Disable Email Confirmation for Development (Optional)

To speed up testing without needing real emails during development:

1. Go to **Authentication → Providers → Email**
2. Toggle **Confirm email** OFF
3. Save

> Re-enable before going to production.

---

## Step 7 — Enable Storage for File Uploads

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Create two buckets:

   **Bucket 1:**
   - Name: `deal-files`
   - Public: OFF
   - File size limit: 25MB
   - Allowed MIME types: **leave blank** (blank = allow all types — avoids rejecting .doc, .docx, etc.)

   **Bucket 2:**
   - Name: `scout-audio`
   - Public: OFF
   - File size limit: 10MB
   - Allowed MIME types: **leave blank**

   > If you already created these buckets with MIME type restrictions, edit each bucket and clear the "Allowed MIME types" field.

4. For each bucket, click **Policies** → **New policy** → **For full customization**:

```sql
-- Allow authenticated scouts to upload to their own deals
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id in ('deal-files', 'scout-audio'));

-- Allow authenticated users to read
create policy "Authenticated users can read"
on storage.objects for select
to authenticated
using (bucket_id in ('deal-files', 'scout-audio'));
```

---

## Step 8 — Verify Everything Works

Run this query in the SQL editor to confirm all tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected output (11 tables):
```
ai_outputs
deal_answers
deal_files
deal_messages
deals
email_correspondence
founders
internal_notes
missing_info_tasks
partner_questions
scout_invites
scout_notes
scouts
user_roles
```

---

## Troubleshooting

**"relation already exists" error when running 001:**
→ The table was already created. Run `002_v2_schema.sql` instead.

**"permission denied" error:**
→ Make sure you're in the SQL Editor (not a table view). The editor runs as service role.

**Seed data errors:**
→ Run migrations first, then seed. Seed depends on tables existing.
