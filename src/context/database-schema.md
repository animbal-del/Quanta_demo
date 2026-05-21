# Database Schema Reference

All tables live in Supabase (Postgres). Migration files are in `supabase/migrations/`.

## Tables

### `scouts`
Stores all scout identities across channels.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| full_name | text | required |
| email | text | optional |
| phone | text | optional |
| openclaw_channel | text | which channel they use |
| openclaw_user_id | text | e.g. `tg_123` for Telegram |
| preferred_channel | text | default: `telegram` |
| status | text | active / inactive / paused |
| focus_areas | text[] | e.g. ["AI", "Developer Tools"] |
| last_active_at | timestamptz | last message received |
| last_checkin_at | timestamptz | last check-in sent |
| responsiveness_score | numeric | 0-1, updated over time |

**Key index:** `openclaw_user_id` — used for identity resolution on every webhook call.

---

### `deals`
Core deal record. Created from first scout submission, updated throughout lifecycle.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| startup_name | text | null until extracted |
| one_line_description | text | null until extracted |
| category | text | AI/ML, SaaS, Fintech, etc. |
| stage | text | pre-seed, seed, etc. |
| status | text | see state machine below |
| source_scout_id | uuid | FK → scouts |
| scout_conviction | text | low / medium / high / unknown |
| source_context | text | where scout met founder |
| ai_confidence | numeric | 0-1, from extraction output |
| priority | text | low / normal / high |

**Status state machine:**
```
draft → submitted → needs_info → under_review → intro_requested → [monitor / archived / rejected]
```

---

### `founders`
One or more founders per deal. Created during extraction if name found.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals (cascade delete) |
| full_name | text | |
| email | text | |
| linkedin_url | text | |
| background_summary | text | AI-generated summary |

---

### `deal_messages`
Full conversation thread per deal.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| scout_id | uuid | FK → scouts (null if AI/system) |
| sender_type | text | scout / ai / quanta / system |
| channel | text | which channel the message came from |
| message_type | text | text / voice / file / image / link |
| body | text | message content |
| raw_payload | jsonb | full OpenClaw payload |

---

### `deal_files`
Uploaded decks, PDFs, voice notes, screenshots.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| uploaded_by_scout_id | uuid | FK → scouts |
| file_name | text | |
| file_type | text | MIME type |
| storage_url | text | Supabase Storage URL |
| extracted_text | text | parsed text from PDF/doc |
| summary | text | AI-generated summary |
| metadata | jsonb | page count, duration, etc. |

---

### `missing_info_tasks`
Tracks promised information scouts said they would provide.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| scout_id | uuid | FK → scouts |
| info_needed | text | e.g. "pitch deck" |
| expected_date | date | what scout said |
| followup_date | date | expected_date + 1 |
| status | text | pending / completed / deferred / stale / cancelled |
| last_reminded_at | timestamptz | |
| reminder_count | int | incremented each follow-up |

**Scheduler query:** `SELECT * FROM missing_info_tasks WHERE followup_date = TODAY AND status = 'pending'`

---

### `ai_outputs`
Stores every AI generation for auditability and re-use.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| output_type | text | extraction / signal_summary / internal_brief / followup_question / duplicate_check / enrichment |
| model_name | text | e.g. gpt-4o |
| input_snapshot | jsonb | exact inputs used |
| output_json | jsonb | exact output returned |

**Usage:** Dashboard reads latest `signal_summary` and `internal_brief` per deal.

---

### `partner_questions`
Tracks questions sent from Quanta partners to scouts.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| scout_id | uuid | FK → scouts |
| question_text | text | original internal question |
| ai_rewritten_message | text | scout-friendly version |
| status | text | pending / sent / answered / cancelled |
| asked_at | timestamptz | when sent via OpenClaw |
| answered_at | timestamptz | when scout replied |

---

### `internal_notes`
Free-form partner notes on a deal.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| deal_id | uuid | FK → deals |
| author_name | text | partner name |
| note | text | |
| visibility | text | internal / shared |

---

## Relationships Summary

```
scouts ──< deals (source_scout_id)
deals ──< founders
deals ──< deal_messages ──> scouts
deals ──< deal_files ──> scouts
deals ──< missing_info_tasks ──> scouts
deals ──< ai_outputs
deals ──< partner_questions ──> scouts
deals ──< internal_notes
```
