"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const SCOUT = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Amit Sharma",
  email: "amit@example.com",
  phone: "+91 98765 43210",
  channel: "Telegram",
  focus_areas: ["AI", "Developer Tools", "Logistics"],
  status: "active",
  responsiveness: 0.85,
  last_active: "2 days ago",
  last_checkin_sent: "5 days ago",
  last_email_responded: "4 days ago",
  joined: "March 2026",
  stats: {
    submitted: 12,
    moved_forward: 4,
    archived: 5,
    pending: 3,
  },
};

const DEALS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "FlowOps",
    description: "AI agents for logistics dispatch",
    status: "needs_info",
    review_label: "strong_candidate",
    days_ago: 0,
  },
  {
    id: "d2",
    name: "DevLens",
    description: "Code review automation for small engineering teams",
    status: "monitor",
    review_label: "worth_exploring",
    days_ago: 8,
  },
  {
    id: "d3",
    name: "PatchOps",
    description: "Automated security patching for SaaS infrastructure",
    status: "archived",
    review_label: "needs_more_info",
    days_ago: 22,
  },
];

const REVIEW_LABEL: Record<string, { label: string; className: string }> = {
  strong_candidate: { label: "Strong Candidate", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  worth_exploring: { label: "Worth Exploring", className: "bg-blue-50 text-blue-700 border-blue-200" },
  needs_more_info: { label: "Needs More Info", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const STATUS_DOT: Record<string, string> = {
  needs_info: "bg-amber-400",
  under_review: "bg-violet-400",
  monitor: "bg-slate-400",
  intro_requested: "bg-emerald-400",
  archived: "bg-gray-300",
};

const EMAIL_HISTORY = [
  { type: "Weekly Check-in", sent: "May 16", response: "yes_have_startup", responded: "May 16" },
  { type: "Weekly Check-in", sent: "May 9", response: "nothing_this_week", responded: "May 9" },
  { type: "Follow-up: FlowOps deck", sent: "May 7", response: null, responded: null },
  { type: "Invite", sent: "March 1", response: "yes_have_startup", responded: "March 2" },
];

function ResponsivenessBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-28 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700">{pct}%</span>
    </div>
  );
}

export default function ScoutDetailPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/scouts"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 w-fit"
      >
        <ArrowLeft size={14} /> Back to Scouts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700">
            {SCOUT.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{SCOUT.name}</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
            <p className="text-sm text-gray-500">{SCOUT.email} · via {SCOUT.channel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare size={13} /> Send Check-in
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail size={13} /> Email Scout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Profile + Stats */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Profile</h2>
            <div className="space-y-2.5 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Focus areas</p>
                <div className="flex flex-wrap gap-1">
                  {SCOUT.focus_areas.map((f) => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Responsiveness</p>
                <ResponsivenessBar value={SCOUT.responsiveness} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-xs text-gray-400">Last active</p>
                  <p className="text-sm text-gray-700">{SCOUT.last_active}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Joined</p>
                  <p className="text-sm text-gray-700">{SCOUT.joined}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Last check-in sent</p>
                  <p className="text-sm text-gray-700">{SCOUT.last_checkin_sent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Last responded</p>
                  <p className="text-sm text-gray-700">{SCOUT.last_email_responded}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activity</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Submitted", value: SCOUT.stats.submitted, color: "text-gray-900" },
                { label: "Moved forward", value: SCOUT.stats.moved_forward, color: "text-emerald-600" },
                { label: "Archived", value: SCOUT.stats.archived, color: "text-gray-400" },
                { label: "Pending", value: SCOUT.stats.pending, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Signal quality bar */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1.5">Signal quality</p>
              <div className="flex rounded-full overflow-hidden h-2">
                <div className="bg-emerald-400" style={{ width: "33%" }} />
                <div className="bg-amber-400" style={{ width: "42%" }} />
                <div className="bg-gray-200" style={{ width: "25%" }} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Strong</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-200 inline-block" /> Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deals + Email history */}
        <div className="col-span-2 space-y-4">
          {/* Deals submitted */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Startups Introduced ({DEALS.length})
              </h2>
              <TrendingUp size={14} className="text-gray-400" />
            </div>
            <div className="space-y-2">
              {DEALS.map((deal) => {
                const review = REVIEW_LABEL[deal.review_label];
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[deal.status] ?? "bg-gray-300"}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                        <p className="text-xs text-gray-400">{deal.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${review.className}`}>
                        {review.label}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} />
                        {deal.days_ago === 0 ? "Today" : `${deal.days_ago}d ago`}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Email correspondence history */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Email History</h2>
            <div className="space-y-2.5">
              {EMAIL_HISTORY.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    {e.response ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-gray-300 shrink-0" />
                    )}
                    <div>
                      <p className="text-gray-800 text-sm">{e.type}</p>
                      <p className="text-xs text-gray-400">Sent {e.sent}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {e.response === "yes_have_startup" && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        Had a lead
                      </span>
                    )}
                    {e.response === "nothing_this_week" && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Nothing this week
                      </span>
                    )}
                    {!e.response && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        No response
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
