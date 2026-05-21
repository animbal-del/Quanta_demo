"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare, TrendingUp, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const FOCUS_OPTIONS = ["AI", "Developer Tools", "Fintech", "Healthcare", "Consumer", "Logistics", "B2B SaaS", "EdTech", "Climate", "Deep Tech"];

interface Scout {
  id: string; full_name: string; email: string; preferred_channel: string;
  status: string; focus_areas: string[]; responsiveness_score: number;
  last_active_at: string | null; last_email_sent_at: string | null;
  last_email_responded_at: string | null; deal_count: number; high_signal_count: number;
}

function relativeTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.round(diff)}d ago`;
}

function ResponsivenessBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

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
    if (!form.full_name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
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
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-13 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-950">Add Scout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Amit Sharma"
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="amit@example.com"
              className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
            <p className="text-xs text-gray-400 mt-1">An invite email is sent automatically.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_OPTIONS.map((area) => {
                const active = form.focus_areas.includes(area);
                return (
                  <button key={area} type="button" onClick={() => toggleFocus(area)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {area}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={submit as unknown as React.MouseEventHandler} disabled={loading}
            className="flex-1 h-9 bg-gray-950 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors">
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScoutsPage() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/internal/scouts")
      .then((r) => r.json())
      .then(setScouts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showAdd && (
        <AddScoutSlideOver
          onClose={() => setShowAdd(false)}
          onSuccess={(email) => { setShowAdd(false); setInvitedEmail(email); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Scout Network</h1>
          <p className="text-xs text-gray-400 mt-0.5">{scouts.length} scouts</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-8 px-4 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
          + Add Scout
        </button>
      </div>

      {invitedEmail && (
        <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 flex-1">Invite sent to <span className="font-medium">{invitedEmail}</span>.</p>
          <button onClick={() => setInvitedEmail(null)} className="text-emerald-400 hover:text-emerald-600"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-32" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {scouts.map((scout) => {
            const inactive = scout.last_active_at
              ? (Date.now() - new Date(scout.last_active_at).getTime()) / 86400000 > 14
              : true;
            return (
              <Link key={scout.id} href={`/scouts/${scout.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                      {scout.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-950">{scout.full_name}</p>
                        {inactive && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-400">{scout.email} · {scout.preferred_channel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden md:flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-semibold text-gray-950">{scout.deal_count}</p>
                        <p className="text-gray-400">Deals</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-600">{scout.high_signal_count}</p>
                        <p className="text-gray-400">High signal</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Response</p>
                        <ResponsivenessBar value={scout.responsiveness_score} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">{relativeTime(scout.last_active_at)}</p>
                        <p className="text-gray-400">Last active</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => e.preventDefault()}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <MessageSquare size={13} />
                      </button>
                      <button onClick={(e) => e.preventDefault()}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <TrendingUp size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Focus areas */}
                {scout.focus_areas.length > 0 && (
                  <div className="flex gap-1.5 mt-3 ml-12 flex-wrap">
                    {scout.focus_areas.slice(0, 5).map((f) => (
                      <span key={f} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
