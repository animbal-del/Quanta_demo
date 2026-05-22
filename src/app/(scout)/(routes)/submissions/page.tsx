"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Clock, MessageCircle, CheckCircle2, AlertCircle, Plus } from "lucide-react";

interface ScoutDeal {
  id: string; startup_name: string | null; one_line_description: string | null;
  status: string; has_pending_question: boolean; missing_count: number;
  next_step: string | null; quanta_activity: string | null; updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  needs_info:       { label: "Waiting on info",  badgeClass: "bg-amber-50 text-amber-700" },
  under_review:     { label: "Under review",     badgeClass: "bg-violet-50 text-violet-700" },
  intro_requested:  { label: "Intro requested",  badgeClass: "bg-emerald-50 text-emerald-700" },
  monitor:          { label: "Monitoring",        badgeClass: "bg-slate-50 text-slate-600" },
  submitted:        { label: "Submitted",         badgeClass: "bg-blue-50 text-blue-700" },
  draft:            { label: "Draft",             badgeClass: "bg-gray-100 text-gray-500" },
  archived:         { label: "Archived",          badgeClass: "bg-gray-100 text-gray-400" },
};

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.round(diff)}d ago`;
}

export default function SubmissionsPage() {
  const [deals, setDeals] = useState<ScoutDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        const sid = s.scout_id;
        return fetch(sid ? `/api/scout/deals?scout_id=${sid}` : "/api/scout/deals");
      })
      .then((r) => r.json())
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? deals
    : filter === "action" ? deals.filter((d) => d.has_pending_question || d.status === "needs_info")
    : deals.filter((d) => d.status === filter);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 h-13 flex items-center gap-3 z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-700"><ChevronLeft size={20} /></Link>
        <h1 className="text-base font-semibold text-gray-950 flex-1">My Submissions</h1>
        <Link href="/add-startup" className="h-7 px-3 bg-gray-950 text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-gray-800">
          <Plus size={11} /> Add
        </Link>
      </header>

      {/* Filter chips */}
      <div className="px-4 py-3 flex gap-1.5 overflow-x-auto scrollbar-hide border-b border-gray-100">
        {[
          { label: "All", value: "all" },
          { label: "Need action", value: "action" },
          { label: "Under review", value: "under_review" },
          { label: "Monitoring", value: "monitor" },
          { label: "Archived", value: "archived" },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 h-7 rounded-full text-xs font-medium transition-colors ${
              filter === f.value ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm">
            {filter === "all" ? "No startups submitted yet." : "No deals match this filter."}
          </div>
        ) : filtered.map((deal) => {
          const cfg = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.submitted;
          const needsAction = deal.has_pending_question;

          return (
            <Link key={deal.id} href={`/startups/${deal.id}`}
              className={`block border rounded-xl p-4 transition-colors ${
                needsAction ? "border-indigo-100 bg-indigo-50/30" : "border-gray-100 hover:border-gray-200"
              }`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-gray-950 truncate">{deal.startup_name ?? "Unnamed"}</p>
                    {needsAction && (
                      <span className="text-xs text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0">
                        <MessageCircle size={9} /> Action needed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2 truncate">{deal.one_line_description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
                    {/* Missing info badge */}
                    {deal.missing_count > 0 && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0 border border-amber-200">
                        <AlertCircle size={9} />{deal.missing_count} info needed
                      </span>
                    )}
                    {deal.next_step && !deal.missing_count && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <AlertCircle size={9} />{deal.next_step}
                      </span>
                    )}
                    {deal.quanta_activity && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle2 size={9} />{deal.quanta_activity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-300 flex items-center gap-1 mb-1">
                    <Clock size={9} />{relativeTime(deal.updated_at)}
                  </p>
                  <ArrowRight size={13} className="text-gray-300 ml-auto" />
                </div>
              </div>
            </Link>
          );
        })}

        <Link href="/add-startup"
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl hover:border-gray-300 hover:text-gray-600 transition-colors mt-4">
          <Plus size={14} />Submit another startup
        </Link>
      </div>
    </main>
  );
}
