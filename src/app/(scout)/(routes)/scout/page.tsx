"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Clock, MessageCircle, CheckCircle2, AlertCircle, Zap, User, Bell } from "lucide-react";

interface ScoutDeal {
  id: string; startup_name: string | null; one_line_description: string | null;
  status: string; has_pending_question: boolean; missing_count: number;
  next_step: string | null; quanta_activity: string | null; updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; iconColor: string; badgeClass: string }> = {
  needs_info:       { label: "Needs info",      icon: Clock,         iconColor: "text-amber-500",   badgeClass: "bg-amber-50 text-amber-700" },
  under_review:     { label: "Under review",    icon: CheckCircle2,  iconColor: "text-violet-500",  badgeClass: "bg-violet-50 text-violet-700" },
  intro_requested:  { label: "Intro requested", icon: ArrowRight,    iconColor: "text-emerald-500", badgeClass: "bg-emerald-50 text-emerald-700" },
  monitor:          { label: "Monitoring",       icon: CheckCircle2,  iconColor: "text-slate-400",   badgeClass: "bg-slate-50 text-slate-600" },
  submitted:        { label: "Submitted",        icon: Clock,         iconColor: "text-blue-500",    badgeClass: "bg-blue-50 text-blue-700" },
  draft:            { label: "Draft",            icon: Clock,         iconColor: "text-gray-400",    badgeClass: "bg-gray-100 text-gray-500" },
  archived:         { label: "Archived",         icon: CheckCircle2,  iconColor: "text-gray-300",    badgeClass: "bg-gray-100 text-gray-400" },
};

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.round(diff)}d ago`;
}

export default function ScoutHomePage() {
  const [deals, setDeals] = useState<ScoutDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("there");

  useEffect(() => {
    fetch("/api/scout/deals").then((r) => r.json()).then(setDeals).finally(() => setLoading(false));
    fetch("/api/auth/session").then((r) => r.json()).then((s) => {
      if (s.display_name) setDisplayName(s.display_name.split(" ")[0]);
    });
  }, []);

  const needsAction = deals.filter((d) => d.has_pending_question || d.status === "needs_info");
  const submitted = deals.length;
  const inReview = deals.filter((d) => d.status === "under_review" || d.status === "monitor").length;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Scout Portal</p>
            <h1 className="text-lg font-semibold text-gray-950">Hi {displayName} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Bell size={13} className="text-gray-600" />
            </Link>
            <Link href="/account">
              <div className="w-8 h-8 rounded-full bg-gray-950 flex items-center justify-center hover:bg-gray-800 transition-colors">
                <User size={14} className="text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* CTA */}
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="text-base font-medium text-gray-700 mb-4">Seen an interesting startup recently?</p>
        <Link href="/add-startup"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          <Plus size={15} />Add Startup
        </Link>
      </div>

      {/* Stats strip */}
      {!loading && deals.length > 0 && (
        <div className="flex border-b border-gray-100">
          {[
            { label: "Submitted", value: submitted },
            { label: "In review", value: inReview },
            { label: "Need action", value: needsAction.length },
          ].map((s, i) => (
            <div key={s.label} className={`flex-1 px-4 py-3 text-center ${i > 0 ? "border-l border-gray-100" : ""}`}>
              <p className={`text-lg font-bold ${s.label === "Need action" && s.value > 0 ? "text-amber-600" : "text-gray-950"}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Deal list */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Your Startups</p>
          <Link href="/submissions" className="text-xs text-gray-400 hover:text-gray-700">View all →</Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-1">No startups submitted yet.</p>
            <p className="text-xs text-gray-300">Click "Add Startup" to submit your first lead.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => {
              const cfg = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.submitted;
              const Icon = cfg.icon;
              const hasAction = deal.has_pending_question;

              return (
                <Link key={deal.id} href={`/startups/${deal.id}`}
                  className="block border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-950 truncate">{deal.startup_name ?? "Unnamed"}</p>
                        {hasAction && (
                          <span className="shrink-0 text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <MessageCircle size={9} /> Reply
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-2">{deal.one_line_description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>
                          <Icon size={10} />{cfg.label}
                        </span>
                        {deal.next_step && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <AlertCircle size={9} />{deal.next_step}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-300">{relativeTime(deal.updated_at)}</p>
                      <ArrowRight size={13} className="text-gray-300 mt-1 ml-auto" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
