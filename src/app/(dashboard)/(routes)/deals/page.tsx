"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";

const DEALS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "FlowOps",
    description: "AI agents for logistics dispatch automation",
    category: "AI / Logistics",
    stage: "Pre-seed",
    scout: { name: "Amit Sharma", initials: "AS" },
    status: "needs_info",
    review_label: "strong_candidate",
    signals: { founder: "Strong", traction: "Early", market: "Unclear" },
    missing_count: 3,
    days_since_update: 0,
    submission_mode: "voice",
    priority: "high",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "CampusPay",
    description: "Payments platform for campus clubs and student organizations",
    category: "Fintech",
    stage: "Pre-seed",
    scout: { name: "Sarah Chen", initials: "SC" },
    status: "under_review",
    review_label: "worth_exploring",
    signals: { founder: "Medium", traction: "Weak", market: "Medium" },
    missing_count: 1,
    days_since_update: 1,
    submission_mode: "manual",
    priority: "normal",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "MedSync AI",
    description: "AI-powered patient scheduling and care coordination",
    category: "Healthcare AI",
    stage: "Seed",
    scout: { name: "Jordan Lee", initials: "JL" },
    status: "monitor",
    review_label: "worth_exploring",
    signals: { founder: "Strong", traction: "Medium", market: "Strong" },
    missing_count: 0,
    days_since_update: 3,
    submission_mode: "document",
    priority: "normal",
  },
];

const STATUSES = ["all", "needs_info", "under_review", "monitor", "intro_requested", "archived"];

const STATUS_LABEL: Record<string, string> = {
  all: "All",
  needs_info: "Needs Info",
  under_review: "Under Review",
  monitor: "Monitor",
  intro_requested: "Intro Requested",
  archived: "Archived",
};

const STATUS_DOT: Record<string, string> = {
  needs_info: "bg-amber-400",
  under_review: "bg-violet-400",
  monitor: "bg-slate-400",
  intro_requested: "bg-emerald-400",
  archived: "bg-gray-300",
};

const REVIEW_LABEL: Record<string, { label: string; className: string }> = {
  strong_candidate: { label: "Strong Candidate", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  worth_exploring: { label: "Worth Exploring", className: "bg-blue-50 text-blue-700 border-blue-200" },
  needs_more_info: { label: "Needs More Info", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const SIGNAL_COLOR: Record<string, string> = {
  Strong: "text-emerald-600",
  Medium: "text-amber-600",
  Early: "text-blue-600",
  Weak: "text-red-500",
  Unclear: "text-gray-400",
};

const MODE_LABEL: Record<string, string> = {
  voice: "Voice",
  manual: "Form",
  document: "Doc",
};

export default function DealsPage() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = DEALS.filter((d) => {
    const matchStatus = activeStatus === "all" || d.status === activeStatus;
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.scout.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} of {DEALS.length} deals
          </p>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, scout, category…"
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3 h-9 rounded-lg text-sm font-medium transition-colors ${
                activeStatus === s
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid gap-3">
        {filtered.map((deal) => {
          const review = REVIEW_LABEL[deal.review_label] ?? REVIEW_LABEL.needs_more_info;
          return (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Priority dot */}
                <div className="pt-1.5 shrink-0">
                  <span className={`block w-2 h-2 rounded-full ${STATUS_DOT[deal.status] ?? "bg-gray-300"}`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900">{deal.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${review.className}`}>
                          {review.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {deal.category}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {MODE_LABEL[deal.submission_mode]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{deal.description}</p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-gray-400 group-hover:text-gray-700 transition-colors shrink-0 mt-1"
                    />
                  </div>

                  {/* Signals row */}
                  <div className="flex items-center gap-4 text-xs mb-3">
                    {Object.entries(deal.signals).map(([key, val]) => (
                      <span key={key} className="flex items-center gap-1">
                        <span className="text-gray-400 capitalize">{key}</span>
                        <span className={`font-medium ${SIGNAL_COLOR[val]}`}>{val}</span>
                      </span>
                    ))}
                    {deal.missing_count > 0 && (
                      <>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle size={10} />
                          {deal.missing_count} missing
                        </span>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {/* Scout avatar + name */}
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center">
                        {deal.scout.initials}
                      </span>
                      {deal.scout.name}
                    </span>
                    <span>·</span>
                    <span>{deal.stage}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {deal.days_since_update === 0
                        ? "Today"
                        : `${deal.days_since_update}d ago`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <TrendingUp size={28} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No deals match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
