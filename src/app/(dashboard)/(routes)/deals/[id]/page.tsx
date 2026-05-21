"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, AlertCircle, MessageSquare, ArrowUpRight, Archive,
  Star, Loader2, Clock, FileText, StickyNote, ChevronDown,
  Sparkles, RefreshCw, Plus, Send, Check, X,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SignalItem { level: string; evidence: string }
interface Deal {
  id: string; startup_name: string | null; one_line_description: string | null;
  category: string | null; stage: string | null; status: string; priority: string;
  scout_conviction: string | null; source_context: string | null; submission_mode: string | null;
  scout: { id: string; full_name: string; email: string } | null;
  founders: { full_name: string | null; linkedin_url: string | null; background_summary: string | null }[];
  signals: {
    founder_signal: SignalItem; market_signal: SignalItem;
    traction_signal: SignalItem; scout_conviction: SignalItem;
    risk_flags: string[];
  } | null;
  brief: {
    brief_title: string; what_it_does: string; why_it_may_matter: string;
    known_facts: string[]; open_questions: string[]; suggested_next_action: string;
  } | null;
  missing_info_tasks: { id: string; info_needed: string; expected_date: string | null; followup_date: string | null; status: string }[];
  messages: { sender_type: string; body: string; created_at: string }[];
  files: { file_name: string | null; summary: string | null }[];
  partner_questions: { question_text: string; ai_rewritten_message: string | null; status: string; asked_at: string | null }[];
  internal_notes: { author_name: string | null; note: string; created_at: string }[];
}

interface Analysis {
  market_overview: string;
  market_size: { tam: string; sam: string; note: string };
  tailwinds: string[];
  headwinds: string[];
  comparable_companies: { name: string; similarity: string; outcome: string }[];
  investment_thesis: string;
  key_diligence_questions: string[];
  verdict: "promising" | "neutral" | "concerning";
  verdict_reason: string;
}

interface RecommendedMsg { question: string; reason: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  draft:           { label: "Draft",           dot: "bg-gray-300",   badge: "bg-gray-100 text-gray-500" },
  submitted:       { label: "Submitted",       dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-700" },
  needs_info:      { label: "Needs Info",      dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700" },
  under_review:    { label: "Under Review",    dot: "bg-violet-400", badge: "bg-violet-50 text-violet-700" },
  intro_requested: { label: "Intro Requested", dot: "bg-emerald-400",badge: "bg-emerald-50 text-emerald-700" },
  monitor:         { label: "Monitor",         dot: "bg-slate-300",  badge: "bg-slate-100 text-slate-600" },
  archived:        { label: "Archived",        dot: "bg-gray-200",   badge: "bg-gray-100 text-gray-400" },
  rejected:        { label: "Rejected",        dot: "bg-red-300",    badge: "bg-red-50 text-red-600" },
};

const SIGNAL_COLOR: Record<string, string> = {
  strong: "text-emerald-600", high: "text-emerald-600",
  medium: "text-amber-600", early: "text-blue-600",
  weak: "text-red-500", unclear: "text-gray-400",
};

const VERDICT_STYLE: Record<string, string> = {
  promising: "bg-emerald-50 text-emerald-800 border-emerald-200",
  neutral: "bg-amber-50 text-amber-800 border-amber-200",
  concerning: "bg-red-50 text-red-800 border-red-200",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.round(diff)}d ago`;
}

// ─── Status picker dropdown ───────────────────────────────────────────────────
const STATUS_FLOW = ["submitted", "needs_info", "under_review", "intro_requested", "monitor", "archived"];

function StatusPicker({ dealId, current, onUpdate }: { dealId: string; current: string; onUpdate: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[current] ?? STATUS_CONFIG.draft;

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function choose(status: string) {
    setOpen(false);
    setSaving(true);
    await fetch(`/api/internal/deals/${dealId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onUpdate(status);
    setSaving(false);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        {saving ? <Loader2 size={10} className="animate-spin ml-0.5" /> : <ChevronDown size={10} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-40">
          {STATUS_FLOW.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => choose(s)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${s === current ? "font-semibold" : ""}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {c.label}
                {s === current && <Check size={10} className="ml-auto text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Ask Scout modal ───────────────────────────────────────────────────────────
function AskScoutModal({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [rewritten, setRewritten] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function rewrite() {
    setLoading(true);
    const res = await fetch(`/api/internal/deals/${dealId}/ask-scout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, partner_name: "Quanta Team" }),
    });
    const data = await res.json();
    setRewritten(data.sent_message ?? "");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-950 mb-1">Ask Scout</h2>
        <p className="text-xs text-gray-400 mb-4">Write your internal question — AI rewrites it for the scout.</p>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask who the 3 pilot customers are and whether the founder can intro us"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-gray-400" />
        {rewritten && (
          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs font-medium text-indigo-600 mb-1">AI will send:</p>
            <p className="text-sm text-indigo-900">{rewritten}</p>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 h-9 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          {!rewritten ? (
            <button onClick={rewrite} disabled={!question.trim() || loading}
              className="flex-1 h-9 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <Loader2 size={13} className="animate-spin" /> : "Rewrite with AI"}
            </button>
          ) : (
            <button onClick={() => { setSent(true); setTimeout(onClose, 1000); }}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
              {sent ? "Sent ✓" : "Send via OpenClaw"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DealDetailPage() {
  const { id: dealId } = useParams() as { id: string };
  const router = useRouter();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "analyze" | "interaction">("overview");
  const [askOpen, setAskOpen] = useState(false);

  // Analyze tab state
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisCached, setAnalysisCached] = useState(false);

  // Recommended messages state
  const [recommended, setRecommended] = useState<RecommendedMsg[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  // Internal note state
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Priority toggle
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    fetch(`/api/internal/deals/${dealId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: Deal) => { setDeal(d); setPriority(d.priority); })
      .catch(() => router.push("/deals"))
      .finally(() => setLoading(false));
  }, [dealId, router]);

  // Load cached analysis when Analyze tab is opened
  useEffect(() => {
    if (tab !== "analyze" || analysis) return;
    fetch(`/api/internal/deals/${dealId}/analyze`)
      .then((r) => r.json())
      .then((d) => { if (d.cached) { setAnalysis(d.analysis as Analysis); setAnalysisCached(true); } });
  }, [tab, dealId, analysis]);

  // Load recommended messages when Interaction tab is opened
  useEffect(() => {
    if (tab !== "interaction" || recommended.length > 0) return;
    setRecLoading(true);
    fetch(`/api/internal/deals/${dealId}/recommended-messages`)
      .then((r) => r.json())
      .then((d) => setRecommended(d.messages ?? []))
      .finally(() => setRecLoading(false));
  }, [tab, dealId, recommended.length]);

  async function runAnalysis() {
    setAnalysisLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch(`/api/internal/deals/${dealId}/analyze`, { method: "POST" });
      const data = await res.json();
      setAnalysis(data as Analysis);
      setAnalysisCached(false);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function addNote() {
    if (!noteInput.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/internal/deals/${dealId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteInput, author_name: "Quanta Team" }),
    });
    const newNote = await res.json();
    setDeal((prev) => prev ? { ...prev, internal_notes: [newNote, ...prev.internal_notes] } : prev);
    setNoteInput("");
    setSavingNote(false);
  }

  async function togglePriority() {
    const next = priority === "high" ? "normal" : "high";
    await fetch(`/api/internal/deals/${dealId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: next }),
    });
    setPriority(next);
  }

  function updateStatus(status: string) {
    setDeal((prev) => prev ? { ...prev, status } : prev);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={20} className="animate-spin text-gray-400" />
    </div>
  );
  if (!deal) return null;

  const cfg = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {askOpen && <AskScoutModal dealId={deal.id} onClose={() => setAskOpen(false)} />}

      {/* Back */}
      <Link href="/deals" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 w-fit">
        <ArrowLeft size={14} /> Back
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-950">{deal.startup_name ?? "Unnamed"}</h1>
            <StatusPicker dealId={deal.id} current={deal.status} onUpdate={updateStatus} />
            {deal.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{deal.category}</span>}
          </div>
          <p className="text-sm text-gray-500">{deal.one_line_description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {deal.scout && <>Scout: <span className="text-gray-600">{deal.scout.full_name}</span>{" · "}</>}
            {deal.source_context && <>{deal.source_context}{" · "}</>}
            {deal.stage}
          </p>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button onClick={togglePriority}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium border rounded-lg transition-colors ${
              priority === "high"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            <Star size={12} /> {priority === "high" ? "High Priority" : "Set Priority"}
          </button>
          <button onClick={() => setAskOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white bg-gray-950 hover:bg-gray-800 rounded-lg transition-colors">
            <MessageSquare size={12} /> Ask Scout
          </button>
          <button onClick={() => updateStatus("intro_requested")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
            <ArrowUpRight size={12} /> Request Intro
          </button>
          <button onClick={() => updateStatus("archived")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            <Archive size={12} /> Archive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["overview", "analyze", "interaction"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? "border-gray-950 text-gray-950" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {/* AI Brief */}
            {deal.brief ? (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-950 mb-3">AI Brief</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">What it does</p>
                    <p className="text-sm text-gray-700">{deal.brief.what_it_does}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Why it may matter</p>
                    <p className="text-sm text-gray-700">{deal.brief.why_it_may_matter}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Known facts</p>
                      <ul className="space-y-1">
                        {deal.brief.known_facts.map((f, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Open questions</p>
                      <ul className="space-y-1">
                        {deal.brief.open_questions.map((q, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />{q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Suggested next action</p>
                    <p className="text-xs text-gray-700">{deal.brief.suggested_next_action}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                AI brief generates after submission.
              </div>
            )}

            {/* Signals */}
            {deal.signals && (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-950 mb-3">Signals</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(["founder_signal", "market_signal", "traction_signal", "scout_conviction"] as const).map((key) => {
                    const sig = deal.signals![key];
                    const label = key.replace("_signal", "").replace("scout_", "Scout ").replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <div key={key} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400">{label}</p>
                          <span className={`text-xs font-semibold capitalize ${SIGNAL_COLOR[sig.level] ?? "text-gray-400"}`}>{sig.level}</span>
                        </div>
                        <p className="text-xs text-gray-600">{sig.evidence}</p>
                      </div>
                    );
                  })}
                </div>
                {deal.signals.risk_flags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-400 mb-2">Risk flags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {deal.signals.risk_flags.map((f) => (
                        <span key={f} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Internal notes */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-950 mb-3">Internal Notes</h2>
              <div className="flex gap-2 mb-3">
                <input value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                  placeholder="Add a note…"
                  className="flex-1 h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
                <button onClick={addNote} disabled={!noteInput.trim() || savingNote}
                  className="h-9 w-9 bg-gray-950 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 flex items-center justify-center">
                  {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
              {deal.internal_notes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {deal.internal_notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <StickyNote size={12} className="text-gray-300 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-700">{n.note}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.author_name} · {relTime(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {deal.founders.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Founder</p>
                {deal.founders.map((f, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-gray-950">{f.full_name ?? "—"}</p>
                    {f.background_summary && <p className="text-xs text-gray-500 mt-1">{f.background_summary}</p>}
                    {f.linkedin_url && (
                      <a href={f.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline mt-1 block">LinkedIn →</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Missing Info</p>
              {deal.missing_info_tasks.length === 0 ? (
                <p className="text-xs text-gray-400">Nothing missing.</p>
              ) : (
                <div className="space-y-2">
                  {deal.missing_info_tasks.map((t) => (
                    <div key={t.id} className="border border-gray-100 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle size={11} className="text-amber-400 shrink-0" />
                        <p className="text-xs font-medium text-gray-800">{t.info_needed}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {t.expected_date ? `Expected ${t.expected_date}` : "No date set"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {deal.files.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Files</p>
                <div className="space-y-2">
                  {deal.files.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FileText size={12} className="text-gray-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{f.file_name}</p>
                        {f.summary && <p className="text-xs text-gray-400">{f.summary}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYZE ── */}
      {tab === "analyze" && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Market Analysis</h2>
              <p className="text-xs text-gray-400 mt-0.5">AI-generated from GPT-4o training data. Not live research — verify independently.</p>
            </div>
            <button onClick={runAnalysis} disabled={analysisLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-gray-950 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50 transition-colors">
              {analysisLoading
                ? <><Loader2 size={12} className="animate-spin" /> Analyzing…</>
                : analysis
                ? <><RefreshCw size={12} /> Refresh</>
                : <><Sparkles size={12} /> Run Analysis</>
              }
            </button>
          </div>

          {analysisLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!analysis && !analysisLoading && (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Sparkles size={24} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">No analysis yet</p>
              <p className="text-xs text-gray-400">Click "Run Analysis" to generate market research, comps, and investment thesis.</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Verdict banner */}
              <div className={`border rounded-xl p-4 ${VERDICT_STYLE[analysis.verdict] ?? VERDICT_STYLE.neutral}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wide capitalize">{analysis.verdict}</span>
                  {analysisCached && <span className="text-xs opacity-60">(cached)</span>}
                </div>
                <p className="text-sm">{analysis.verdict_reason}</p>
              </div>

              {/* Market overview */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Market Overview</p>
                <p className="text-sm text-gray-700">{analysis.market_overview}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">TAM</p>
                    <p className="text-xs text-gray-700">{analysis.market_size.tam}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">SAM</p>
                    <p className="text-xs text-gray-700">{analysis.market_size.sam}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">Note: {analysis.market_size.note}</p>
              </div>

              {/* Tailwinds + Headwinds */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Tailwinds</p>
                  <ul className="space-y-1.5">
                    {analysis.tailwinds.map((t, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Headwinds</p>
                  <ul className="space-y-1.5">
                    {analysis.headwinds.map((h, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-300 mt-1.5 shrink-0" />{h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Comparables */}
              {analysis.comparable_companies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comparable Companies</p>
                  <div className="space-y-2">
                    {analysis.comparable_companies.map((c, i) => (
                      <div key={i} className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-950">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.similarity}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 ml-3">{c.outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment thesis */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Investment Thesis</p>
                <p className="text-sm text-gray-700">{analysis.investment_thesis}</p>
              </div>

              {/* Diligence questions */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Diligence Questions</p>
                <ul className="space-y-1.5">
                  {analysis.key_diligence_questions.map((q, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />{q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INTERACTION ── */}
      {tab === "interaction" && (
        <div className="grid grid-cols-2 gap-5">
          {/* Left: compose + recommended */}
          <div>
            <h2 className="text-sm font-semibold text-gray-950 mb-3">Ask Scout</h2>
            <textarea placeholder="Ask about pilot customer names, founder intro, deck…"
              className="w-full h-24 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 mb-2" />
            <button onClick={() => setAskOpen(true)}
              className="w-full h-9 bg-gray-950 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              Rewrite &amp; Send via OpenClaw
            </button>

            {/* Recommended messages */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggested Questions</p>
                {recLoading && <Loader2 size={11} className="animate-spin text-gray-400" />}
              </div>
              {recommended.length === 0 && !recLoading && (
                <p className="text-xs text-gray-400 text-center py-4">No suggestions generated yet.</p>
              )}
              <div className="space-y-2">
                {recommended.map((m, i) => (
                  <button key={i} onClick={() => setAskOpen(true)}
                    className="w-full text-left border border-gray-100 rounded-xl p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors group">
                    <p className="text-xs text-gray-700 mb-1">{m.question}</p>
                    <p className="text-xs text-gray-400">{m.reason}</p>
                    <p className="text-xs text-indigo-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Use this question →
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sent partner questions */}
            {deal.partner_questions.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sent</p>
                <div className="space-y-2">
                  {deal.partner_questions.map((pq, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-3">
                      <p className="text-xs text-gray-700">{pq.ai_rewritten_message ?? pq.question_text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${pq.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {pq.status}
                        </span>
                        {pq.asked_at && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={9} />{fmt(pq.asked_at)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: conversation thread */}
          <div>
            <h2 className="text-sm font-semibold text-gray-950 mb-3">Conversation</h2>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {deal.messages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No messages yet.</p>
              ) : deal.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_type === "scout" ? "justify-end" : "justify-start"}`}>
                  {msg.sender_type !== "scout" && (
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1.5 mt-auto shrink-0 text-[9px] font-bold text-gray-500">
                      {msg.sender_type === "ai" ? "AI" : "Q"}
                    </div>
                  )}
                  <div className={`max-w-xs rounded-2xl px-3 py-2 text-xs ${
                    msg.sender_type === "scout" ? "bg-gray-950 text-white rounded-br-sm"
                      : msg.sender_type === "quanta" ? "bg-violet-50 text-violet-900 border border-violet-100 rounded-bl-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "scout" ? "text-gray-400" : "text-gray-400"}`}>
                      {msg.sender_type === "scout" ? deal.scout?.full_name ?? "Scout"
                        : msg.sender_type === "quanta" ? "Quanta" : "AI"} · {fmt(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
