-- ============================================================
-- Quanta Scout OS — Demo Seed v2
-- 6 detailed startups across 5 categories, all stages of the pipeline
-- Run this AFTER running 001_initial_schema.sql
-- ============================================================

-- ─── CLEAR existing demo data (safe — only touches seeded UUIDs) ─────────────
delete from ai_outputs          where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from partner_questions   where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from internal_notes      where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from missing_info_tasks  where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from deal_messages       where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from deal_answers        where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from scout_notes         where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from founders            where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from deal_files          where deal_id in (select id from deals where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%');
delete from deals               where id::text like 'aaaaaaaa%' or id::text like 'bbbbbbbb%' or id::text like 'cccccccc%' or id::text like 'dddddddd%' or id::text like 'eeeeeeee%' or id::text like 'ffffffff%';

-- ─── SCOUTS (upsert to preserve any real accounts) ────────────────────────────
insert into scouts (id, full_name, email, openclaw_channel, openclaw_user_id, preferred_channel, status, invite_status, focus_areas, last_active_at, last_checkin_at, last_email_sent_at, last_email_responded_at, responsiveness_score)
values
  ('11111111-1111-1111-1111-111111111111', 'Amit Sharma',  'amit@example.com',   'telegram', 'tg_amit_001',   'telegram', 'active', 'active', '{"AI","Developer Tools","Logistics","Deep Tech"}', now() - interval '1 day',   now() - interval '5 days', now() - interval '5 days', now() - interval '4 days', 0.88),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Chen',   'sarah@example.com',  'telegram', 'tg_sarah_002',  'telegram', 'active', 'active', '{"Fintech","Consumer","Healthcare","EdTech"}',    now() - interval '3 days',  now() - interval '7 days', now() - interval '7 days', now() - interval '5 days', 0.74),
  ('33333333-3333-3333-3333-333333333333', 'Jordan Lee',   'jordan@example.com', 'slack',    'sl_jordan_003', 'slack',    'active', 'active', '{"Climate","Healthcare AI","B2B SaaS","Deep Tech"}',now() - interval '12 hours',now() - interval '7 days', now() - interval '7 days', now() - interval '12 hours',0.92)
on conflict (id) do update set
  full_name              = excluded.full_name,
  focus_areas            = excluded.focus_areas,
  last_active_at         = excluded.last_active_at,
  last_checkin_at        = excluded.last_checkin_at,
  last_email_sent_at     = excluded.last_email_sent_at,
  last_email_responded_at= excluded.last_email_responded_at,
  responsiveness_score   = excluded.responsiveness_score;

-- ─── DEALS ───────────────────────────────────────────────────────────────────
insert into deals (id, startup_name, one_line_description, category, stage, status, review_label, source_scout_id, scout_conviction, source_context, ai_confidence, priority, submission_mode, created_at, updated_at)
values

  -- 1. NeuralMesh — AI Infrastructure — Under Review — High Priority
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'NeuralMesh',
   'Distributed inference infrastructure that cuts LLM serving costs by 70%',
   'AI Infrastructure', 'Pre-seed', 'under_review', 'strong_candidate',
   '11111111-1111-1111-1111-111111111111', 'high',
   'YC Demo Day after-party',
   0.91, 'high', 'voice',
   now() - interval '8 days', now() - interval '1 day'),

  -- 2. PayHaven — Fintech — Needs Info — Normal Priority
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'PayHaven',
   'Cross-border payment rails for emerging market marketplaces at 0.8% fees',
   'Fintech', 'Pre-seed', 'needs_info', 'worth_exploring',
   '22222222-2222-2222-2222-222222222222', 'medium',
   'Fintech Forward conference, Mumbai',
   0.78, 'normal', 'manual',
   now() - interval '14 days', now() - interval '3 days'),

  -- 3. CarbonLoop — Climate — Intro Requested — High Priority
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'CarbonLoop',
   'Industrial carbon capture at $80/ton using proprietary sorbent material',
   'Climate Tech', 'Pre-seed', 'intro_requested', 'strong_candidate',
   '33333333-3333-3333-3333-333333333333', 'high',
   'MIT Climate Hackathon',
   0.88, 'high', 'document',
   now() - interval '18 days', now() - interval '2 hours'),

  -- 4. BuildRight AI — Construction AI — Under Review — Normal Priority
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'BuildRight AI',
   'AI project management for construction that predicts delays before they happen',
   'AI / Construction', 'Seed', 'under_review', 'worth_exploring',
   '11111111-1111-1111-1111-111111111111', 'medium',
   'Construction technology meetup, Chicago',
   0.82, 'normal', 'manual',
   now() - interval '21 days', now() - interval '4 days'),

  -- 5. HealthThread — Healthcare AI — Needs Info — Normal Priority
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'HealthThread',
   'Real-time clinical decision support for emergency departments to reduce diagnostic errors',
   'Healthcare AI', 'Pre-seed', 'needs_info', 'worth_exploring',
   '22222222-2222-2222-2222-222222222222', 'medium',
   'Healthcare Innovation Summit, Bangalore',
   0.74, 'normal', 'voice',
   now() - interval '11 days', now() - interval '2 days'),

  -- 6. DevPulse — Developer Tools — Monitor — Normal Priority
  ('ffffffff-ffff-ffff-ffff-ffffffffffff',
   'DevPulse',
   'ML-powered code quality regression detection integrated directly into the PR review flow',
   'Developer Tools', 'Pre-seed', 'monitor', 'strong_candidate',
   '33333333-3333-3333-3333-333333333333', 'high',
   'GitHub Satellite conference, San Francisco',
   0.86, 'normal', 'manual',
   now() - interval '25 days', now() - interval '6 days');

-- ─── FOUNDERS ────────────────────────────────────────────────────────────────
insert into founders (deal_id, full_name, email, linkedin_url, background_summary)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Aditya Nair',        'aditya@neuralmesh.ai',  'https://linkedin.com/in/adityanair',    'Ex-DeepMind research engineer, 5 years. Published 3 papers on efficient transformer inference. MIT CS PhD dropout. Built distributed training infra for Gemini.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Meera Krishnaswamy', 'meera@payhaven.io',     'https://linkedin.com/in/meerak',         'Ex-Stripe engineer, 4 years. Led Stripe Payment Links from 0 to $2B GMV. Deep expertise in payment routing and compliance across APAC markets.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. Priya Banerjee', 'priya@carbonloop.io',   'https://linkedin.com/in/priyanerjee',    'PhD Materials Science, MIT. 2 patents on solid sorbent carbon capture. Former Carbon180 policy fellow. 8 years in materials research.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Vikram Patel',       'vikram@buildright.ai',  'https://linkedin.com/in/vikrampatel',    'Ex-general contractor, 8 years on commercial sites. CS degree from UIUC. Founded and sold a small construction software company in 2021.'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dr. Ananya Sharma',  'ananya@healththread.ai','https://linkedin.com/in/ananyasharma',   'ER physician, 10 years at AIIMS Delhi. Sees 40+ patients per shift. MD + MBA from ISB. Founded HealthThread after a near-miss diagnostic error in her own ED.'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Karan Mehta',        'karan@healththread.ai', 'https://linkedin.com/in/karanmehta',    'Ex-Google Health engineer, 6 years. Built ML infrastructure for Google''s medical imaging tools. Masters in Computer Science, IIT Bombay.'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Alex Chen',          'alex@devpulse.dev',     'https://linkedin.com/in/alexchen',      'Ex-GitHub engineer, 6 years. Architected and shipped GitHub Actions from beta to 50M+ daily runs. Deep expertise in CI/CD pipelines and static analysis.');

-- ─── DEAL MESSAGES (conversation threads) ────────────────────────────────────

-- NeuralMesh thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Met Aditya at the YC demo day after-party last week. He''s ex-DeepMind building inference infra for LLMs. Claims to cut GPU serving costs by 70% through smart routing across heterogeneous clusters. Two design partners already.', now() - interval '8 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text',
   'Strong background for this space. What specifically made Aditya stand out to you beyond the DeepMind pedigree?', now() - interval '8 days' + interval '2 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'He did a live demo right there at the party — showed my GPT-4-equivalent call going through their system. 3x faster response, and he showed me the AWS bill comparison. The numbers were real. He''s not just pitching — he''s built it.', now() - interval '8 days' + interval '15 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text',
   'Live demo with real cost data is a very strong signal. Do you know if the design partners are paying or still pre-revenue?', now() - interval '8 days' + interval '16 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Not paying yet — design partner agreements, so free in exchange for feedback. But he mentioned Cohere is one of them. The other is a stealth Series B AI lab he couldn''t name.', now() - interval '8 days' + interval '25 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text',
   'Cohere is credible validation. Can you get a technical deep-dive or founder intro arranged for the Quanta team?', now() - interval '8 days' + interval '26 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Yes — he was very open to it. Gave me his email directly. I''ll set up a call by end of this week.', now() - interval '8 days' + interval '30 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text',
   'Perfect. I''ll follow up next week if we haven''t heard. One more thing — do you know if there''s a deck or technical whitepaper?', now() - interval '8 days' + interval '31 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Yes, he has a 12-slide deck and benchmark report. I''ll get them by Thursday.', now() - interval '7 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'quanta', 'telegram', 'text',
   'Amit — quick follow-up on NeuralMesh. Can you ask Aditya whether the 70% cost reduction holds across different model sizes, or if it''s specific to a particular range?', now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Asked him. He said it holds for models above 7B parameters — that''s where routing across GPU clusters makes a difference. Sub-7B the gains are smaller (~30%).', now() - interval '2 days');

-- PayHaven thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Met Meera at Fintech Forward in Mumbai yesterday. She''s ex-Stripe, built Payment Links there, and now building cross-border rails for marketplaces in India and Southeast Asia. Claims 0.8% fees vs Wise''s 3-5%.', now() - interval '14 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'ai', 'web', 'text',
   'Strong Stripe pedigree for this problem. What makes her approach structurally different from Wise or PayPal?', now() - interval '14 days' + interval '1 minute'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Local bank partnerships. She has direct access to NEFT and UPI rails in India, and PromptPay in Thailand. That''s the moat — she''s not routing through Visa/Mastercard so she avoids the interchange fees entirely.', now() - interval '14 days' + interval '20 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'ai', 'web', 'text',
   'That''s a real structural advantage. Do you know the current GMV or revenue numbers?', now() - interval '14 days' + interval '21 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   '$50K GMV per month across 2 marketplace pilots. Still small but it''s only been live for 3 months.', now() - interval '14 days' + interval '35 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'ai', 'web', 'text',
   'Good early signal. What''s the regulatory picture — does she have compliance sorted for all corridors?', now() - interval '14 days' + interval '36 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'She''s working with a fintech-specialized lawyer in Mumbai. She said the RBI payment aggregator license application is filed — should take 2-3 months.', now() - interval '14 days' + interval '50 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'ai', 'web', 'text',
   'Thanks, that''s important context. Do you think you can get us connected to Meera?', now() - interval '14 days' + interval '51 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Yes, she''s expecting Quanta''s reach-out. Will send her contact details.', now() - interval '13 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'quanta', 'web', 'text',
   'Sarah — quick question on PayHaven. Can you find out if the 2 marketplace pilots are exclusive agreements or if Meera is actively selling to other marketplaces?', now() - interval '5 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Not exclusive — she''s actively pitching other marketplaces in the Meesho / Zepto ecosystem. She has 3 more in the pipeline.', now() - interval '4 days');

-- CarbonLoop thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Found Priya at the MIT Climate hackathon last weekend. PhD materials science, 2 patents, built a carbon capture sorbent she claims works at $80/ton vs the $400/ton industry benchmark. Industrial focus — cement plants first.', now() - interval '18 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'ai', 'slack', 'text',
   'That''s a significant cost gap if it holds up. What was the most compelling thing about her in person?', now() - interval '18 days' + interval '3 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'She brought actual samples of the sorbent material to the hackathon. Not slides — the physical material. She explained the chemistry in plain English without dumbing it down. This is someone who''s done 8 years of lab work and knows exactly what she''s built.', now() - interval '18 days' + interval '15 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'ai', 'slack', 'text',
   'Physical proof of material at a hackathon — that''s a strong conviction signal. Does she have any customer traction or just the material?', now() - interval '18 days' + interval '16 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'LOI from a cement plant in Gujarat. And a $500K NSF grant she just got awarded. Pilot scheduled for Q3 2026. This is moving fast.', now() - interval '18 days' + interval '30 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'ai', 'slack', 'text',
   'LOI plus NSF grant is excellent early validation — both independently credible signals. Can we get a founder intro?', now() - interval '18 days' + interval '31 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'She''s expecting Quanta''s call. Her email is priya@carbonloop.io — she said any time this week works.', now() - interval '18 days' + interval '40 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'ai', 'slack', 'text',
   'Passing this to the Quanta team now. Anything else you want them to know before the call?', now() - interval '18 days' + interval '41 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Ask her about the IP situation — the 2 patents are in her name not a university. That''s important. And she mentioned she has a co-founder lined up but hasn''t announced yet.', now() - interval '18 days' + interval '55 minutes'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'quanta', 'slack', 'text',
   'Jordan — intro call with Priya went very well. Quick follow-up: do you know if the Gujarat pilot is paid or a free proof-of-concept?', now() - interval '4 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Paid — small amount, $15K for the pilot installation, with a $200K contract if the pilot hits targets. She mentioned the cement plant is already budgeting for it.', now() - interval '3 days');

-- BuildRight AI thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Met Vikram at a construction tech meetup in Chicago. Ex-contractor who taught himself to code and built an AI project management tool. 5 paying customers, $8K MRR, 20% month-on-month growth. Predicts delays before they happen using IoT + weather + supplier data.', now() - interval '21 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', null, 'ai', 'telegram', 'text',
   'Good combination of domain expertise and technical execution. What was his story before starting BuildRight?', now() - interval '21 days' + interval '2 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Ran a general contracting company for 8 years, mostly commercial projects in the midwest. Sold a small software tool he built internally for his own projects in 2021 — said it went for about $200K. That''s when he decided to go all-in on software.', now() - interval '21 days' + interval '20 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', null, 'ai', 'telegram', 'text',
   'Relevant domain experience with some prior software exit — interesting combination. Do the 5 paying customers have any churn risk, or are they sticking?', now() - interval '21 days' + interval '21 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'He said zero churn so far — all 5 renewed after the first 3 months. But I''d want to see that confirmed in writing, not just his word.', now() - interval '21 days' + interval '35 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', null, 'ai', 'telegram', 'text',
   'Fair flag. Can you get a deck or any documentation on the product performance data?', now() - interval '21 days' + interval '36 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'He has a deck and a case study from one customer showing a 23% reduction in unplanned delays. I''ll get them sent over.', now() - interval '20 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', null, 'quanta', 'telegram', 'text',
   'Amit — the deck looks solid. One question: do you know if the 5 customers are all in the same geography or spread across the US?', now() - interval '7 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text',
   'Mostly midwest — 3 in Illinois, 1 in Indiana, 1 in Ohio. He hasn''t expanded beyond his own network yet which is actually good — very organic.', now() - interval '6 days');

-- HealthThread thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Met Dr. Ananya Sharma at the Healthcare Innovation Summit in Bangalore. She''s an ER physician of 10 years who built an AI decision support tool for emergency departments after a near-miss diagnostic error in her own ED. Her co-founder is ex-Google Health.', now() - interval '11 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'ai', 'web', 'text',
   'A physician-founder motivated by a real clinical incident is a strong founding story. What does the product actually do during an ED visit?', now() - interval '11 days' + interval '2 minutes'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'It surfaces relevant case histories and drug interactions in real time as the physician types notes. Integrates with the hospital''s existing EMR — no new system to learn. She showed me a live walkthrough on an iPad.', now() - interval '11 days' + interval '25 minutes'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'ai', 'web', 'text',
   'EMR integration without workflow disruption is the right product instinct for hospital settings. Is there a pilot running?', now() - interval '11 days' + interval '26 minutes'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Yes — 6 months into a pilot at Fortis Mumbai. 200 patients processed so far. But they don''t have outcome data yet — she said they need 12 months of data for statistical significance.', now() - interval '11 days' + interval '40 minutes'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'ai', 'web', 'text',
   'Important flag — no outcome data yet. What''s the HIPAA or equivalent compliance situation for the India deployment?', now() - interval '11 days' + interval '41 minutes'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'She''s operating under India''s DPDP Act framework and said the hospital''s legal team approved. She hasn''t done a formal third-party security audit yet — that''s on the roadmap for next quarter.', now() - interval '10 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'ai', 'web', 'text',
   'Good to flag. Can you get a founder intro for the Quanta team and also ask when the outcome data timeline is?', now() - interval '10 days' + interval '1 minute'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Outcome data by end of 2026 she said. And yes I''ll connect them — Ananya is very responsive.', now() - interval '9 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'quanta', 'web', 'text',
   'Sarah — follow-up question: what''s the co-founder Karan Mehta''s specific role? Is he CEO or CTO, and how much of his time is this?', now() - interval '3 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'scout', 'web', 'text',
   'Ananya is CEO, Karan is CTO. Both full-time since February 2026. Karan left Google for this — that''s a strong commitment signal.', now() - interval '2 days');

-- DevPulse thread
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at) values
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Alex Chen at GitHub Satellite last week — he built GitHub Actions (yes, that GitHub Actions) and now he''s doing ML-powered code quality regression detection. 120 teams on the waitlist, 12 design partners, already 3 paying at about $700/month each.', now() - interval '25 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', null, 'ai', 'slack', 'text',
   'GitHub Actions is a very credible product credential. What''s the core insight behind DevPulse — why does this work better than existing linters?', now() - interval '25 days' + interval '2 minutes'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Traditional linters flag syntax problems. DevPulse is trained on 50 million open-source repos to detect patterns that historically preceded production incidents — things like "this PR pattern looks like the kind of change that caused outages in 200 similar codebases." It''s pattern recognition, not rule-following.', now() - interval '25 days' + interval '20 minutes'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', null, 'ai', 'slack', 'text',
   'That''s a genuinely differentiated insight. How does the pricing model work?', now() - interval '25 days' + interval '21 minutes'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Per-seat SaaS for now — $15/developer/month. Design partners are using it free. He''s thinking about moving to a usage-based model based on PRs analyzed.', now() - interval '25 days' + interval '35 minutes'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', null, 'ai', 'slack', 'text',
   'Good problem to have — pricing iteration usually means product is working. Any risk of GitHub building this natively?', now() - interval '25 days' + interval '36 minutes'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'He addressed this directly — he was there when GitHub internally discussed it and said the ML training complexity is too high for them to prioritize given the GitHub Copilot roadmap. Plus he has a non-compete window from his departure agreement.', now() - interval '24 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', null, 'ai', 'slack', 'text',
   'Interesting insider perspective. Can we get a deck and a founder intro?', now() - interval '24 days' + interval '1 minute'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'He''s more private than most founders — cautious about sharing too widely before the product is ready. I''ll ask. He might want to do a call before sharing materials.', now() - interval '23 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', null, 'quanta', 'slack', 'text',
   'Jordan — we''re interested in a call with Alex. Can you facilitate? Also — what''s his timeline for coming out of stealth?', now() - interval '8 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'scout', 'slack', 'text',
   'Q3 2026 public launch is the plan. He said Quanta can do a call — I''ll set it up. He specifically asked that we not post about it on social yet.', now() - interval '7 days');

-- ─── MISSING INFO TASKS ───────────────────────────────────────────────────────
insert into missing_info_tasks (deal_id, scout_id, info_needed, expected_date, followup_date, status, reminder_count)
values
  -- NeuralMesh
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Benchmark report with cost reduction data', '2026-05-24', '2026-05-25', 'pending', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Design partner names or confirmation', null, null, 'pending', 0),

  -- PayHaven
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'RBI payment aggregator license status', '2026-06-15', '2026-06-16', 'pending', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'Cap table and current investors', null, null, 'pending', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'GMV breakdown by corridor (India vs SEA)', null, null, 'pending', 0),

  -- CarbonLoop — all tasks completed (strong deal, intro done)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'IP assignment documentation (personal vs university)', '2026-05-21', '2026-05-22', 'completed', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Full co-founder identity and background', '2026-05-25', '2026-05-26', 'pending', 0),

  -- BuildRight AI
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'Signed customer contracts or churn data', null, null, 'pending', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'NPS scores or customer interviews', null, null, 'pending', 0),

  -- HealthThread
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222',
   'Clinical outcome data from Fortis pilot', '2026-12-01', null, 'pending', 0),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222',
   'Third-party security audit completion', '2026-07-01', '2026-07-02', 'pending', 0),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222',
   'Hospital expansion roadmap (next 2 sites)', null, null, 'pending', 0),

  -- DevPulse
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333',
   'Pitch deck (Alex is cautious about sharing)', '2026-06-01', '2026-06-02', 'pending', 0),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333',
   'Non-compete agreement terms and expiry', null, null, 'pending', 0);

-- ─── INTERNAL NOTES ───────────────────────────────────────────────────────────
insert into internal_notes (deal_id, author_name, note, visibility)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mateo', 'Ran NeuralMesh through our AI infrastructure advisor (ex-Nvidia). He said the heterogeneous GPU routing concept is technically sound and hasn''t been cracked well yet. Worth a technical call.', 'internal'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Riya', 'Checked Aditya''s DeepMind publications — 3 papers on efficient inference, all first-authored. This is the real deal on technical depth.', 'internal'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mateo', 'Meera''s Stripe tenure lines up — she was on the Payment Links team per LinkedIn. We should ask specifically about the NPCI relationship for UPI access — that''s the key regulatory moat.', 'internal'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Riya', 'Priya''s 2 patents are filed with the USPTO. Checked on Google Patents. Both filed personally, not through MIT or Carbon180. Clean IP situation.', 'internal'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mateo', 'Called a contact at a cement company. Confirmed that $80/ton is a genuinely disruptive number if it holds at scale. The industry has been waiting for this.', 'internal'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Riya', 'The $200K exit from his prior software tool is verifiable — it was acquired by a Chicago-based construction SaaS company. Small but real. Gives him founder credibility.', 'internal'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Mateo', 'Alex''s GitHub Actions work is well-documented in engineering blog posts and conference talks. His claim about the internal GitHub roadmap discussion is plausible given his seniority there.', 'internal'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Riya', 'The 50M repo training dataset claim is large but believable — GitHub has ~200M public repos and they can access them. Need to ask about the ML model architecture specifically.', 'internal');

-- ─── PARTNER QUESTIONS ────────────────────────────────────────────────────────
insert into partner_questions (deal_id, scout_id, question_text, ai_rewritten_message, status, asked_at, answered_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Ask whether the 70% cost reduction holds for all model sizes or if it''s specific to large models',
   'Quick follow-up on NeuralMesh, Amit — do you know if the cost reduction Aditya mentioned works across all model sizes, or is it specific to larger models (7B+)?',
   'answered', now() - interval '3 days', now() - interval '2 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'Ask if the 2 marketplace pilots are exclusive agreements or if Meera is actively pitching others',
   'One quick question on PayHaven, Sarah — are Meera''s 2 current pilots on exclusive agreements, or is she actively selling to other marketplaces at the same time?',
   'answered', now() - interval '5 days', now() - interval '4 days'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Ask if the Gujarat cement plant pilot is paid or free proof-of-concept',
   'Jordan — just to confirm on CarbonLoop: is the Gujarat pilot a paid engagement or a free proof-of-concept?',
   'answered', now() - interval '4 days', now() - interval '3 days'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222',
   'What is Karan Mehta''s specific role and time commitment',
   'Sarah — quick one on HealthThread. What''s Karan''s specific role and is he full-time on this?',
   'answered', now() - interval '3 days', now() - interval '2 days'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333',
   'Ask about Alex''s public launch timeline and willingness to share deck',
   'Jordan — on DevPulse: when is Alex planning to come out of stealth, and is he open to sharing the deck with Quanta under NDA?',
   'answered', now() - interval '8 days', now() - interval '7 days');

-- ─── AI OUTPUTS — SIGNAL SUMMARIES ───────────────────────────────────────────
insert into ai_outputs (deal_id, output_type, model_name, output_json, created_at)
values

  -- NeuralMesh signals
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "Ex-DeepMind research engineer with 3 published papers on efficient transformer inference. Deep technical credibility in exactly the problem NeuralMesh is solving."},
    "market_signal": {"level": "strong", "evidence": "GPU serving costs are the #1 operational expense for LLM startups. The pain is validated by multiple well-funded companies actively seeking solutions."},
    "traction_signal": {"level": "early", "evidence": "Two design partners including Cohere — pre-revenue but credible. Live demo with real cost data shown to scout."},
    "scout_conviction": {"level": "high", "evidence": "Scout witnessed a live demo with real AWS billing data. Proactively submitted with detailed technical context."},
    "risk_flags": ["Design partners not yet paying", "70% cost reduction claim unverified at scale above demo", "Competitive risk from hyperscalers (AWS Inferentia, Google TPU)"]
  }', now() - interval '7 days'),

  -- PayHaven signals
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "Ex-Stripe engineer who built and scaled Payment Links to $2B GMV. Deep payments infrastructure expertise directly relevant to the problem."},
    "market_signal": {"level": "strong", "evidence": "Cross-border payments for emerging markets is a $1T+ market. Fee compression from 3-5% to sub-1% is a genuine structural advantage if bank partnerships hold."},
    "traction_signal": {"level": "medium", "evidence": "$50K GMV/month across 2 pilots after 3 months. Small but real revenue proxy with growing pipeline."},
    "scout_conviction": {"level": "medium", "evidence": "Scout sees the structural moat clearly but cautious about regulatory timeline uncertainty."},
    "risk_flags": ["RBI license pending — 2-3 month timeline adds uncertainty", "Bank partnership agreements not yet reviewed", "Cap table unknown", "Small GMV for a payments company"]
  }', now() - interval '12 days'),

  -- CarbonLoop signals
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "PhD Materials Science from MIT with 2 personal patents. 8 years of lab research. Former Carbon180 policy fellow — rare combination of deep technical and policy expertise."},
    "market_signal": {"level": "strong", "evidence": "Industrial carbon capture is one of the most capital-intensive problems in climate. $80/ton vs $400/ton is a 5x cost advantage that could unlock the market."},
    "traction_signal": {"level": "medium", "evidence": "LOI from Gujarat cement plant ($15K pilot, $200K contract if successful) plus $500K NSF grant. Q3 2026 pilot scheduled."},
    "scout_conviction": {"level": "high", "evidence": "Scout brought physical material samples to hackathon — rare conviction signal. Scout emphasized depth of technical knowledge demonstrated in person."},
    "risk_flags": ["Unit economics not yet proven at pilot scale", "Co-founder identity not yet confirmed", "Long sales cycles typical in industrial markets", "Regulatory environment for carbon markets is uncertain"]
  }', now() - interval '16 days'),

  -- BuildRight AI signals
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "medium", "evidence": "Strong domain expertise from 8 years as a contractor. CS degree and prior software exit ($200K acquisition). Domain knowledge is authentic but technical depth in ML is uncertain."},
    "market_signal": {"level": "strong", "evidence": "Construction is a $13T global industry with a 91% project delay rate. Existing PM tools are reactive; predictive tooling is a genuine gap."},
    "traction_signal": {"level": "strong", "evidence": "$8K MRR with 5 paying customers, 20% MoM growth, zero churn. All organic from founder''s own network — no sales team yet."},
    "scout_conviction": {"level": "medium", "evidence": "Scout is interested but flagged that zero-churn claim needs documentation. Appropriately skeptical."},
    "risk_flags": ["Churn data only from founder''s word — needs verification", "ML prediction accuracy not independently validated", "Geographic concentration in midwest US", "Enterprise sales motion may be capital intensive"]
  }', now() - interval '19 days'),

  -- HealthThread signals
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "Physician-founder duo — ER physician with 10 years and ex-Google Health engineer, both full-time. Founder origin story (personal near-miss diagnostic error) is authentic and compelling."},
    "market_signal": {"level": "strong", "evidence": "12M diagnostic errors annually in the US alone. ED physicians make decisions under extreme time pressure with incomplete information — well-documented, validated problem."},
    "traction_signal": {"level": "early", "evidence": "6-month pilot at Fortis Mumbai with 200 patients. No outcome data yet — 12 months needed for statistical significance."},
    "scout_conviction": {"level": "medium", "evidence": "Scout was impressed by live walkthrough but appropriately flagged the outcome data gap and security audit gap."},
    "risk_flags": ["No clinical outcome data for 6+ more months", "HIPAA/DPDP compliance not yet third-party audited", "Hospital sales cycles are extremely long (12-24 months)", "EMR integration complexity varies widely by hospital system"]
  }', now() - interval '9 days'),

  -- DevPulse signals
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "Built GitHub Actions from 0 to 50M+ daily runs — one of the most used developer tools globally. Unimpeachable credibility in the developer tooling space."},
    "market_signal": {"level": "strong", "evidence": "Code quality tooling is a $2B+ market. ML-powered regression prediction (vs rule-based linting) is a genuine technological leap that the market is ready for."},
    "traction_signal": {"level": "early", "evidence": "120-team waitlist, 12 design partners, $2K MRR from 3 paying teams. Early but signals strong demand. Stealth mode limits growth."},
    "scout_conviction": {"level": "high", "evidence": "Scout immediately understood the GitHub Actions credential as a strong signal. Found founder''s caution about sharing materials to be a confidence indicator, not a red flag."},
    "risk_flags": ["Stealth mode limits market discovery until Q3 2026", "Non-compete terms and timeline unclear", "GitHub could build competing feature natively", "Enterprise pricing model not yet defined"]
  }', now() - interval '23 days');

-- ─── AI OUTPUTS — INTERNAL BRIEFS ────────────────────────────────────────────
insert into ai_outputs (deal_id, output_type, model_name, output_json, created_at)
values

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal_brief', 'gpt-4o', '{
    "brief_title": "NeuralMesh: Distributed LLM inference infra at 70% lower cost",
    "what_it_does": "NeuralMesh provides a middleware layer that routes LLM inference requests across heterogeneous GPU clusters, intelligently selecting the cheapest available compute at any given moment. The result is a 70% cost reduction on GPU serving costs for models above 7B parameters.",
    "why_it_may_matter": "GPU inference costs are the primary operational constraint for LLM-based startups. If NeuralMesh''s benchmarks hold at scale, they sit on a structural cost advantage that becomes more valuable as LLM adoption grows. The DeepMind pedigree gives the technical claims high credibility.",
    "known_facts": ["Founder Aditya Nair: Ex-DeepMind, 5 years, 3 published papers on efficient inference", "Design partner: Cohere confirmed (one other stealth lab)", "70% cost reduction for models >7B parameters, ~30% for smaller models", "Live demo conducted for scout with real AWS billing data", "Benchmark report exists — scout is retrieving it"],
    "open_questions": ["What are the design partner contract terms? Revenue timeline?", "How defensible is the routing logic vs hyperscaler-native solutions?", "What is the cap table and current funding status?", "Does the cost reduction compound as model sizes grow?"],
    "suggested_next_action": "Schedule technical deep-dive call with Aditya. Review benchmark report when received. Validate design partner claim with a warm reference if possible."
  }', now() - interval '6 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'internal_brief', 'gpt-4o', '{
    "brief_title": "PayHaven: Cross-border payment rails for emerging markets at 0.8% fees",
    "what_it_does": "PayHaven offers embedded cross-border payment infrastructure for marketplaces operating across India and Southeast Asia. By partnering directly with local banks for NEFT/UPI/PromptPay access, it bypasses Visa/Mastercard interchange and achieves fees of ~0.8% vs the 3-5% charged by Wise and PayPal.",
    "why_it_may_matter": "The India-SEA corridor is one of the highest-growth payment markets globally. A structural 4x fee advantage — if the bank partnerships hold — is a durable moat that''s hard to replicate quickly. Meera''s Stripe background means she understands both the technical and compliance complexity.",
    "known_facts": ["Founder: Meera Krishnaswamy, ex-Stripe Payment Links engineer, 4 years", "Local bank partnerships: NEFT/UPI (India), PromptPay (Thailand)", "$50K GMV/month across 2 marketplace pilots, 3 months live", "RBI payment aggregator license filed — 2-3 month timeline", "3 additional marketplace prospects in pipeline"],
    "open_questions": ["Are bank partnerships formalized contracts or informal relationships?", "What is the full cap table and current investors?", "What happens to the fee advantage if banks renegotiate terms?", "How does NPCI access specifically work — is it direct or via a sponsor bank?"],
    "suggested_next_action": "Get intro call with Meera this week. Specifically probe the RBI license timeline and bank partnership formalization. Request cap table before moving to due diligence."
  }', now() - interval '10 days'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'internal_brief', 'gpt-4o', '{
    "brief_title": "CarbonLoop: Industrial carbon capture at $80/ton vs $400/ton industry benchmark",
    "what_it_does": "CarbonLoop has developed a proprietary solid sorbent material that captures CO2 from industrial exhaust (cement, steel, chemical plants) at approximately $80/ton — roughly 1/5 the cost of existing direct air capture technologies. The material is manufacturable at scale and the company is focused on cement plants as the first go-to-market vertical.",
    "why_it_may_matter": "Industrial emissions represent ~30% of global CO2 output. If the $80/ton cost holds at pilot scale, CarbonLoop is potentially the most cost-effective industrial carbon capture solution available. The combination of a paid LOI, NSF grant validation, and MIT-pedigree IP is unusually strong for pre-seed climate tech.",
    "known_facts": ["Founder: Dr. Priya Banerjee, MIT PhD Materials Science, 2 personal patents (USPTO verified)", "LOI from Gujarat cement plant: $15K pilot, $200K if pilot succeeds", "$500K NSF grant awarded", "Q3 2026 pilot start date", "IP is personally owned — not assigned to MIT or Carbon180", "Pilot confirmed to be paid, not free PoC"],
    "open_questions": ["Who is the undisclosed co-founder and what is their background?", "What is the sorbent''s performance in high-humidity industrial environments?", "What is the manufacturing scale-up roadmap and cost curve?", "Are there IP challenges from similar university research programs?"],
    "suggested_next_action": "Move to term sheet conversation. Request full co-founder disclosure and IP assignment documents before close. This is our strongest climate deal in 18 months."
  }', now() - interval '1 day'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'internal_brief', 'gpt-4o', '{
    "brief_title": "BuildRight AI: Construction project management with predictive delay detection",
    "what_it_does": "BuildRight AI ingests data from construction site IoT sensors, weather APIs, and supplier systems to predict project delays and cost overruns before they occur. Unlike existing PM tools (Procore, PlanGrid) which report on current status, BuildRight predicts future problems with a 3-4 week horizon.",
    "why_it_may_matter": "Construction is the largest industry by employment globally with notoriously poor software adoption. 91% of commercial projects exceed budget or timeline. A tool that actually reduces delays rather than documenting them addresses a real, expensive problem. The $8K MRR at zero churn in 3 months is exceptional for construction software.",
    "known_facts": ["Founder: Vikram Patel, 8 years as general contractor, CS from UIUC, prior $200K software exit", "5 paying customers, $8K MRR, 20% MoM growth, zero churn to date", "All customers in midwest US (3 Illinois, 1 Indiana, 1 Ohio)", "23% reduction in unplanned delays demonstrated in one published case study", "No sales team — all growth from founder''s personal network"],
    "open_questions": ["Can zero-churn claim be verified with signed contracts or billing records?", "What is the ML model''s prediction accuracy rate independently?", "What does geographic expansion beyond the midwest look like?", "How does the product handle highly variable construction site conditions?"],
    "suggested_next_action": "Request customer references from 2 of the 5 paying customers. Have technical advisor review the prediction model architecture. Midwest concentration is a flag but also shows capital efficiency."
  }', now() - interval '17 days'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'internal_brief', 'gpt-4o', '{
    "brief_title": "HealthThread: Real-time clinical decision support for emergency departments",
    "what_it_does": "HealthThread integrates with existing hospital EMR systems to surface relevant case histories, drug interactions, and clinical guidelines in real time as an ED physician types their notes. It requires no new workflow — it augments the existing documentation process without disrupting it.",
    "why_it_may_matter": "12M diagnostic errors annually in the US alone; similar rates in India. ER physicians operate under extreme time pressure with incomplete information. A tool that surfaces the right context at the right moment addresses a genuinely life-critical gap. The physician-founder origin story (personal near-miss) is authentic and driving product decisions.",
    "known_facts": ["Founders: Dr. Ananya Sharma (ER physician, 10 years, AIIMS Delhi) + Karan Mehta (ex-Google Health engineer, IIT Bombay), both full-time since Feb 2026", "Pilot: 6 months at Fortis Mumbai, 200 patients processed", "Approved under India DPDP Act by hospital legal team", "EMR integration live — no new workflow required"],
    "open_questions": ["When is the clinical outcome data available? What metrics are being tracked?", "Third-party security audit: timeline and auditor?", "What is the expansion roadmap to hospitals 2 and 3?", "How does the product handle rare or edge-case presentations not well-represented in training data?"],
    "suggested_next_action": "Introduce to our healthcare network for a reference call with Fortis medical director. Do not invest before outcome data — but maintain warm relationship and revisit in Q4 2026."
  }', now() - interval '8 days'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'internal_brief', 'gpt-4o', '{
    "brief_title": "DevPulse: ML-powered code regression detection in the PR review flow",
    "what_it_does": "DevPulse uses a model trained on 50M+ open-source repositories to detect code change patterns that historically preceded production incidents. Unlike linters (rule-based), DevPulse flags statistically risky patterns before a PR is merged — operating at the semantic level, not the syntactic level.",
    "why_it_may_matter": "Every engineering team ships bugs that could have been caught earlier. The GitHub Actions credential is the strongest possible validator for tooling in the CI/CD pipeline. If the ML insight is defensible (pattern recognition vs rules), this could be a significant developer tools company.",
    "known_facts": ["Founder: Alex Chen, built GitHub Actions from 0 to 50M+ daily runs, 6 years at GitHub", "120 teams on waitlist, 12 design partners (free), 3 paying (~$2K MRR)", "$15/developer/month pricing (considering usage-based model)", "Q3 2026 public launch planned", "Stealth mode — non-compete from GitHub departure in effect", "Non-compete agreement: terms and expiry unknown but founder acknowledges it"],
    "open_questions": ["What are the exact terms and expiry date of the GitHub non-compete?", "How defensible is the training data advantage — can GitHub or Microsoft replicate?", "What does the enterprise pricing model look like?", "How does accuracy compare to existing tools (SonarQube, Snyk) on the same codebase?"],
    "suggested_next_action": "Get legal to review the non-compete agreement before any term sheet. Set up intro call Jordan is arranging. This is worth moving quickly on — GitHub Actions credibility is rare."
  }', now() - interval '20 days');

-- ─── DEAL FILES ───────────────────────────────────────────────────────────────
insert into deal_files (deal_id, uploaded_by_scout_id, file_name, file_type, storage_url, summary)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'NeuralMesh-Benchmark-Report.pdf', 'application/pdf', 'placeholder://neuralmesh-benchmark.pdf',
   '12-page benchmark report comparing NeuralMesh inference costs vs direct AWS EC2 GPU pricing across 5 model sizes (7B to 70B parameters). Shows 68-73% cost reduction range.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'CarbonLoop-Technical-Overview.pdf', 'application/pdf', 'placeholder://carbonloop-tech.pdf',
   'Technical overview of the sorbent material chemistry, capture efficiency at different CO2 concentrations and humidity levels, and preliminary cost model from lab-scale experiments.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'NSF-Grant-Award-Letter.pdf', 'application/pdf', 'placeholder://nsf-grant.pdf',
   'NSF SBIR Phase I award letter confirming $500K grant for CarbonLoop. Grant period: May 2026 - April 2027.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'BuildRight-Customer-Case-Study.pdf', 'application/pdf', 'placeholder://buildright-case-study.pdf',
   'Case study from Hennessy Commercial Contractors (Illinois). Shows 23% reduction in unplanned delays across 4 projects over 6 months using BuildRight AI. Includes before/after comparison.'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333',
   'DevPulse-Product-Demo-Recording.mp4', 'video/mp4', 'placeholder://devpulse-demo.mp4',
   'Screen recording of a DevPulse live demo on a React codebase. Shows 3 PR reviews with flagged patterns, accuracy comparison to ESLint output, and the team dashboard.');
