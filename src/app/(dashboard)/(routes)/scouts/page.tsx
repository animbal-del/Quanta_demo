"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink, TrendingUp } from "lucide-react";

const DEMO_SCOUTS = [
  {
    id: "1",
    name: "Amit Sharma",
    focus: ["AI", "Developer Tools", "Logistics"],
    submissions: 12,
    high_signal: 4,
    last_active: "2 days ago",
    status: "active",
    responsiveness: 0.85,
    channel: "Telegram",
  },
  {
    id: "2",
    name: "Sarah Chen",
    focus: ["Consumer", "Fintech", "EdTech"],
    submissions: 8,
    high_signal: 2,
    last_active: "6 days ago",
    status: "active",
    responsiveness: 0.70,
    channel: "Telegram",
  },
  {
    id: "3",
    name: "Jordan Lee",
    focus: ["Healthcare", "AI", "B2B SaaS"],
    submissions: 15,
    high_signal: 6,
    last_active: "1 day ago",
    status: "active",
    responsiveness: 0.90,
    channel: "Slack",
  },
];

function ResponsivenessBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

export default function ScoutsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Scout Network</h1>
          <p className="text-sm text-gray-500 mt-0.5">{DEMO_SCOUTS.length} active scouts</p>
        </div>
        <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
          + Add Scout
        </button>
      </div>

      <div className="space-y-3">
        {DEMO_SCOUTS.map((scout) => (
          <Link key={scout.id} href={`/scouts/${scout.id}`} className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
                    {scout.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{scout.name}</h2>
                    <p className="text-xs text-gray-400">via {scout.channel}</p>
                  </div>
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>

                {/* Focus areas */}
                <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                  {scout.focus.map((f) => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Submissions</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{scout.submissions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">High Signal</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <TrendingUp size={11} /> {scout.high_signal}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Active</p>
                    <p className="text-sm text-gray-700 mt-0.5">{scout.last_active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Responsiveness</p>
                    <ResponsivenessBar value={scout.responsiveness} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-6 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <MessageSquare size={11} /> Check-in
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <ExternalLink size={11} /> Submissions
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
