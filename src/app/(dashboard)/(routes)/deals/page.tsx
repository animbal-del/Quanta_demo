"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, AlertCircle, Clock } from "lucide-react";

interface Deal {
  id: string; startup_name: string | null; one_line_description: string | null;
  category: string | null; stage: string | null; status: string; priority: string;
  scout: { full_name: string; id: string } | null;
  signals: { founder_signal: { level: string; evidence: string }; traction_signal: { level: string }; market_signal: { level: string } } | null;
  review_label?: string; submission_mode?: string; missing_count?: number; updated_at: string;
}

const STATUS: Record<string, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-gray-300" },
  submitted: { label: "Submitted", dot: "bg-blue-400" },
  needs_info: { label: "Needs Info", dot: "bg-amber-400" },
  under_review: { label: "Under Review", dot: "bg-violet-400" },
  intro_requested: { label: "Intro Requested", dot: "bg-emerald-400" },
  monitor: { label: "Monitor", dot: "bg-slate-300" },
  archived: { label: "Archived", dot: "bg-gray-200" },
  rejected: { label: "Rejected", dot: "bg-red-300" },
};

const REVIEW_BADGE: Record<string, { label: string; className: string }> = {
  strong_candidate: { label: "Strong Candidate", className: "bg-emerald-50 text-emerald-700" },
  worth_exploring:  { label: "Worth Exploring",  className: "bg-blue-50 text-blue-700" },
  needs_more_info:  { label: "Needs More Info",  className: "bg-amber-50 text-amber-700" },
};

const SIGNAL_COLOR: Record<string, string> = {
  strong: "text-emerald-600", medium: "text-amber-600",
  early: "text-blue-600",    weak: "text-red-500", unclear: "text-gray-400",
};

const FILTERS = ["all", "needs_info", "under_review", "monitor", "intro_requested", "archived"];

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  return `${Math.round(diff)}d ago`;
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/internal/deals")
      .then((r) => r.json())
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  const filtered = deals.filter((d) => {
    const matchStatus = filter === "all" || d.status === filter;
    const matchSearch = !search ||
      (d.startup_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.scout?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.category ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Applications</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {deals.length} deals</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals…"
            className="h-8 pl-8 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 w-48" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-gray-950 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}>
              {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <div className="space-y-2">
          {filtered.map((deal) => {
            const s = STATUS[deal.status] ?? STATUS.draft;
            const review = deal.review_label ? REVIEW_BADGE[deal.review_label] : null;
            return (
              <Link key={deal.id} href={`/deals/${deal.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-950">{deal.startup_name ?? "Unnamed"}</span>
                      {review && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.className}`}>{review.label}</span>
                      )}
                      {deal.category && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{deal.category}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 truncate">{deal.one_line_description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {deal.signals && (
                        <>
                          {(["founder_signal","traction_signal","market_signal"] as const).map((key) => {
                            const sig = deal.signals?.[key];
                            if (!sig) return null;
                            return (
                              <span key={key} className="flex items-center gap-1">
                                {key.replace("_signal","").replace(/\b\w/g,l=>l.toUpperCase())}
                                <span className={`font-medium capitalize ${SIGNAL_COLOR[sig.level] ?? "text-gray-400"}`}>{sig.level}</span>
                              </span>
                            );
                          })}
                          <span className="text-gray-200">·</span>
                        </>
                      )}
                      {deal.scout && <span>{deal.scout.full_name}</span>}
                      <span className="text-gray-200">·</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{relativeTime(deal.updated_at)}</span>
                      {(deal.missing_count ?? 0) > 0 && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertCircle size={10} />{deal.missing_count} missing
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-14 text-gray-400 text-sm">No deals match this filter.</div>
          )}
        </div>
      )}
    </div>
  );
}
