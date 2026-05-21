"use client";

import { useEffect, useState } from "react";

interface Analytics {
  totals: { signals: number; new_deals: number; needs_info: number; intro_requested: number };
  top_categories: { category: string; count: number }[];
  bottlenecks: { label: string; count: number }[];
  top_scouts: { name: string; deals: number; high_signal: number }[];
}

function Bar({ pct, className = "bg-gray-950" }: { pct: number; className?: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(pct, 100)}%`, transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/internal/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const totals = data?.totals;
  const maxCategory = Math.max(...(data?.top_categories.map((c) => c.count) ?? [1]));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-950">Analytics</h1>
        <p className="text-xs text-gray-400 mt-0.5">Scout network performance</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total signals", value: totals?.signals },
          { label: "New deals", value: totals?.new_deals },
          { label: "Needs info", value: totals?.needs_info },
          { label: "Intro requested", value: totals?.intro_requested },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-950">{s.value ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Top categories */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Top Categories</p>
          <div className="space-y-3">
            {(data?.top_categories ?? []).map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700">{c.category}</span>
                  <span className="text-xs font-semibold text-gray-950">{c.count}</span>
                </div>
                <Bar pct={(c.count / maxCategory) * 100} />
              </div>
            ))}
            {!data && [1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1">
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-6" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Bottlenecks</p>
          <div className="space-y-3">
            {(data?.bottlenecks ?? []).map((b) => (
              <div key={b.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{b.label}</span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top scouts */}
      {(data?.top_scouts ?? []).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Top Scouts by Signal Quality</p>
          <div className="space-y-2">
            {data?.top_scouts.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {s.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-800">{s.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{s.deals} deals</span>
                  <span className="text-emerald-600 font-medium">{s.high_signal} high signal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
