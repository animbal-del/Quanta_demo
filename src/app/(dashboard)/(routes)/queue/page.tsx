"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle2, AlertCircle, Play, Loader2, Send } from "lucide-react";

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
  const [runResult, setRunResult] = useState<{ count: number; sent: number } | null>(null);
  const [askingId, setAskingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const loadTasks = useCallback(() => {
    setLoading(true);
    fetch("/api/internal/queue")
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function runFollowups() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/internal/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: "followups" }),
      });
      const data = await res.json();
      setRunResult({ count: data.count ?? 0, sent: data.sent ?? 0 });
      // Refresh task list after running
      loadTasks();
    } finally {
      setRunning(false);
    }
  }

  async function askNow(task: Task) {
    setAskingId(task.id);
    try {
      const res = await fetch(`/api/internal/tasks/${task.id}/remind`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed: ${data.error ?? "Unknown error"}`);
      } else {
        setSentIds((prev) => { const next = new Set(prev); next.add(task.id); return next; });
        alert(data.sent
          ? `Email sent to scout for "${task.info_needed}"`
          : `${data.message}`);
      }
    } finally {
      setAskingId(null);
    }
  }

  const overdue  = tasks.filter((t) => t.overdue);
  const noDate   = tasks.filter((t) => !t.overdue && !t.followup_date);
  const upcoming = tasks.filter((t) => !t.overdue && t.followup_date);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Follow-up Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${overdue.length} overdue · ${noDate.length + upcoming.length} pending`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={runFollowups} disabled={running || loading}
            className={`flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-all ${
              running ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : runResult ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-950 text-white hover:bg-gray-800"
            }`}>
            {running
              ? <><Loader2 size={13} className="animate-spin" /> Running…</>
              : runResult
              ? <><CheckCircle2 size={13} /> {runResult.sent} sent of {runResult.count}</>
              : <><Play size={13} /> Run Follow-up Agent</>}
          </button>
          {runResult && (
            <p className="text-xs text-gray-400">
              Emails sent to {runResult.sent} scout{runResult.sent !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <div className="space-y-6">

          {/* Overdue */}
          {overdue.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Overdue — follow-up due
              </p>
              <div className="space-y-2">
                {overdue.map((task) => (
                  <TaskRow key={task.id} task={task} variant="overdue"
                    onAsk={() => askNow(task)}
                    asking={askingId === task.id}
                    sent={sentIds.has(task.id)} />
                ))}
              </div>
            </section>
          )}

          {/* No date — pending but no follow-up date */}
          {noDate.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Pending — no date set
              </p>
              <div className="space-y-2">
                {noDate.map((task) => (
                  <TaskRow key={task.id} task={task} variant="pending"
                    onAsk={() => askNow(task)}
                    asking={askingId === task.id}
                    sent={sentIds.has(task.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Upcoming
              </p>
              <div className="space-y-2">
                {upcoming.map((task) => (
                  <TaskRow key={task.id} task={task} variant="upcoming"
                    onAsk={() => askNow(task)}
                    asking={askingId === task.id}
                    sent={sentIds.has(task.id)} />
                ))}
              </div>
            </section>
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

function TaskRow({
  task, variant, onAsk, asking, sent,
}: {
  task: Task;
  variant: "overdue" | "pending" | "upcoming";
  onAsk: () => void;
  asking: boolean;
  sent: boolean;
}) {
  const borderColor = variant === "overdue" ? "border-amber-100" : "border-gray-100";
  const icon = variant === "overdue"
    ? <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
    : <Clock size={14} className="text-gray-300 mt-0.5 shrink-0" />;

  return (
    <div className={`bg-white border ${borderColor} rounded-xl p-4 flex items-start justify-between gap-4`}>
      <div className="flex items-start gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{task.deal_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Missing: <span className="text-gray-700">{task.info_needed}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {task.scout_name}
            {task.expected_date && <> · promised by {task.expected_date}</>}
            {task.reminder_count > 0 && <> · {task.reminder_count} reminder{task.reminder_count !== 1 ? "s" : ""} sent</>}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        {sent ? (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> Sent
          </span>
        ) : (
          <button onClick={onAsk} disabled={asking}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors">
            {asking
              ? <Loader2 size={11} className="animate-spin" />
              : <Send size={11} />}
            {asking ? "Sending…" : "Ask now"}
          </button>
        )}
      </div>
    </div>
  );
}
