"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquare, ExternalLink, TrendingUp, X, CheckCircle2, AlertCircle } from "lucide-react";

const FOCUS_OPTIONS = ["AI", "Developer Tools", "Fintech", "Healthcare", "Consumer", "Logistics", "B2B SaaS", "EdTech", "Climate", "Deep Tech"];

function AddScoutSlideOver({ onClose, onSuccess }: { onClose: () => void; onSuccess: (email: string) => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", focus_areas: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleFocus(area: string) {
    setForm((f) => ({
      ...f,
      focus_areas: f.focus_areas.includes(area)
        ? f.focus_areas.filter((x) => x !== area)
        : [...f.focus_areas, area],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, invited_by: "Quanta Team" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      onSuccess(form.email);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 h-14 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Add Scout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Amit Sharma"
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="amit@example.com"
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">An invite email will be sent to this address.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((area) => {
                const active = form.focus_areas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocus(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </form>
        <div className="px-6 py-4 border-t border-gray-200 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit as unknown as React.MouseEventHandler}
            disabled={loading}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : "Send Invite"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteSentBanner({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
      <p className="text-sm text-emerald-800 flex-1">
        Invite sent to <span className="font-medium">{email}</span>. They'll receive a link to complete setup.
      </p>
      <button onClick={onClose} className="text-emerald-500 hover:text-emerald-700">
        <X size={14} />
      </button>
    </div>
  );
}

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
  const [showAddScout, setShowAddScout] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showAddScout && (
        <AddScoutSlideOver
          onClose={() => setShowAddScout(false)}
          onSuccess={(email) => { setShowAddScout(false); setInvitedEmail(email); }}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Scout Network</h1>
          <p className="text-sm text-gray-500 mt-0.5">{DEMO_SCOUTS.length} active scouts</p>
        </div>
        <button
          onClick={() => setShowAddScout(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          + Add Scout
        </button>
      </div>
      {invitedEmail && <InviteSentBanner email={invitedEmail} onClose={() => setInvitedEmail(null)} />}

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
