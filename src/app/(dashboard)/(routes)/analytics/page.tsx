"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";

interface Analytics {
  totals: { signals: number; new_deals: number; needs_info: number; intro_requested: number };
  pipeline: { status: string; label: string; count: number }[];
  top_categories: { category: string; count: number }[];
  bottlenecks: { label: string; count: number }[];
  top_scouts: { name: string; deals: number; high_signal: number }[];
  weekly_activity: { week: string; deals: number }[];
}

const PIPELINE_COLORS: Record<string, string> = {
  submitted:       "#6366f1",
  needs_info:      "#f59e0b",
  under_review:    "#8b5cf6",
  intro_requested: "#10b981",
  monitor:         "#94a3b8",
  archived:        "#d1d5db",
  rejected:        "#f87171",
};

const CATEGORY_COLORS = ["#0f172a", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"];

const STAT_LABELS: Record<keyof Analytics["totals"], string> = {
  signals: "Total deals",
  new_deals: "Submitted",
  needs_info: "Needs info",
  intro_requested: "Intro requested",
};

// ─── Custom tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-gray-500">{payload[0].value} deal{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Empty illustration ────────────────────────────────────────────────────
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-30">
        <rect x="4" y="28" width="8" height="16" rx="2" fill="#9ca3af" />
        <rect x="16" y="20" width="8" height="24" rx="2" fill="#9ca3af" />
        <rect x="28" y="12" width="8" height="32" rx="2" fill="#9ca3af" />
        <rect x="40" y="6" width="8" height="38" rx="2" fill="#9ca3af" />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="h-7 bg-gray-100 rounded w-12 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl p-5 h-64" />
        <div className="bg-white border border-gray-100 rounded-xl p-5 h-64" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/internal/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto"><Skeleton /></div>
  );

  const totals = data?.totals;
  const hasActivity = (data?.weekly_activity ?? []).some((w) => w.deals > 0);
  const hasPipeline = (data?.pipeline ?? []).length > 0;
  const hasCategories = (data?.top_categories ?? []).length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Analytics</h1>
        <p className="text-xs text-gray-400 mt-0.5">Scout network performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(STAT_LABELS) as (keyof Analytics["totals"])[]).map((key) => (
          <div key={key} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-950">{totals?.[key] ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{STAT_LABELS[key]}</p>
          </div>
        ))}
      </div>

      {/* Weekly activity area chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-950 mb-4">Deal submissions — last 8 weeks</p>
        {hasActivity ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.weekly_activity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="dealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="deals" stroke="#0f172a" strokeWidth={2} fill="url(#dealGrad)" dot={{ r: 3, fill: "#0f172a" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No deals submitted in the last 8 weeks." />
        )}
      </div>

      {/* Pipeline + Category side by side */}
      <div className="grid grid-cols-2 gap-5">
        {/* Pipeline funnel bar chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Pipeline</p>
          {hasPipeline ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.pipeline} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={96} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {(data?.pipeline ?? []).map((entry) => (
                    <Cell key={entry.status} fill={PIPELINE_COLORS[entry.status] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No deals in the pipeline yet." />
          )}
        </div>

        {/* Category donut chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">By Category</p>
          {hasCategories ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data?.top_categories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={72}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {(data?.top_categories ?? []).map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(data?.top_categories ?? []).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-gray-700 truncate">{c.category}</span>
                    </div>
                    <span className="font-semibold text-gray-950 ml-2 shrink-0">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="No category data yet." />
          )}
        </div>
      </div>

      {/* Scouts + Bottlenecks */}
      <div className="grid grid-cols-2 gap-5">
        {/* Top scouts bar chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Top Scouts</p>
          {(data?.top_scouts ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.top_scouts} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="deals" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No scout data yet." />
          )}
        </div>

        {/* Bottlenecks */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-950 mb-4">Bottlenecks</p>
          {(data?.bottlenecks ?? []).length > 0 ? (
            <div className="space-y-3">
              {(data?.bottlenecks ?? []).map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate mr-2">{b.label}</span>
                    <span className="text-xs font-semibold text-amber-600 shrink-0">{b.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${Math.min((b.count / Math.max(...(data?.bottlenecks ?? []).map((x) => x.count), 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 opacity-30">
                <circle cx="20" cy="20" r="16" stroke="#9ca3af" strokeWidth="2" />
                <path d="M14 20l4 4 8-8" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-400">No bottlenecks — all clear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
