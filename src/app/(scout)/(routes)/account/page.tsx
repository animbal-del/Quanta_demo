"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, LogOut, Mail, Phone, Zap, Edit3, Check, X,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ScoutSession {
  role: string | null; 
  email: string | null; display_name: string; scout_id: string | null;
  scout: {
    id: string; full_name: string; email: string | null; focus_areas: string[];
    responsiveness_score: number; preferred_channel: string | null;
    last_active_at: string | null;
  } | null;
}

const FOCUS_OPTIONS = ["AI", "Developer Tools", "Fintech", "Healthcare", "Consumer", "Logistics", "B2B SaaS", "EdTech", "Climate", "Deep Tech"];

function EditableText({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  function save() { onSave(draft); setEditing(false); }
  if (editing) return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
          className="flex-1 h-8 border border-gray-200 rounded-lg px-2 text-sm focus:outline-none focus:border-gray-400" />
        <button onClick={save} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={13} /></button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={13} /></button>
      </div>
    </div>
  );
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={() => { setDraft(value); setEditing(true); }}>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-300 italic">not set</span>}</p>
      </div>
      <Edit3 size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
    </div>
  );
}

export default function ScoutProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<ScoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s: ScoutSession) => { setSession(s); setFocusAreas(s.scout?.focus_areas ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function saveFocusAreas() {
    if (!session?.scout_id) return;
    setSaving(true);
    await fetch(`/api/internal/scouts/${session.scout_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focus_areas: focusAreas }),
    }).catch(() => null);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleFocus(area: string) {
    setFocusAreas((prev) => prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
  );

  const scout = session?.scout;
  const initials = session?.display_name?.charAt(0)?.toUpperCase() ?? "S";

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></Link>
        <h1 className="text-base font-semibold text-gray-950 flex-1">My Profile</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Avatar card */}
        <div className="bg-gray-950 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-semibold">{session?.display_name ?? "Scout"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap size={11} className="text-white/40" />
              <span className="text-white/50 text-xs">Scout · {scout?.preferred_channel ?? "Web"}</span>
              
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{session?.email ?? scout?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={14} className="text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">Managed via Supabase Auth</p>
          </div>
        </div>

        {/* Focus areas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Focus Areas</p>
            <button onClick={saveFocusAreas} disabled={saving}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                saved ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              }`}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_OPTIONS.map((area) => {
              const active = focusAreas.includes(area);
              return (
                <button key={area} onClick={() => toggleFocus(area)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity stats */}
        {scout && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-950">{Math.round(scout.responsiveness_score * 100)}%</p>
                <p className="text-xs text-gray-400">Responsiveness</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-950">
                  {scout.last_active_at ? Math.round((Date.now() - new Date(scout.last_active_at).getTime()) / 86400000) + "d" : "—"}
                </p>
                <p className="text-xs text-gray-400">Last active</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={logout} disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-all">
          {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <><LogOut size={14} /> Sign out</>}
        </button>
      </div>
    </main>
  );
}
