-- ============================================================
-- Production Setup SQL
-- Run this in Supabase SQL Editor after creating user accounts
-- in Supabase Authentication dashboard
-- ============================================================

-- ── Step 1: Assign team role ──────────────────────────────────────────────────
-- Replace 'team@quanta.vc' with your actual team email
insert into user_roles (user_id, role)
select id, 'quanta'
from auth.users
where email = 'team@quanta.vc'
on conflict (user_id) do nothing;

-- Verify team role was created:
-- select u.email, r.role from auth.users u join user_roles r on r.user_id = u.id;


-- ── Step 2: Link existing demo scouts to real auth accounts ───────────────────
-- Run this block for each scout you created in Supabase Auth

-- Amit Sharma (replace email if different):
-- update scouts
-- set supabase_user_id = (select id from auth.users where email = 'amit@example.com')
-- where full_name = 'Amit Sharma' and supabase_user_id is null;
--
-- insert into user_roles (user_id, role)
-- select id, 'scout' from auth.users where email = 'amit@example.com'
-- on conflict (user_id) do nothing;

-- Sarah Chen:
-- update scouts
-- set supabase_user_id = (select id from auth.users where email = 'sarah@example.com')
-- where full_name = 'Sarah Chen' and supabase_user_id is null;
--
-- insert into user_roles (user_id, role)
-- select id, 'scout' from auth.users where email = 'sarah@example.com'
-- on conflict (user_id) do nothing;


-- ── Step 3: Verify everything ─────────────────────────────────────────────────
-- Run to confirm setup:
select
  u.email,
  r.role,
  s.full_name as scout_name,
  s.invite_status
from auth.users u
left join user_roles r on r.user_id = u.id
left join scouts s on s.supabase_user_id = u.id
order by r.role, u.email;


-- ── Step 4: Clean up temp/draft deals from testing ────────────────────────────
-- Remove orphan deals created during development:
-- delete from deals where status in ('temp', 'draft') and startup_name is null;

-- Fix the FlowOps test deal if it was overwritten:
-- update deals
-- set startup_name = 'FlowOps',
--     one_line_description = 'AI agents for logistics dispatch automation',
--     category = 'AI / Logistics',
--     status = 'needs_info',
--     priority = 'high'
-- where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
