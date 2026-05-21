"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Star, Clock, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";

interface Deal {
  id: string; startup_name: string | null; summary: string | null;
  status: string; priority: string; scout: { full_name: string } | null;
  signals: { founder_signal: { level: string }; traction_signal: { level: string } } | null;
  next_action: string | null; updated_at: string;
}

const STATUS: Record<string, { label: string; dot: string }> = {
  draft:            { label: "Draft",            dot: "bg-gray-300" },
  submitted:        { label: "Submitted",        dot: "bg-blue-400" },
  needs_info:       { label: "Needs Info",       dot: "bg-amber-400" },
  under_review:     { label: "Under Review",     dot: "bg-violet-400" },
  intro_requested:  { label: "Intro Requested",  dot: "bg-emerald-400" },
  monitor:          { label: "Monitor",          dot: "bg-slate-300" },
  archived:         { label: "Archived",         dot: "bg-gray-200" },
  rejected:         { label: "Rejected",         dot: "bg-red-300" },
};

const SIGNAL_COLOR: Record<string, string> = {
  strong: "text-emerald-600", high: "text-emerald-600",
  medium: "text-amber-600",  early: "text-blue-600",
  weak:   "text-red-500",    unclear: "text-gray-400",
};

const FILTERS = [
  { label: "All",         value: "all" },
  { label: "Needs Info",  value: "needs_info" },
  { label: "Under Review",value: "under_review" },
  { label: "High Signal", value: "high_signal" },
  { label: "Monitor",     value: "monitor" },
];

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)   return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-100 rounded w-28" />
            <div className="h-4 bg-gray-100 rounded w-16" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
          <div className="flex gap-6">
            {[1, 2, 3].map((j) => <div key={j} className="h-3 bg-gray-100 rounded w-20" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InboxPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/internal/deals")
      .then((r) => r.json())
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  const filtered = deals.filter((d) => {
    if (filter === "all") return true;
    if (filter === "high_signal") return d.priority === "high";
    return d.status === filter;
  });

  const needsInfo = deals.filter((d) => d.status === "needs_info").length;
  const newToday = deals.filter((d) => {
    const diff = (Date.now() - new Date(d.updated_at).getTime()) / 86400000;
    return diff < 1;
  }).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-gray-950">Command Center</h1>
          <span className="text-xs text-gray-400">{deals.length} deals total</span>
        </div>
        <div className="mt-4 flex gap-3">
          {[
            { label: "Updated today", value: newToday },
            { label: "Need attention", value: needsInfo },
            { label: "Total active", value: deals.filter(d => !["archived","rejected"].includes(d.status)).length },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-gray-950">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 h-8 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-gray-950 text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Deals */}
      {loading ? <Skeleton /> : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mb-4 opacity-25">
                <rect x="8" y="16" width="40" height="32" rx="4" stroke="#9ca3af" strokeWidth="2" />
                <path d="M8 24h40" stroke="#9ca3af" strokeWidth="2" />
                <rect x="16" y="32" width="10" height="2" rx="1" fill="#9ca3af" />
                <rect x="16" y="37" width="16" height="2" rx="1" fill="#9ca3af" />
              </svg>
              <p className="text-sm font-medium text-gray-400">No deals match this filter</p>
              <p className="text-xs text-gray-300 mt-1">Try switching to "All" to see everything.</p>
            </div>
          )}
          {filtered.map((deal) => {
            const s = STATUS[deal.status] ?? STATUS.draft;
            return (
              <Link key={deal.id} href={`/deals/${deal.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <span className="text-sm font-semibold text-gray-950 truncate">
                        {deal.startup_name ?? "Unnamed"}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{s.label}</span>
                      {deal.priority === "high" && (
                        <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium shrink-0">High</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-2.5 truncate">{deal.summary}</p>

                    {/* Signals + meta */}
                    <div className="flex items-center gap-3 text-xs">
                      {deal.signals && (
                        <>
                          <span className="flex items-center gap-1 text-gray-400">
                            Founder
                            <span className={`font-medium capitalize ${SIGNAL_COLOR[deal.signals.founder_signal?.level] ?? "text-gray-400"}`}>
                              {deal.signals.founder_signal?.level}
                            </span>
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-1 text-gray-400">
                            Traction
                            <span className={`font-medium capitalize ${SIGNAL_COLOR[deal.signals.traction_signal?.level] ?? "text-gray-400"}`}>
                              {deal.signals.traction_signal?.level}
                            </span>
                          </span>
                          <span className="text-gray-200">·</span>
                        </>
                      )}
                      {deal.scout && <span className="text-gray-400">{deal.scout.full_name}</span>}
                      <span className="text-gray-200">·</span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={10} />{relativeTime(deal.updated_at)}
                      </span>
                      {deal.next_action && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-gray-400 flex items-center gap-1">
                            <AlertCircle size={10} />{deal.next_action}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions — stop propagation so they don't navigate to deal detail */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/deals/${deal.id}?tab=interaction`}
                      onClick={(e) => e.stopPropagation()}
                      title="Ask Scout"
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <MessageSquare size={13} />
                    </Link>
                    <button title="Set high priority"
                      onClick={async (e) => {
                        e.preventDefault();
                        await fetch(`/api/internal/deals/${deal.id}/status`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ priority: deal.priority === "high" ? "normal" : "high" }),
                        });
                        setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, priority: d.priority === "high" ? "normal" : "high" } : d));
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${deal.priority === "high" ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                      <Star size={13} />
                    </button>
                    <button title="Request intro"
                      onClick={async (e) => {
                        e.preventDefault();
                        await fetch(`/api/internal/deals/${deal.id}/status`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "intro_requested" }),
                        });
                        setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, status: "intro_requested" as const } : d));
                      }}
                      className="p-1.5 text-white bg-gray-950 hover:bg-gray-800 rounded-lg transition-colors">
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
