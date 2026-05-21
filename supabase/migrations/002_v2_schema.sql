-- Quanta Scout OS — v2 Schema Additions
-- Run AFTER 001_initial_schema.sql
-- Adds: auth roles, invites, email tracking, deal answers, scout notes
-- Updates: scouts table, deals table

-- ─── user_roles ──────────────────────────────────────────────────────────────
-- Maps Supabase Auth users to application roles
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('scout', 'quanta', 'admin')),
  created_at timestamptz default now(),
  unique(user_id)
);

create index if not exists user_roles_user_id_idx on user_roles(user_id);

-- RLS: Users can read their own role; admins/service role can write
alter table user_roles enable row level security;

create policy "Users can read own role"
  on user_roles for select
  using (auth.uid() = user_id);

-- ─── scout_invites ────────────────────────────────────────────────────────────
-- Tracks pending invite links sent to scouts
create table if not exists scout_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by text,
  scout_id uuid references scouts(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

create index if not exists scout_invites_token_idx on scout_invites(token);
create index if not exists scout_invites_email_idx on scout_invites(email);

-- ─── email_correspondence ────────────────────────────────────────────────────
-- Tracks every email sent to scouts and their responses
create table if not exists email_correspondence (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references scouts(id) on delete cascade,
  email_type text not null check (
    email_type in ('weekly_checkin', 'followup', 'invite', 'submission_confirm', 'custom')
  ),
  subject text,
  resend_message_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  response text check (response in ('yes_have_startup', 'nothing_this_week', null)),
  responded_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists email_correspondence_scout_id_idx on email_correspondence(scout_id);
create index if not exists email_correspondence_email_type_idx on email_correspondence(email_type);

-- ─── deal_answers ────────────────────────────────────────────────────────────
-- Stores scout answers to AI-generated questions during submission
create table if not exists deal_answers (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  question text not null,
  answer_text text,
  answer_audio_url text,
  answer_type text default 'text' check (answer_type in ('text', 'voice', 'skipped')),
  created_at timestamptz default now()
);

create index if not exists deal_answers_deal_id_idx on deal_answers(deal_id);

-- ─── scout_notes ─────────────────────────────────────────────────────────────
-- Stores scout's personal voice/text notes about a startup (not for Quanta's fields)
create table if not exists scout_notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  note_text text,
  audio_url text,
  duration_seconds int,
  note_type text default 'voice' check (note_type in ('voice', 'text')),
  created_at timestamptz default now()
);

create index if not exists scout_notes_deal_id_idx on scout_notes(deal_id);

-- ─── scouts table additions ───────────────────────────────────────────────────
alter table scouts
  add column if not exists supabase_user_id uuid references auth.users(id) on delete set null,
  add column if not exists phone_verified boolean default false,
  add column if not exists invite_status text default 'invited'
    check (invite_status in ('invited', 'active', 'paused', 'removed')),
  add column if not exists last_email_sent_at timestamptz,
  add column if not exists last_email_responded_at timestamptz;

create unique index if not exists scouts_supabase_user_id_idx
  on scouts(supabase_user_id) where supabase_user_id is not null;

-- ─── deals table additions ────────────────────────────────────────────────────
alter table deals
  add column if not exists submission_mode text
    check (submission_mode in ('voice', 'manual', 'document', null)),
  add column if not exists review_label text
    check (review_label in ('strong_candidate', 'worth_exploring', 'needs_more_info', null));

-- ─── RLS policies for new tables ─────────────────────────────────────────────
-- Using service role key in API routes bypasses RLS, so these are for safety

alter table scout_invites enable row level security;
alter table email_correspondence enable row level security;
alter table deal_answers enable row level security;
alter table scout_notes enable row level security;

-- Allow service role to do everything (API routes use service role)
-- Scouts can read their own answers and notes
create policy "Scouts read own deal_answers"
  on deal_answers for select
  using (
    scout_id in (
      select id from scouts where supabase_user_id = auth.uid()
    )
  );

create policy "Scouts read own scout_notes"
  on scout_notes for select
  using (
    scout_id in (
      select id from scouts where supabase_user_id = auth.uid()
    )
  );

-- ─── Helper function: get current scout id from auth ─────────────────────────
create or replace function get_current_scout_id()
returns uuid
language sql
security definer
as $$
  select id from scouts where supabase_user_id = auth.uid() limit 1;
$$;

-- ─── Helper function: get current user role ───────────────────────────────────
create or replace function get_current_user_role()
returns text
language sql
security definer
as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;
