-- Demo Seed Data for Quanta Scout OS
-- Loads the FlowOps demo scenario and supporting data

-- ─── Scouts ──────────────────────────────────────────────────────────────────
insert into scouts (id, full_name, email, openclaw_channel, openclaw_user_id, preferred_channel, status, focus_areas, last_active_at, responsiveness_score)
values
  ('11111111-1111-1111-1111-111111111111', 'Amit Sharma', 'amit@example.com', 'telegram', 'tg_amit_001', 'telegram', 'active', '{"AI", "Developer Tools", "Logistics"}', now() - interval '2 days', 0.85),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'sarah@example.com', 'telegram', 'tg_sarah_002', 'telegram', 'active', '{"Consumer", "Fintech", "EdTech"}', now() - interval '6 days', 0.70),
  ('33333333-3333-3333-3333-333333333333', 'Jordan Lee', 'jordan@example.com', 'slack', 'sl_jordan_003', 'slack', 'active', '{"Healthcare", "AI", "B2B SaaS"}', now() - interval '1 day', 0.90);

-- ─── Deals ───────────────────────────────────────────────────────────────────
insert into deals (id, startup_name, one_line_description, category, stage, status, source_scout_id, scout_conviction, source_context, ai_confidence, priority)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FlowOps', 'AI agents for logistics dispatch automation', 'AI/ML', 'pre-seed', 'needs_info', '11111111-1111-1111-1111-111111111111', 'high', 'Met at Purdue hackathon', 0.72, 'high'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CampusPay', 'Payments platform for campus clubs and student organizations', 'Fintech', 'pre-seed', 'under_review', '22222222-2222-2222-2222-222222222222', 'medium', 'Scout''s university network', 0.61, 'normal'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MedSync AI', 'AI-powered patient scheduling and care coordination', 'Healthcare AI', 'seed', 'monitor', '33333333-3333-3333-3333-333333333333', 'medium', 'Referred by a mutual contact', 0.80, 'normal');

-- ─── Founders ────────────────────────────────────────────────────────────────
insert into founders (deal_id, full_name, linkedin_url, background_summary)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rohan Mehta', null, 'Technical founder. Scout described as fast-moving with domain knowledge in logistics. No formal background confirmed yet.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Priya Nair', 'https://linkedin.com/in/priyanair', 'Former product manager at Stripe. Building payments for underserved campus organizations.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. James Wu', 'https://linkedin.com/in/jameswumd', 'Physician-turned-founder. 10 years clinical experience. Technical co-founder from Stanford CS.');

-- ─── Deal Messages (FlowOps thread) ──────────────────────────────────────────
insert into deal_messages (deal_id, scout_id, sender_type, channel, message_type, body, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text', 'Met Rohan at Purdue hackathon. He''s building FlowOps, AI agents for logistics dispatch. No deck yet but he mentioned 3 pilot conversations.', now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text', 'Got it. What made FlowOps stand out to you?', now() - interval '3 days' + interval '1 minute'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text', 'Rohan seemed very technical and fast-moving. He had already spoken to 3 logistics operators.', now() - interval '3 days' + interval '5 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text', 'Helpful. Do you know when you can get the deck or founder intro?', now() - interval '3 days' + interval '6 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scout', 'telegram', 'text', 'I can get the deck by May 22.', now() - interval '3 days' + interval '10 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ai', 'telegram', 'text', 'Perfect. I''ll check back after May 22 if it''s still missing.', now() - interval '3 days' + interval '11 minutes');

-- ─── Missing Info Tasks ───────────────────────────────────────────────────────
insert into missing_info_tasks (deal_id, scout_id, info_needed, expected_date, followup_date, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'pitch deck', '2026-05-22', '2026-05-23', 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'pilot customer details', null, null, 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'founder intro', null, null, 'pending'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'user count / traction numbers', null, null, 'pending');

-- ─── AI Outputs (signals + brief for FlowOps) ─────────────────────────────────
insert into ai_outputs (deal_id, output_type, model_name, output_json)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'signal_summary', 'gpt-4o', '{
    "founder_signal": {"level": "strong", "evidence": "Scout described founder as technical and fast-moving with 3 pilot conversations already."},
    "market_signal": {"level": "unclear", "evidence": "Logistics dispatch mentioned but market size and dynamics not confirmed."},
    "traction_signal": {"level": "early", "evidence": "3 pilot conversations mentioned but no signed customers or revenue."},
    "scout_conviction": {"level": "high", "evidence": "Scout proactively submitted and highlighted founder quality unprompted."},
    "risk_flags": ["No deck yet", "No customer names confirmed", "Founder background not verified", "No product demo seen"]
  }'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal_brief', 'gpt-4o', '{
    "brief_title": "FlowOps: AI agents for logistics dispatch",
    "what_it_does": "FlowOps appears to automate dispatch workflows for small to mid-size logistics teams using AI agents.",
    "why_it_may_matter": "Scout described the founder as unusually technical and fast-moving, with early traction signals in a large and fragmented market.",
    "known_facts": ["Met at Purdue hackathon", "Founder name: Rohan", "3 pilot conversations mentioned (no signed customers)"],
    "open_questions": ["Who are the pilot customers?", "Does Rohan have logistics domain experience?", "Is there a working product demo?", "What is the go-to-market strategy?"],
    "suggested_next_action": "Ask scout for founder intro and pilot customer details before requesting deck."
  }');
