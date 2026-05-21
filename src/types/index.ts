// ─── Scout ───────────────────────────────────────────────────────────────────

export type ScoutStatus = "active" | "inactive" | "paused";
export type Channel = "telegram" | "whatsapp" | "slack" | "web" | "discord" | "signal";

export interface Scout {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  openclaw_channel: Channel | null;
  openclaw_user_id: string | null;
  preferred_channel: Channel;
  status: ScoutStatus;
  focus_areas: string[];
  last_active_at: string | null;
  last_checkin_at: string | null;
  responsiveness_score: number;
  created_at: string;
  updated_at: string;
}

// ─── Deal ────────────────────────────────────────────────────────────────────

export type DealStatus =
  | "draft"
  | "submitted"
  | "needs_info"
  | "under_review"
  | "intro_requested"
  | "monitor"
  | "archived"
  | "rejected";

export type DealPriority = "low" | "normal" | "high";
export type ScoutConviction = "low" | "medium" | "high" | "unknown";

export interface Deal {
  id: string;
  startup_name: string | null;
  one_line_description: string | null;
  category: string | null;
  stage: string | null;
  status: DealStatus;
  source_scout_id: string | null;
  scout_conviction: ScoutConviction | null;
  source_context: string | null;
  ai_confidence: number | null;
  priority: DealPriority;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  scout?: Scout;
  founders?: Founder[];
  files?: DealFile[];
  messages?: DealMessage[];
  ai_outputs?: AiOutput[];
  missing_info_tasks?: MissingInfoTask[];
  partner_questions?: PartnerQuestion[];
  internal_notes?: InternalNote[];
  signals?: SignalOutput | null;
  brief?: InternalBrief | null;
}

// ─── Founder ─────────────────────────────────────────────────────────────────

export interface Founder {
  id: string;
  deal_id: string;
  full_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  background_summary: string | null;
  created_at: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageSenderType = "scout" | "ai" | "quanta" | "system";
export type MessageType = "text" | "voice" | "file" | "image" | "link";

export interface DealMessage {
  id: string;
  deal_id: string;
  scout_id: string | null;
  sender_type: MessageSenderType;
  channel: Channel | null;
  message_type: MessageType;
  body: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

// ─── Files ───────────────────────────────────────────────────────────────────

export interface DealFile {
  id: string;
  deal_id: string;
  uploaded_by_scout_id: string | null;
  file_name: string | null;
  file_type: string | null;
  storage_url: string | null;
  extracted_text: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── Missing Info Tasks ───────────────────────────────────────────────────────

export type MissingInfoTaskStatus = "pending" | "completed" | "deferred" | "stale" | "cancelled";

export interface MissingInfoTask {
  id: string;
  deal_id: string;
  scout_id: string | null;
  info_needed: string;
  expected_date: string | null;
  followup_date: string | null;
  status: MissingInfoTaskStatus;
  last_reminded_at: string | null;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

// ─── AI Outputs ──────────────────────────────────────────────────────────────

export type AiOutputType =
  | "extraction"
  | "signal_summary"
  | "internal_brief"
  | "followup_question"
  | "duplicate_check"
  | "enrichment";

export interface AiOutput {
  id: string;
  deal_id: string;
  output_type: AiOutputType;
  model_name: string | null;
  input_snapshot: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  created_at: string;
}

// ─── Internal Notes ───────────────────────────────────────────────────────────

export interface InternalNote {
  id: string;
  deal_id: string;
  author_name: string | null;
  note: string;
  visibility: "internal" | "shared";
  created_at: string;
}

// ─── Partner Questions ────────────────────────────────────────────────────────

export type PartnerQuestionStatus = "pending" | "sent" | "answered" | "cancelled";

export interface PartnerQuestion {
  id: string;
  deal_id: string;
  scout_id: string | null;
  question_text: string;
  ai_rewritten_message: string | null;
  status: PartnerQuestionStatus;
  asked_at: string | null;
  answered_at: string | null;
  created_at: string;
}

// ─── AI Structured Outputs ────────────────────────────────────────────────────

export type ExtractionIntent =
  | "new_deal"
  | "update_existing_deal"
  | "answer_question"
  | "unclear";

export interface ExtractionOutput {
  intent: ExtractionIntent;
  startup_name: string | null;
  founder_names: string[];
  one_line_description: string | null;
  category: string | null;
  source_context: string | null;
  traction_mentions: string[];
  scout_conviction: ScoutConviction;
  why_interesting: string | null;
  missing_fields: string[];
  confidence: number;
  recommended_next_question: string | null;
}

export type SignalLevel = "strong" | "medium" | "early" | "weak" | "unclear" | "high" | "low";

export interface SignalItem {
  level: SignalLevel;
  evidence: string;
}

export interface SignalOutput {
  founder_signal: SignalItem;
  market_signal: SignalItem;
  traction_signal: SignalItem;
  scout_conviction: SignalItem;
  risk_flags: string[];
}

export interface InternalBrief {
  brief_title: string;
  what_it_does: string;
  why_it_may_matter: string;
  known_facts: string[];
  open_questions: string[];
  suggested_next_action: string;
}

export interface NextQuestionOutput {
  should_ask_question: boolean;
  question: string | null;
  reason: string;
}

export interface CommitmentOutput {
  has_commitment: boolean;
  missing_item: string | null;
  expected_date: string | null;
  followup_date: string | null;
}

export interface PartnerQuestionRewrite {
  message: string;
}

export interface DuplicateCheckOutput {
  is_duplicate: boolean;
  confidence: number;
  matched_deal_id: string | null;
  matched_startup_name: string | null;
  reason: string;
}

// ─── OpenClaw Webhook ─────────────────────────────────────────────────────────

export interface OpenClawWebhookPayload {
  channel: Channel;
  openclaw_user_id: string;
  message_type: MessageType;
  text: string | null;
  attachments: OpenClawAttachment[];
  timestamp: string;
}

export interface OpenClawAttachment {
  type: string;
  url: string;
  name: string | null;
  mime_type: string | null;
}

export interface OpenClawWebhookResponse {
  reply: string;
  agent: string;
  deal_id: string | null;
}

// ─── API Request/Response shapes ─────────────────────────────────────────────

export interface ProcessMessageRequest {
  scout_id: string;
  channel: Channel;
  message_type: MessageType;
  body: string;
  deal_id: string | null;
}

export interface ProcessMessageResponse {
  deal: Pick<Deal, "id" | "startup_name" | "one_line_description"> | null;
  ai_reply: string;
  missing_info: string[];
}

export interface AskScoutRequest {
  question: string;
  partner_name: string;
}

export interface AskScoutResponse {
  sent_message: string;
  partner_question_id: string;
}

export interface DealInboxItem {
  id: string;
  startup_name: string | null;
  summary: string | null;
  status: DealStatus;
  priority: DealPriority;
  scout: Pick<Scout, "id" | "full_name"> | null;
  signals: Pick<SignalOutput, "founder_signal" | "traction_signal"> | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}
