export default function AnalyticsPage() {
  const stats = [
    { label: "Total Signals", value: "84", sub: "this month" },
    { label: "New Deals", value: "39", sub: "this month" },
    { label: "Needs Info", value: "18", sub: "active" },
    { label: "Intro Requested", value: "7", sub: "pending" },
  ];

  const categories = [
    { label: "AI Agents", count: 22, pct: 56 },
    { label: "Developer Tools", count: 14, pct: 36 },
    { label: "Healthcare AI", count: 11, pct: 28 },
    { label: "Fintech", count: 9, pct: 23 },
  ];

  const bottlenecks = [
    { label: "Deck missing", count: 12 },
    { label: "Traction unclear", count: 17 },
    { label: "Founder intro missing", count: 9 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Scout network performance · May 2026</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Categories</h2>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700">{c.label}</span>
                  <span className="text-xs text-gray-500">{c.count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Bottlenecks</h2>
          <div className="space-y-3">
            {bottlenecks.map((b) => (
              <div key={b.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{b.label}</span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
