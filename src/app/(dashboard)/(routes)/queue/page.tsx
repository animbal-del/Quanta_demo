"use client";

import { Clock, Play, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const DEMO_TASKS = [
  {
    id: "t1",
    deal_name: "FlowOps",
    scout: "Amit Sharma",
    info_needed: "Pitch deck",
    expected_date: "2026-05-22",
    followup_date: "2026-05-23",
    status: "pending",
    reminder_count: 0,
    overdue: true,
  },
  {
    id: "t2",
    deal_name: "CampusPay",
    scout: "Sarah Chen",
    info_needed: "User count / traction numbers",
    expected_date: null,
    followup_date: null,
    status: "pending",
    reminder_count: 0,
    overdue: false,
  },
  {
    id: "t3",
    deal_name: "FlowOps",
    scout: "Amit Sharma",
    info_needed: "Pilot customer details",
    expected_date: null,
    followup_date: null,
    status: "pending",
    reminder_count: 0,
    overdue: false,
  },
];

export default function QueuePage() {
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  const overdue = DEMO_TASKS.filter((t) => t.overdue);
  const pending = DEMO_TASKS.filter((t) => !t.overdue);

  function handleRun() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
    }, 1800);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Follow-up Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {overdue.length} due today · {pending.length} pending
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running || ran}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            ran
              ? "bg-green-100 text-green-700 cursor-default"
              : running
              ? "bg-indigo-100 text-indigo-600 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {ran ? (
            <><CheckCircle size={14} /> Sent {overdue.length} follow-up{overdue.length !== 1 ? "s" : ""}</>
          ) : running ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" /> Running…</>
          ) : (
            <><Play size={14} /> Run Follow-up Agent</>
          )}
        </button>
      </div>

      {/* Due today */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Due Today
          </h2>
          <div className="space-y-2">
            {overdue.map((task) => (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-4 flex items-center justify-between transition-all ${
                  ran ? "opacity-50 border-green-200" : "border-amber-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertCircle size={15} className={ran ? "text-green-500" : "text-amber-500"} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.deal_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Missing: <span className="text-gray-700">{task.info_needed}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Scout said by {task.expected_date} · Scout: {task.scout}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {ran ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle size={11} /> Sent
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md font-medium">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending without date */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pending — No Date Set
        </h2>
        <div className="space-y-2">
          {pending.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Clock size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.deal_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Missing: <span className="text-gray-700">{task.info_needed}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Scout: {task.scout}</p>
                </div>
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Ask now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
