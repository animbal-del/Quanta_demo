"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, MessageCircle, CheckCircle2, Clock, TrendingUp, Plus } from "lucide-react";

interface Notification {
  id: string;
  type: "question" | "status_change" | "checkin" | "followup";
  deal_name: string;
  deal_id: string;
  message: string;
  time: string;
  read: boolean;
  action?: string;
}

interface Stats {
  submitted: number;
  in_review: number;
  moved_forward: number;
  pending_action: number;
}

export default function ScoutDashboardPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({ submitted: 0, in_review: 0, moved_forward: 0, pending_action: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        const sid = s.scout_id;
        return fetch(sid ? `/api/scout/deals?scout_id=${sid}` : "/api/scout/deals");
      })
      .then((r) => r.json())
      .then((deals: { status: string; has_pending_question: boolean; startup_name: string | null; id: string; updated_at: string }[]) => {
        const submitted = deals.length;
        const inReview = deals.filter((d) => ["under_review", "monitor"].includes(d.status)).length;
        const movedForward = deals.filter((d) => d.status === "intro_requested").length;
        const pendingAction = deals.filter((d) => d.has_pending_question || d.status === "needs_info").length;
        setStats({ submitted, in_review: inReview, moved_forward: movedForward, pending_action: pendingAction });

        // Build notifications from deal states
        const notifs: Notification[] = [];
        deals.forEach((d) => {
          if (d.has_pending_question) {
            notifs.push({
              id: `q-${d.id}`,
              type: "question",
              deal_name: d.startup_name ?? "Startup",
              deal_id: d.id,
              message: "Quanta has a follow-up question for you.",
              time: d.updated_at,
              read: false,
              action: "Reply",
            });
          }
          if (d.status === "intro_requested") {
            notifs.push({
              id: `intro-${d.id}`,
              type: "status_change",
              deal_name: d.startup_name ?? "Startup",
              deal_id: d.id,
              message: "Quanta has requested an intro with the founder.",
              time: d.updated_at,
              read: true,
            });
          }
          if (d.status === "under_review") {
            notifs.push({
              id: `review-${d.id}`,
              type: "status_change",
              deal_name: d.startup_name ?? "Startup",
              deal_id: d.id,
              message: "Quanta is reviewing this deal.",
              time: d.updated_at,
              read: true,
            });
          }
        });
        setNotifications(notifs.sort((a, b) => (a.read ? 1 : -1)));
      })
      .finally(() => setLoading(false));
  }, []);

  const NOTIF_ICONS = {
    question: MessageCircle,
    status_change: CheckCircle2,
    checkin: Bell,
    followup: Clock,
  };

  const NOTIF_COLORS: Record<string, string> = {
    question: "bg-indigo-50 text-indigo-600",
    status_change: "bg-emerald-50 text-emerald-600",
    checkin: "bg-amber-50 text-amber-600",
    followup: "bg-gray-100 text-gray-500",
  };

  function fmt(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (diff < 1) return "Today";
    if (diff < 2) return "Yesterday";
    return `${Math.round(diff)}d ago`;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></Link>
        <h1 className="text-base font-semibold text-gray-950 flex-1">Activity</h1>
        {notifications.filter((n) => !n.read).length > 0 && (
          <span className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Submitted", value: stats.submitted, icon: TrendingUp, color: "text-gray-950" },
            { label: "In review", value: stats.in_review, icon: CheckCircle2, color: "text-violet-600" },
            { label: "Moved forward", value: stats.moved_forward, icon: ArrowLeft, color: "text-emerald-600" },
            { label: "Need action", value: stats.pending_action, icon: Bell, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notifications</p>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell size={24} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No notifications yet.</p>
              <p className="text-xs text-gray-300 mt-1">Submit a startup to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = NOTIF_ICONS[n.type];
                const colorClass = NOTIF_COLORS[n.type];
                return (
                  <Link key={n.id} href={`/startups/${n.deal_id}`}
                    className={`block border rounded-xl p-4 transition-colors hover:border-gray-200 ${
                      !n.read ? "border-indigo-100 bg-indigo-50/30" : "border-gray-100"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-950 truncate">{n.deal_name}</p>
                          <span className="text-xs text-gray-400 shrink-0">{fmt(n.time)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        {n.action && (
                          <span className="inline-block mt-2 text-xs font-medium text-indigo-600">{n.action} →</span>
                        )}
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick CTA */}
        <Link href="/add-startup"
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl hover:border-gray-300 hover:text-gray-600 transition-colors">
          <Plus size={14} />Submit a new startup
        </Link>
      </div>
    </main>
  );
}
