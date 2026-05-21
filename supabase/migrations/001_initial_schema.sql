-- Quanta Scout OS — Complete Schema (v1 + v2 combined)
-- Run this for a fresh installation. For existing installs, run 002_v2_schema.sql separately.
-- Last updated: 2026-05-21

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── scouts ──────────────────────────────────────────────────────────────────
create table scouts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  openclaw_channel text,
  openclaw_user_id text unique,
  preferred_channel text default 'telegram',
  status text default 'active',
  focus_areas text[] default '{}',
  last_active_at timestamptz,
  last_checkin_at timestamptz,
  responsiveness_score numeric default 0,
  -- v2 additions
  supabase_user_id uuid references auth.users(id) on delete set null,
  phone_verified boolean default false,
  invite_status text default 'invited'
    check (invite_status in ('invited', 'active', 'paused', 'removed')),
  last_email_sent_at timestamptz,
  last_email_responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index scouts_openclaw_user_id_idx on scouts(openclaw_user_id);
create index scouts_status_idx on scouts(status);
create unique index scouts_supabase_user_id_idx
  on scouts(supabase_user_id) where supabase_user_id is not null;

-- ─── deals ───────────────────────────────────────────────────────────────────
create table deals (
  id uuid primary key default gen_random_uuid(),
  startup_name text,
  one_line_description text,
  category text,
  stage text,
  status text default 'draft',
  source_scout_id uuid references scouts(id) on delete set null,
  scout_conviction text default 'unknown',
  source_context text,
  ai_confidence numeric,
  priority text default 'normal',
  -- v2 additions
  submission_mode text check (submission_mode in ('voice', 'manual', 'document', null)),
  review_label text check (review_label in ('strong_candidate', 'worth_exploring', 'needs_more_info', null)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index deals_status_idx on deals(status);
create index deals_source_scout_id_idx on deals(source_scout_id);
create index deals_priority_idx on deals(priority);

-- ─── founders ────────────────────────────────────────────────────────────────
create table founders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  full_name text,
  email text,
  linkedin_url text,
  background_summary text,
  created_at timestamptz default now()
);

create index founders_deal_id_idx on founders(deal_id);

-- ─── deal_messages ───────────────────────────────────────────────────────────
create table deal_messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  sender_type text not null,
  channel text,
  message_type text default 'text',
  body text,
  raw_payload jsonb,
  created_at timestamptz default now()
);

create index deal_messages_deal_id_idx on deal_messages(deal_id);
create index deal_messages_scout_id_idx on deal_messages(scout_id);

-- ─── deal_files ──────────────────────────────────────────────────────────────
create table deal_files (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  uploaded_by_scout_id uuid references scouts(id) on delete set null,
  file_name text,
  file_type text,
  storage_url text,
  extracted_text text,
  summary text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index deal_files_deal_id_idx on deal_files(deal_id);

-- ─── missing_info_tasks ───────────────────────────────────────────────────────
create table missing_info_tasks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  info_needed text not null,
  expected_date date,
  followup_date date,
  status text default 'pending',
  last_reminded_at timestamptz,
  reminder_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index missing_info_tasks_deal_id_idx on missing_info_tasks(deal_id);
create index missing_info_tasks_followup_date_idx on missing_info_tasks(followup_date);
create index missing_info_tasks_status_idx on missing_info_tasks(status);

-- ─── ai_outputs ──────────────────────────────────────────────────────────────
create table ai_outputs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  output_type text not null,
  model_name text,
  input_snapshot jsonb,
  output_json jsonb,
  created_at timestamptz default now()
);

create index ai_outputs_deal_id_idx on ai_outputs(deal_id);
create index ai_outputs_output_type_idx on ai_outputs(output_type);

-- ─── internal_notes ──────────────────────────────────────────────────────────
create table internal_notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  author_name text,
  note text not null,
  visibility text default 'internal',
  created_at timestamptz default now()
);

create index internal_notes_deal_id_idx on internal_notes(deal_id);

-- ─── partner_questions ────────────────────────────────────────────────────────
create table partner_questions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  question_text text not null,
  ai_rewritten_message text,
  status text default 'pending',
  asked_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz default now()
);

create index partner_questions_deal_id_idx on partner_questions(deal_id);
create index partner_questions_status_idx on partner_questions(status);

-- ─── user_roles ──────────────────────────────────────────────────────────────
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('scout', 'quanta', 'admin')),
  created_at timestamptz default now(),
  unique(user_id)
);

create index user_roles_user_id_idx on user_roles(user_id);

alter table user_roles enable row level security;
create policy "Users can read own role"
  on user_roles for select
  using (auth.uid() = user_id);

-- ─── scout_invites ────────────────────────────────────────────────────────────
create table scout_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by text,
  scout_id uuid references scouts(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

create index scout_invites_token_idx on scout_invites(token);
create index scout_invites_email_idx on scout_invites(email);

-- ─── email_correspondence ────────────────────────────────────────────────────
create table email_correspondence (
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

create index email_correspondence_scout_id_idx on email_correspondence(scout_id);
create index email_correspondence_email_type_idx on email_correspondence(email_type);

-- ─── deal_answers ────────────────────────────────────────────────────────────
create table deal_answers (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  question text not null,
  answer_text text,
  answer_audio_url text,
  answer_type text default 'text' check (answer_type in ('text', 'voice', 'skipped')),
  created_at timestamptz default now()
);

create index deal_answers_deal_id_idx on deal_answers(deal_id);

-- ─── scout_notes ─────────────────────────────────────────────────────────────
create table scout_notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  scout_id uuid references scouts(id) on delete set null,
  note_text text,
  audio_url text,
  duration_seconds int,
  note_type text default 'voice' check (note_type in ('voice', 'text')),
  created_at timestamptz default now()
);

create index scout_notes_deal_id_idx on scout_notes(deal_id);

-- ─── RLS for new tables ───────────────────────────────────────────────────────
alter table scout_invites enable row level security;
alter table email_correspondence enable row level security;
alter table deal_answers enable row level security;
alter table scout_notes enable row level security;

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

-- ─── updated_at triggers ─────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scouts_updated_at before update on scouts
  for each row execute function update_updated_at();

create trigger deals_updated_at before update on deals
  for each row execute function update_updated_at();

create trigger missing_info_tasks_updated_at before update on missing_info_tasks
  for each row execute function update_updated_at();

-- ─── Helper functions ─────────────────────────────────────────────────────────
create or replace function get_current_scout_id()
returns uuid
language sql
security definer
as $$
  select id from scouts where supabase_user_id = auth.uid() limit 1;
$$;

create or replace function get_current_user_role()
returns text
language sql
security definer
as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;
