import type {
  AskScoutResponse,
  Channel,
  DealInboxItem,
  OpenClawWebhookPayload,
  OpenClawWebhookResponse,
  ProcessMessageRequest,
  ProcessMessageResponse,
} from "@/types";

export const DEMO_SCOUT_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_DEAL_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function hasRealEnvValue(value: string | undefined) {
  return Boolean(value && !value.startsWith("TODO_"));
}

export function isDemoMode() {
  return false;
}

const demoDeals: DealInboxItem[] = [
  {
    id: DEMO_DEAL_ID,
    startup_name: "FlowOps",
    summary: "AI agents for logistics dispatch automation",
    status: "needs_info",
    priority: "high",
    scout: { id: DEMO_SCOUT_ID, full_name: "Amit Sharma" },
    signals: {
      founder_signal: {
        level: "strong",
        evidence: "Scout described Rohan as technical and fast-moving.",
      },
      traction_signal: {
        level: "early",
        evidence: "Three pilot conversations mentioned, but customers are not confirmed.",
      },
    },
    next_action: "Follow up for deck on May 23",
    created_at: "2026-05-20T18:00:00Z",
    updated_at: "2026-05-20T19:10:00Z",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    startup_name: "CampusPay",
    summary: "Payments platform for campus clubs and student organizations",
    status: "under_review",
    priority: "normal",
    scout: { id: "22222222-2222-2222-2222-222222222222", full_name: "Sarah Chen" },
    signals: {
      founder_signal: {
        level: "medium",
        evidence: "Founder has relevant payments product experience.",
      },
      traction_signal: {
        level: "weak",
        evidence: "Need user count and transaction volume.",
      },
    },
    next_action: "Ask for traction details",
    created_at: "2026-05-18T15:00:00Z",
    updated_at: "2026-05-19T15:00:00Z",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    startup_name: "CarbonLoop",
    summary: "Industrial carbon capture using proprietary sorbent material",
    status: "intro_requested",
    priority: "high",
    scout: { id: "33333333-3333-3333-3333-333333333333", full_name: "Jordan Lee" },
    signals: {
      founder_signal: {
        level: "strong",
        evidence: "Founder has MIT materials science background and patents in solid sorbent capture.",
      },
      traction_signal: {
        level: "medium",
        evidence: "NSF grant and early lab validation, but commercial pilot economics still need proof.",
      },
    },
    next_action: "Schedule founder intro and technical diligence",
    created_at: "2026-05-04T16:20:00Z",
    updated_at: "2026-05-21T18:00:00Z",
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    startup_name: "BuildRight AI",
    summary: "Predictive project management for construction delays and overruns",
    status: "under_review",
    priority: "normal",
    scout: { id: DEMO_SCOUT_ID, full_name: "Amit Sharma" },
    signals: {
      founder_signal: {
        level: "medium",
        evidence: "Founder has direct contractor experience and a prior software exit.",
      },
      traction_signal: {
        level: "early",
        evidence: "Five paying customers and early MRR, with geography concentrated in the Midwest.",
      },
    },
    next_action: "Request customer references",
    created_at: "2026-05-01T14:00:00Z",
    updated_at: "2026-05-18T12:00:00Z",
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    startup_name: "HealthThread",
    summary: "Clinical decision support surfaced inside emergency department workflows",
    status: "needs_info",
    priority: "normal",
    scout: { id: "22222222-2222-2222-2222-222222222222", full_name: "Sarah Chen" },
    signals: {
      founder_signal: {
        level: "strong",
        evidence: "Physician-founder has direct ER experience and a technical cofounder from Google Health.",
      },
      traction_signal: {
        level: "early",
        evidence: "Hospital pilot is live, but outcome data is not ready yet.",
      },
    },
    next_action: "Ask for pilot metrics and security audit timing",
    created_at: "2026-05-11T09:30:00Z",
    updated_at: "2026-05-20T15:45:00Z",
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    startup_name: "DevPulse",
    summary: "ML-powered regression detection inside pull request review",
    status: "monitor",
    priority: "normal",
    scout: { id: "33333333-3333-3333-3333-333333333333", full_name: "Jordan Lee" },
    signals: {
      founder_signal: {
        level: "strong",
        evidence: "Founder helped build GitHub Actions and understands CI/CD adoption deeply.",
      },
      traction_signal: {
        level: "medium",
        evidence: "Waitlist and early paying teams exist, but legal questions remain.",
      },
    },
    next_action: "Review non-compete before moving forward",
    created_at: "2026-04-27T17:00:00Z",
    updated_at: "2026-05-16T10:15:00Z",
  },
];

export function getDemoInboxItems() {
  return demoDeals;
}

export function processDemoScoutMessage(input: ProcessMessageRequest): ProcessMessageResponse {
  const lower = input.body.toLowerCase();
  const isCommitment = lower.includes("may 22") || lower.includes("deck by");
  const isFounderSignal = lower.includes("technical") || lower.includes("fast-moving");

  let ai_reply = "Got it. What made this founder or startup stand out to you?";
  if (isFounderSignal) {
    ai_reply = "Helpful. Do you know when you can get the deck or founder intro?";
  } else if (isCommitment) {
    ai_reply = "Perfect. I'll check back after May 22 if it's still missing.";
  } else if (lower.includes("flowops")) {
    ai_reply = "Got it. What made FlowOps stand out?";
  }

  return {
    deal: {
      id: DEMO_DEAL_ID,
      startup_name: lower.includes("flowops") ? "FlowOps" : null,
      one_line_description: "AI agents for logistics dispatch",
    },
    ai_reply,
    missing_info: ["deck", "founder intro", "pilot customer details"],
  };
}

export function handleDemoOpenClawWebhook(payload: OpenClawWebhookPayload): OpenClawWebhookResponse {
  const result = processDemoScoutMessage({
    scout_id: DEMO_SCOUT_ID,
    channel: payload.channel ?? ("telegram" as Channel),
    message_type: payload.message_type ?? "text",
    body: payload.text ?? "",
    deal_id: null,
  });

  return {
    reply: result.ai_reply,
    agent: "ScoutIntakeAgent",
    deal_id: result.deal?.id ?? null,
  };
}

export function runDemoScheduler(job: string) {
  if (job === "checkins") {
    return {
      job,
      count: 3,
      messages: ["Any founders cross your radar this week? Could be rough signals."],
    };
  }

  if (job === "followups" || job === "all") {
    return {
      job,
      count: 1,
      messages: [
        "You mentioned you'd try to get FlowOps' deck by May 22. Were you able to get it?",
      ],
    };
  }

  return null;
}

export function askScoutDemo(question: string): AskScoutResponse {
  const asksPilotCustomers = question.toLowerCase().includes("pilot");
  return {
    sent_message: asksPilotCustomers
      ? "Quanta had one quick follow-up on FlowOps: do you know who the 3 pilot customers are, and would Rohan be open to an intro?"
      : `Quanta had one quick follow-up on FlowOps: ${question}`,
    partner_question_id: "demo-partner-question-001",
  };
}
