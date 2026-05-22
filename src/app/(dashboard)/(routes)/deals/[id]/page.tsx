"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, AlertCircle, MessageSquare, ArrowUpRight, Archive,
  Star, Loader2, Clock, FileText, StickyNote, ChevronDown,
  Sparkles, RefreshCw, Send, Check, X, Download, Play, Pause,
  Volume2, CheckCircle2, Mic, FileAudio,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  FunnelChart, Funnel, LabelList, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SignalItem { level: string; evidence: string }
interface DealAnswer { id: string; question: string; answer_text: string | null; answer_type: string }
interface ScoutNote { id: string; note_text: string | null; audio_url: string | null; note_type: string; created_at: string }
interface MissingTask { id: string; info_needed: string; expected_date: string | null; followup_date: string | null; status: string }
interface Deal {
  id: string; startup_name: string | null; one_line_description: string | null;
  category: string | null; stage: string | null; status: string; priority: string;
  scout_conviction: string | null; source_context: string | null; submission_mode: string | null;
  scout: { id: string; full_name: string; email: string } | null;
  founders: { id: string; full_name: string | null; linkedin_url: string | null; background_summary: string | null; email: string | null }[];
  signals: { founder_signal: SignalItem; market_signal: SignalItem; traction_signal: SignalItem; scout_conviction: SignalItem; risk_flags: string[] } | null;
  brief: { brief_title: string; what_it_does: string; why_it_may_matter: string; known_facts: string[]; open_questions: string[]; suggested_next_action: string } | null;
  missing_info_tasks: MissingTask[];
  messages: { sender_type: string; body: string; created_at: string }[];
  files: { id: string; file_name: string | null; file_type: string | null; storage_url: string | null; extracted_text: string | null; summary: string | null }[];
  partner_questions: { id: string; question_text: string; ai_rewritten_message: string | null; status: string; asked_at: string | null }[];
  internal_notes: { author_name: string | null; note: string; created_at: string }[];
  deal_answers: DealAnswer[];
  scout_notes: ScoutNote[];
}

interface Analysis {
  market_overview: string;
  market_size: { tam: string; sam: string; note: string };
  tailwinds: string[];
  headwinds: string[];
  comparable_companies: { name: string; similarity: string; differentiation: string; outcome: string }[];
  investment_thesis: string;
  key_diligence_questions: string[];
  verdict: "promising" | "neutral" | "concerning";
  verdict_reason: string;
  visualizations: { type: string; title: string; description: string; insight: string; data: Record<string, unknown>[] }[];
}

interface RecommendedMsg { question: string; reason: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  draft:           { label: "Draft",           dot: "bg-gray-300",   badge: "bg-gray-100 text-gray-500" },
  temp:            { label: "Temp",            dot: "bg-gray-200",   badge: "bg-gray-100 text-gray-400" },
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
  neutral:   "bg-amber-50 text-amber-800 border-amber-200",
  concerning:"bg-red-50 text-red-800 border-red-200",
};

const CHART_COLORS = ["#0f172a", "#374151", "#6b7280", "#9ca3af", "#d1d5db"];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function relTime(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return d < 1 ? "Today" : d < 2 ? "Yesterday" : `${Math.round(d)}d ago`;
}

// ─── File download helper ──────────────────────────────────────────────────────
async function downloadFile(storageUrl: string, fileName: string): Promise<string | null> {
  // Placeholder / demo files — no real file exists
  if (!storageUrl || storageUrl.startsWith("placeholder://") || storageUrl === "#") {
    return "This file is a demo placeholder — no real file was uploaded.";
  }

  const res = await fetch(`/api/storage/signed-url?url=${encodeURIComponent(storageUrl)}`);
  const data = await res.json();

  if (!res.ok || !data.signed_url) {
    return data.error ?? "Could not generate download link.";
  }

  const a = document.createElement("a");
  a.href = data.signed_url;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return null; // null = success
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeFileName(value: string | null | undefined) {
  return (value ?? "startup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "startup";
}

function downloadDoc(text: string, filename: string, title: string) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; margin: 40px; }
    h1 { font-size: 22px; margin: 0 0 18px; }
    pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(text)}</pre>
</body>
</html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Audio player component ────────────────────────────────────────────────────
function AudioPlayer({ storageUrl, label }: { storageUrl: string; label: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect placeholder before even trying
  const isPlaceholder = !storageUrl || storageUrl.startsWith("placeholder://") || storageUrl === "#";

  async function loadAndPlay() {
    if (isPlaceholder) { setAudioError("Demo placeholder — no real audio file."); return; }
    if (signedUrl) {
      if (playing) { audioRef.current?.pause(); setPlaying(false); }
      else { audioRef.current?.play(); setPlaying(true); }
      return;
    }
    setLoading(true);
    setAudioError(null);
    const res = await fetch(`/api/storage/signed-url?url=${encodeURIComponent(storageUrl)}`);
    const data = await res.json();
    if (!res.ok || !data.signed_url) {
      setAudioError(data.error ?? "Could not load audio.");
      setLoading(false);
      return;
    }
    setSignedUrl(data.signed_url);
    setLoading(false);
  }

  useEffect(() => {
    if (signedUrl && audioRef.current) {
      audioRef.current.src = signedUrl;
      audioRef.current.play().then(() => setPlaying(true));
      audioRef.current.onended = () => setPlaying(false);
    }
  }, [signedUrl]);

  if (audioError) return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <Volume2 size={12} className="text-amber-400" />
      <span className="text-xs text-amber-700 flex-1">{label}</span>
      <span className="text-xs text-amber-500">{audioError}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-gray-950 flex items-center justify-center shrink-0">
        <Volume2 size={12} className="text-white" />
      </div>
      <span className="text-xs text-gray-700 flex-1 truncate">{label}</span>
      <button onClick={loadAndPlay} disabled={loading || isPlaceholder}
        className={`flex items-center gap-1 text-xs font-medium ${isPlaceholder ? "text-gray-300 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-800"}`}>
        {loading ? <Loader2 size={12} className="animate-spin" /> : playing ? <Pause size={12} /> : <Play size={12} />}
        {playing ? "Pause" : "Play"}
      </button>
      {signedUrl && (
        <button onClick={async () => {
          const err = await downloadFile(storageUrl, label);
          if (err) alert(err);
        }} className="text-gray-400 hover:text-gray-600 p-1" title="Download">
          <Download size={11} />
        </button>
      )}
      {signedUrl && <audio ref={audioRef} className="hidden" />}
    </div>
  );
}

// ─── Status picker dropdown ────────────────────────────────────────────────────
const STATUS_FLOW = ["submitted","needs_info","under_review","intro_requested","monitor","archived"];

function StatusPicker({ dealId, current, onUpdate }: { dealId: string; current: string; onUpdate: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[current] ?? STATUS_CONFIG.draft;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function choose(status: string) {
    setOpen(false); setSaving(true);
    await fetch(`/api/internal/deals/${dealId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    onUpdate(status); setSaving(false);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        {saving ? <Loader2 size={10} className="animate-spin" /> : <ChevronDown size={10} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-40">
          {STATUS_FLOW.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => choose(s)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${s === current ? "font-semibold" : ""}`}>
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

// ─── Recharts visualization renderer ─────────────────────────────────────────
function ChartBlock({ viz }: { viz: Analysis["visualizations"][0] }) {
  if (!viz.data || viz.data.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-950 mb-0.5">{viz.title}</p>
      <p className="text-xs text-gray-400 mb-1">{viz.description}</p>

      {viz.type === "bar" && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={viz.data as { label: string; value: number }[]} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {(viz.data as { label: string; value: number }[]).map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {viz.type === "radar" && (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={viz.data as { category: string; score: number }[]}>
            <PolarGrid stroke="#f3f4f6" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickCount={3} />
            <Radar dataKey="score" stroke="#0f172a" fill="#0f172a" fillOpacity={0.12} strokeWidth={2} dot={{ fill: "#0f172a", r: 3 }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {viz.type === "funnel" && (
        <ResponsiveContainer width="100%" height={160}>
          <FunnelChart>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Funnel dataKey="value" data={viz.data as { stage: string; value: number }[]} isAnimationActive>
              {(viz.data as { stage: string; value: number }[]).map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
              <LabelList dataKey="stage" position="inside" style={{ fontSize: 11, fill: "white", fontWeight: 500 }} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      )}

      <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
        <p className="text-xs text-gray-600"><span className="font-medium">Key insight: </span>{viz.insight}</p>
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

  // Analyze tab
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisCached, setAnalysisCached] = useState(false);

  // Interaction tab — compose area (no modal)
  const [composeText, setComposeText] = useState("");
  const [rewrittenMsg, setRewrittenMsg] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");
  const [recommended, setRecommended] = useState<RecommendedMsg[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  // Missing tasks
  const [tasks, setTasks] = useState<MissingTask[]>([]);

  // Priority
  const [priority, setPriority] = useState("normal");
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/internal/deals/${dealId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: Deal) => { setDeal(d); setPriority(d.priority); setTasks(d.missing_info_tasks); })
      .catch(() => router.push("/deals"))
      .finally(() => setLoading(false));
  }, [dealId, router]);

  useEffect(() => {
    if (tab !== "analyze" || analysis) return;
    fetch(`/api/internal/deals/${dealId}/analyze`)
      .then((r) => r.json())
      .then((d) => { if (d.cached) { setAnalysis(d.analysis as Analysis); setAnalysisCached(true); } });
  }, [tab, dealId, analysis]);

  useEffect(() => {
    if (tab !== "interaction" || recommended.length > 0) return;
    setRecLoading(true);
    fetch(`/api/internal/deals/${dealId}/recommended-messages`)
      .then((r) => r.json())
      .then((d) => setRecommended(d.messages ?? []))
      .finally(() => setRecLoading(false));
  }, [tab, dealId, recommended.length]);

  async function runAnalysis() {
    setAnalysisLoading(true); setAnalysis(null);
    const res = await fetch(`/api/internal/deals/${dealId}/analyze`, { method: "POST" });
    setAnalysis(await res.json() as Analysis);
    setAnalysisCached(false);
    setAnalysisLoading(false);
  }

  async function addNote() {
    if (!noteInput.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/internal/deals/${dealId}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteInput, author_name: "Quanta Team" }),
    });
    const n = await res.json();
    setDeal((prev) => prev ? { ...prev, internal_notes: [n, ...prev.internal_notes] } : prev);
    setNoteInput(""); setSavingNote(false);
  }

  async function updateStatus(status: string) {
    setDeal((prev) => prev ? { ...prev, status } : prev);
  }

  async function togglePriority() {
    const next = priority === "high" ? "normal" : "high";
    await fetch(`/api/internal/deals/${dealId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority: next }),
    });
    setPriority(next);
  }

  async function markTaskDone(taskId: string) {
    await fetch(`/api/internal/deals/${dealId}/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }),
    });
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "completed" } : t));
  }

  function useRecommendedQuestion(question: string) {
    setComposeText(question);
    setRewrittenMsg("");
    setTab("interaction");
    setTimeout(() => composeRef.current?.focus(), 100);
  }

  async function rewriteQuestion() {
    if (!composeText.trim() || !deal) return;
    setRewriting(true); setRewrittenMsg("");
    const res = await fetch(`/api/internal/deals/${dealId}/ask-scout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: composeText, partner_name: "Quanta Team" }),
    });
    const data = await res.json();
    setRewrittenMsg(data.sent_message ?? "");
    setRewriting(false);
  }

  async function sendQuestion() {
    const msg = rewrittenMsg || composeText;
    if (!msg.trim()) return;
    setSending(true);
    setDeal((prev) => prev ? {
      ...prev,
      partner_questions: [{ id: Date.now().toString(), question_text: composeText, ai_rewritten_message: rewrittenMsg || null, status: "sent", asked_at: new Date().toISOString() }, ...prev.partner_questions],
      messages: [...prev.messages, { sender_type: "quanta", body: msg, created_at: new Date().toISOString() }],
    } : prev);
    setSentMsg(msg);
    setComposeText(""); setRewrittenMsg("");
    setSending(false);
    setTimeout(() => setSentMsg(""), 3000);
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  if (!deal) return null;

  const cfg = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.draft;
  const audioFiles = deal.files.filter((f) => f.file_type?.startsWith("audio/"));
  const docFiles = deal.files.filter((f) => !f.file_type?.startsWith("audio/"));
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
            {deal.submission_mode && <>{" · "}<span className="capitalize">{deal.submission_mode} submission</span></>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button onClick={togglePriority}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium border rounded-lg transition-colors ${priority === "high" ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Star size={12} /> {priority === "high" ? "High Priority" : "Set Priority"}
          </button>
          <button onClick={() => setTab("interaction")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white bg-gray-950 hover:bg-gray-800 rounded-lg transition-colors">
            <MessageSquare size={12} /> Ask Scout
          </button>
          <button onClick={() => updateStatus("intro_requested")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
            <ArrowUpRight size={12} /> Request Intro
          </button>
          <button onClick={() => updateStatus("archived")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            <Archive size={12} />
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

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
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
                  {(["founder_signal","market_signal","traction_signal","scout_conviction"] as const).map((key) => {
                    const sig = deal.signals![key];
                    const label = key.replace("_signal","").replace("scout_","Scout ").replace(/\b\w/g, l => l.toUpperCase());
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

            {/* Scout Q&A — structured display with rating pulled out */}
            {deal.deal_answers.filter((a) => a.answer_type !== "skipped" && a.answer_text).length > 0 && (() => {
              const answered = deal.deal_answers.filter((a) => a.answer_type !== "skipped" && a.answer_text);
              const ratingAnswer = answered.find((a) => a.question === "Investment Rating (1-4)");
              const ratingReasonAnswer = answered.find((a) => a.question === "Rating Reason");
              const anythingElseAnswer = answered.find((a) => a.question === "Anything else valuable");
              const ratingValue = ratingAnswer ? parseInt(ratingAnswer.answer_text ?? "0") : 0;

              const RATING_STYLES: Record<number, { label: string; badge: string }> = {
                1: { label: "Not a fit",       badge: "bg-gray-100 text-gray-600" },
                2: { label: "Worth exploring", badge: "bg-blue-50 text-blue-700" },
                3: { label: "Strong lead",     badge: "bg-amber-50 text-amber-700" },
                4: { label: "Must invest",     badge: "bg-emerald-50 text-emerald-700" },
              };

              const structured = answered.filter((a) =>
                !["Investment Rating (1-4)", "Rating Reason", "Anything else valuable"].includes(a.question)
              );

              return (
                <div className="space-y-4">
                  {/* Investment rating card — shown prominently */}
                  {ratingValue > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-3xl font-bold w-12 h-12 rounded-xl flex items-center justify-center ${RATING_STYLES[ratingValue]?.badge}`}>
                          {ratingValue}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scout Rating</p>
                          <p className={`text-base font-semibold ${RATING_STYLES[ratingValue]?.badge.replace("bg-", "text-").replace("-50", "-700").replace("bg-gray-100", "text-gray-700")}`}>
                            {RATING_STYLES[ratingValue]?.label}
                          </p>
                        </div>
                      </div>
                      {ratingReasonAnswer?.answer_text && (
                        <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-3">
                          {ratingReasonAnswer.answer_text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Structured Q&A answers */}
                  {structured.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <h2 className="text-sm font-semibold text-gray-950 mb-3">Scout Q&amp;A</h2>
                      <div className="space-y-3">
                        {structured.map((a) => (
                          <div key={a.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                            <p className="text-xs font-medium text-gray-400 mb-1">{a.question}</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{a.answer_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anything else */}
                  {anythingElseAnswer?.answer_text && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Scout&apos;s additional notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{anythingElseAnswer.answer_text}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Voice pitch audio player */}
            {audioFiles.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-950 mb-3 flex items-center gap-2">
                  <Mic size={14} className="text-gray-400" /> Elevator Pitch Recording
                </h2>
                <div className="space-y-2">
                  {audioFiles.map((f) => f.storage_url && (
                    <div key={f.id} className="space-y-2">
                      <AudioPlayer storageUrl={f.storage_url} label={f.file_name ?? "Voice pitch"} />
                      {f.extracted_text && (
                        <button onClick={() => downloadDoc(
                          f.extracted_text!,
                          `transcript-${safeFileName(deal.startup_name)}.doc`,
                          `${deal.startup_name ?? "Startup"} transcript`,
                        )}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800">
                          <Download size={11} /> Download transcript
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                <p className="text-xs text-gray-400 text-center py-2">No notes yet.</p>
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

          {/* ── Right sidebar ── */}
          <div className="space-y-4">
            {/* Founders as cards */}
            {deal.founders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {deal.founders.length === 1 ? "Founder" : "Founders"}
                </p>
                {deal.founders.map((f, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {f.full_name?.charAt(0) ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-950">{f.full_name ?? "—"}</p>
                        {f.email && <p className="text-xs text-gray-400">{f.email}</p>}
                        {f.linkedin_url && (
                          <a href={f.linkedin_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                        {f.background_summary && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{f.background_summary}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Missing info tasks — with context about how it works */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Missing Info</p>
                {completedTasks.length > 0 && (
                  <span className="text-xs text-emerald-600">{completedTasks.length} resolved</span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                Items flagged by AI extraction, document analysis, or scout commitments. Click ✓ to mark resolved.
              </p>
              {pendingTasks.length === 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 size={12} /> Nothing missing
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 group">
                      <button onClick={() => markTaskDone(t.id)}
                        className="w-4 h-4 rounded border border-gray-300 mt-0.5 shrink-0 hover:bg-emerald-50 hover:border-emerald-400 flex items-center justify-center transition-colors group-hover:border-emerald-400">
                        <Check size={9} className="text-gray-300 group-hover:text-emerald-500" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800">{t.info_needed}</p>
                        {t.expected_date
                          ? <p className="text-[10px] text-amber-600">Expected {t.expected_date}</p>
                          : <p className="text-[10px] text-gray-400">No date committed</p>
                        }
                      </div>
                      <AlertCircle size={10} className="text-amber-400 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document files */}
            {docFiles.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Files</p>
                <div className="space-y-2">
                  {docFiles.map((f) => (
                    <div key={f.id} className="flex items-start gap-2">
                      <FileText size={13} className="text-gray-300 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{f.file_name}</p>
                        {f.summary && <p className="text-[10px] text-gray-400 mt-0.5">{f.summary}</p>}
                      </div>
                      {f.storage_url && (
                        <button onClick={async () => {
                          const err = await downloadFile(f.storage_url!, f.file_name ?? "file");
                          if (err) alert(err);
                        }}
                          className="text-gray-300 hover:text-indigo-600 shrink-0 p-1 transition-colors">
                          <Download size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ANALYZE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "analyze" && (
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Market Analysis</h2>
              <p className="text-xs text-gray-400 mt-0.5">AI-generated · Not live research — sources cited where known. Verify independently.</p>
            </div>
            <button onClick={runAnalysis} disabled={analysisLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-gray-950 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50 transition-colors">
              {analysisLoading ? <><Loader2 size={12} className="animate-spin" /> Analyzing…</>
                : analysis ? <><RefreshCw size={12} /> Refresh</>
                : <><Sparkles size={12} /> Run Analysis</>}
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
              <p className="text-xs text-gray-400">Click "Run Analysis" for market research, sourced TAM/SAM, comparable companies, and AI-chosen charts.</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Verdict */}
              <div className={`border rounded-xl p-4 ${VERDICT_STYLE[analysis.verdict] ?? VERDICT_STYLE.neutral}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wide capitalize">{analysis.verdict}</span>
                  {analysisCached && <span className="text-xs opacity-60">(cached — click Refresh to re-run)</span>}
                </div>
                <p className="text-sm">{analysis.verdict_reason}</p>
              </div>

              {/* Visualizations (AI-chosen charts) */}
              {(analysis.visualizations ?? []).filter((v) => v.data?.length > 0).map((viz, i) => (
                <ChartBlock key={i} viz={viz} />
              ))}

              {/* Market overview + sourced TAM/SAM */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Market Overview</p>
                <p className="text-sm text-gray-700 mb-4">{analysis.market_overview}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">TAM (Total Addressable Market)</p>
                    <p className="text-sm text-gray-800 font-medium">{analysis.market_size.tam}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">SAM (Serviceable Addressable Market)</p>
                    <p className="text-sm text-gray-800 font-medium">{analysis.market_size.sam}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">Assumption: {analysis.market_size.note}</p>
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

              {/* Comparable companies */}
              {analysis.comparable_companies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comparable Companies</p>
                  <div className="space-y-3">
                    {analysis.comparable_companies.map((c, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-950">{c.name}</p>
                          <span className="text-xs text-gray-400 shrink-0">{c.outcome}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium text-gray-700">Why comparable:</span> {c.similarity}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium text-gray-700">Differentiation:</span> {c.differentiation}
                        </p>
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

      {/* ══════════════════════════════════════════════════════════════════════
          INTERACTION TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "interaction" && (
        <div className="grid grid-cols-2 gap-5">
          {/* Left: compose + suggested */}
          <div className="space-y-4">
            {/* Compose area */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-950 mb-3">Ask Scout</h2>
              <textarea
                ref={composeRef}
                value={composeText}
                onChange={(e) => { setComposeText(e.target.value); setRewrittenMsg(""); }}
                placeholder="Type a question or click a suggestion below…"
                className="w-full h-24 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 mb-3"
              />

              {/* Rewritten preview */}
              {rewrittenMsg && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
                  <p className="text-xs font-medium text-indigo-600 mb-1">AI rewritten for scout:</p>
                  <p className="text-sm text-indigo-900">{rewrittenMsg}</p>
                  <button onClick={() => setRewrittenMsg("")}
                    className="text-xs text-indigo-400 hover:text-indigo-600 mt-1.5">Clear and rewrite</button>
                </div>
              )}

              {sentMsg && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
                  <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Sent via OpenClaw
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={rewriteQuestion} disabled={!composeText.trim() || rewriting}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  {rewriting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Rewrite
                </button>
                <button onClick={sendQuestion} disabled={(!composeText.trim() && !rewrittenMsg) || sending}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors">
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send
                </button>
              </div>
            </div>

            {/* AI Suggested questions — click fills the compose area */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggested Questions</p>
                {recLoading && <Loader2 size={11} className="animate-spin text-gray-400" />}
              </div>
              <div className="space-y-2">
                {recommended.map((m, i) => (
                  <button key={i} onClick={() => useRecommendedQuestion(m.question)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                    <p className="text-xs text-gray-800 mb-1">{m.question}</p>
                    <p className="text-[10px] text-gray-400">{m.reason}</p>
                    <p className="text-[10px] text-indigo-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to use in compose area →
                    </p>
                  </button>
                ))}
                {!recLoading && recommended.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">No suggestions yet.</p>
                )}
              </div>
            </div>

            {/* Sent questions history */}
            {deal.partner_questions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sent Questions</p>
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
            <h2 className="text-sm font-semibold text-gray-950 mb-3">Conversation Thread</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
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
                    <p className="leading-relaxed">{msg.body}</p>
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
