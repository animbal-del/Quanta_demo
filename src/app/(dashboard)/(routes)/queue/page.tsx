"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Play, Loader2 } from "lucide-react";

interface Task {
  id: string; deal_id: string; deal_name: string; scout_name: string;
  info_needed: string; expected_date: string | null;
  followup_date: string | null; status: string; reminder_count: number; overdue: boolean;
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-48" />
        </div>
      ))}
    </div>
  );
}

export default function QueuePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    fetch("/api/internal/queue")
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  async function runFollowups() {
    setRunning(true);
    try {
      await fetch("/api/internal/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: "followups" }),
      });
      setRan(true);
    } finally {
      setRunning(false);
    }
  }

  const overdue = tasks.filter((t) => t.overdue);
  const pending = tasks.filter((t) => !t.overdue);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Follow-up Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${overdue.length} overdue · ${pending.length} pending`}
          </p>
        </div>
        <button onClick={runFollowups} disabled={running || ran}
          className={`flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-all ${
            ran ? "bg-emerald-50 text-emerald-700"
              : running ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-gray-950 text-white hover:bg-gray-800"
          }`}>
          {ran ? <><CheckCircle2 size={13} /> Sent {overdue.length} follow-up{overdue.length !== 1 ? "s" : ""}</>
            : running ? <><Loader2 size={13} className="animate-spin" /> Running…</>
            : <><Play size={13} /> Run Follow-up Agent</>}
        </button>
      </div>

      {loading ? <Skeleton /> : (
        <div className="space-y-5">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Overdue</p>
              <div className="space-y-2">
                {overdue.map((task) => (
                  <div key={task.id} className={`bg-white border rounded-xl p-4 transition-opacity ${ran ? "opacity-40 border-emerald-100" : "border-amber-100"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={14} className={`mt-0.5 shrink-0 ${ran ? "text-emerald-500" : "text-amber-500"}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{task.deal_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Missing: <span className="text-gray-700">{task.info_needed}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Scout promised by {task.expected_date} · {task.scout_name}
                          </p>
                        </div>
                      </div>
                      {ran
                        ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 shrink-0"><CheckCircle2 size={11} /> Sent</span>
                        : <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium shrink-0">Overdue</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pending — no date set</p>
              <div className="space-y-2">
                {pending.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="text-gray-300 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{task.deal_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Missing: <span className="text-gray-700">{task.info_needed}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.scout_name}</p>
                      </div>
                    </div>
                    <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0">Ask now</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-14 text-gray-400 text-sm">
              <CheckCircle2 size={24} className="mx-auto mb-2 opacity-30" />
              No pending follow-ups.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
