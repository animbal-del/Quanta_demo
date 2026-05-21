"use client";

import { useState } from "react";
import { ArrowUpRight, MessageSquare, Star, Clock, ChevronRight, AlertCircle, Inbox, PlayCircle } from "lucide-react";
import Link from "next/link";

const DEMO_DEALS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    startup_name: "FlowOps",
    summary: "AI agents for logistics dispatch automation",
    status: "needs_info",
    priority: "high",
    scout: "Amit Sharma",
    category: "AI / Logistics",
    source: "Purdue Hackathon",
    potential: "High Potential",
    signals: {
      founder: { level: "strong", label: "Strong" },
      traction: { level: "early", label: "Early" },
      market: { level: "unclear", label: "Unclear" },
      conviction: { level: "high", label: "High" },
    },
    missing: ["Pitch deck", "Pilot customer details", "Founder intro"],
    next_action: "Follow-up for deck scheduled May 23",
    updated: "2 hours ago",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    startup_name: "CampusPay",
    summary: "Payments platform for campus clubs and student organizations",
    status: "under_review",
    priority: "normal",
    scout: "Sarah Chen",
    category: "Fintech",
    source: "University network",
    potential: "Needs Clarity",
    signals: {
      founder: { level: "medium", label: "Medium" },
      traction: { level: "weak", label: "Weak" },
      market: { level: "medium", label: "Medium" },
      conviction: { level: "medium", label: "Medium" },
    },
    missing: ["User count / traction numbers"],
    next_action: "Ask for traction details",
    updated: "1 day ago",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    startup_name: "MedSync AI",
    summary: "AI-powered patient scheduling and care coordination",
    status: "monitor",
    priority: "normal",
    scout: "Jordan Lee",
    category: "Healthcare AI",
    source: "Mutual referral",
    potential: "Medium",
    signals: {
      founder: { level: "strong", label: "Strong" },
      traction: { level: "medium", label: "Medium" },
      market: { level: "strong", label: "Strong" },
      conviction: { level: "medium", label: "Medium" },
    },
    missing: [],
    next_action: "No action needed",
    updated: "3 days ago",
  },
];

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Needs Info", value: "needs_info" },
  { label: "Under Review", value: "under_review" },
  { label: "High Signal", value: "high_signal" },
  { label: "Monitor", value: "monitor" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  needs_info: { label: "Needs Info", className: "bg-amber-100 text-amber-700" },
  under_review: { label: "Under Review", className: "bg-purple-100 text-purple-700" },
  intro_requested: { label: "Intro Requested", className: "bg-green-100 text-green-700" },
  monitor: { label: "Monitor", className: "bg-slate-100 text-slate-600" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-600" },
};

const SIGNAL_COLORS: Record<string, string> = {
  strong: "text-emerald-600",
  high: "text-emerald-600",
  medium: "text-amber-600",
  early: "text-blue-600",
  weak: "text-red-500",
  unclear: "text-gray-400",
  low: "text-red-500",
};

export default function InboxPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = DEMO_DEALS.filter((d) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "high_signal") return d.priority === "high";
    return d.status === activeFilter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Command Center</p>
        <h1 className="text-xl font-semibold text-gray-900">Today</h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "New startups", value: "8", icon: Inbox },
            { label: "Need review", value: "5", icon: AlertCircle },
            { label: "Follow-ups due", value: "6", icon: PlayCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <Icon size={13} className="text-indigo-600" />
                  {item.label}
                </div>
                <p className="text-2xl font-semibold text-gray-950">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Deal cards */}
      <div className="space-y-3">
        {filtered.map((deal) => {
          const status = STATUS_CONFIG[deal.status];
          return (
            <div
              key={deal.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {deal.priority === "high" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                    <h2 className="font-semibold text-gray-900 text-base">
                      {deal.startup_name}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      {deal.potential}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {deal.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{deal.summary}</p>

                  {/* Signals row */}
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Founder</span>
                      <span className={`font-medium ${SIGNAL_COLORS[deal.signals.founder.level]}`}>
                        {deal.signals.founder.label}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Traction</span>
                      <span className={`font-medium ${SIGNAL_COLORS[deal.signals.traction.level]}`}>
                        {deal.signals.traction.label}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Market</span>
                      <span className={`font-medium ${SIGNAL_COLORS[deal.signals.market.level]}`}>
                        {deal.signals.market.label}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Conviction</span>
                      <span className={`font-medium ${SIGNAL_COLORS[deal.signals.conviction.level]}`}>
                        {deal.signals.conviction.label}
                      </span>
                    </div>
                  </div>

                  {/* Missing info */}
                  {deal.missing.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md px-2.5 py-1.5 w-fit mb-3">
                      <AlertCircle size={11} />
                      <span>Missing: {deal.missing.join(" · ")}</span>
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Scout: <span className="text-gray-600">{deal.scout}</span></span>
                    <span>·</span>
                    <span>{deal.source}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {deal.updated}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Open <ChevronRight size={12} />
                  </Link>
                  <div className="flex gap-1.5 mt-auto">
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <MessageSquare size={11} />
                      Ask Scout
                    </button>
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <Star size={11} />
                      Priority
                    </button>
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                      <ArrowUpRight size={11} />
                      Intro
                    </button>
                  </div>
                </div>
              </div>

              {/* Next action banner */}
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                Next: {deal.next_action}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
