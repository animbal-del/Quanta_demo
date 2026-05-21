// ─── Deal Status Labels ──────────────────────────────────────────────────────
export const DEAL_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_info: "Needs Info",
  under_review: "Under Review",
  intro_requested: "Intro Requested",
  monitor: "Monitor",
  archived: "Archived",
  rejected: "Rejected",
};

export const DEAL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  needs_info: "bg-amber-100 text-amber-700",
  under_review: "bg-purple-100 text-purple-700",
  intro_requested: "bg-green-100 text-green-700",
  monitor: "bg-slate-100 text-slate-700",
  archived: "bg-gray-100 text-gray-400",
  rejected: "bg-red-100 text-red-600",
};

// ─── Signal Level Labels ─────────────────────────────────────────────────────
export const SIGNAL_LEVEL_LABELS: Record<string, string> = {
  strong: "Strong",
  medium: "Medium",
  early: "Early",
  weak: "Weak",
  unclear: "Unclear",
  high: "High",
  low: "Low",
};

export const SIGNAL_LEVEL_COLORS: Record<string, string> = {
  strong: "text-green-600",
  high: "text-green-600",
  medium: "text-amber-600",
  early: "text-blue-600",
  weak: "text-red-500",
  unclear: "text-gray-400",
  low: "text-red-500",
};

// ─── Missing Info Task Status ─────────────────────────────────────────────────
export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  deferred: "Deferred",
  stale: "Stale",
  cancelled: "Cancelled",
};

// ─── Scout Status ─────────────────────────────────────────────────────────────
export const SCOUT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  paused: "Paused",
};

// ─── Priority ─────────────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-400",
  normal: "text-gray-600",
  high: "text-red-500",
};

// ─── Channel Labels ───────────────────────────────────────────────────────────
export const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  slack: "Slack",
  web: "Web Chat",
  discord: "Discord",
  signal: "Signal",
};

// ─── AI Models ───────────────────────────────────────────────────────────────
export const AI_MODELS = {
  extraction: "gpt-4o",
  nextQuestion: "gpt-4o",
  signals: "gpt-4o",
  brief: "gpt-4o",
  partnerRewrite: "gpt-4o",
  commitment: "gpt-4o-mini",
  checkin: "gpt-4o-mini",
  followup: "gpt-4o-mini",
  enrichment: "gpt-4o",
  duplicateDetection: "gpt-4o-mini",
} as const;

// ─── Scout Activity Thresholds (days) ────────────────────────────────────────
export const SCOUT_ACTIVITY = {
  activeThreshold: 7,
  moderateThreshold: 14,
  inactiveThreshold: 28,
} as const;

// ─── Follow-up Limits ────────────────────────────────────────────────────────
export const FOLLOWUP_LIMITS = {
  maxReminders: 3,
  staleAfterDays: 14,
} as const;

// ─── Duplicate Detection ─────────────────────────────────────────────────────
export const DUPLICATE_THRESHOLD = 0.75;
