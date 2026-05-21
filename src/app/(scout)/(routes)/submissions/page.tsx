"use client";

import { ChevronLeft, Clock, CheckCircle2, AlertCircle, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";

const SUBMISSIONS = [
  {
    id: "a",
    name: "FlowOps",
    status: "needs_info",
    status_label: "Waiting on deck",
    next_step: "You said deck by May 22",
    quanta_activity: "Not reviewed yet",
    has_action: false,
    updated: "3 days ago",
  },
  {
    id: "b",
    name: "CampusPay",
    status: "under_review",
    status_label: "Quanta asked a question",
    next_step: "Reply about traction details",
    quanta_activity: "Question sent",
    has_action: true,
    updated: "1 day ago",
  },
  {
    id: "c",
    name: "MedSync AI",
    status: "monitor",
    status_label: "Under review",
    next_step: null,
    quanta_activity: "In review",
    has_action: false,
    updated: "5 days ago",
  },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  needs_info: <Clock size={14} className="text-amber-500" />,
  under_review: <MessageSquare size={14} className="text-indigo-500" />,
  monitor: <CheckCircle2 size={14} className="text-green-500" />,
};

export default function SubmissionsPage() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/scout" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-gray-900">My Submissions</h1>
            <p className="text-xs text-gray-400">Scout view</p>
          </div>
        </div>
        <Link href="/" className="text-gray-400 hover:text-gray-600" aria-label="Switch login">
          <LogOut size={15} />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {SUBMISSIONS.map((s) => (
          <div key={s.id} className={`rounded-2xl border p-4 ${s.has_action ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {STATUS_ICON[s.status]}
                <span className="text-sm font-semibold text-gray-900">{s.name}</span>
              </div>
              {s.has_action && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                  Action needed
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 mb-1">
              Status: <span className="font-medium text-gray-800">{s.status_label}</span>
            </p>

            {s.next_step && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2">
                <AlertCircle size={10} />
                {s.next_step}
              </div>
            )}

            <p className="text-xs text-gray-400">
              Quanta: {s.quanta_activity} · {s.updated}
            </p>
          </div>
        ))}

        <Link
          href="/add-startup"
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-indigo-600 border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-50 transition-colors mt-4"
        >
          + Submit another lead
        </Link>
      </div>
    </div>
  );
}
