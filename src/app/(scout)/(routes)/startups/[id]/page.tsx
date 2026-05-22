"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Upload, Mic, Mail, AlertCircle,
  FileText, Loader2, MessageCircle, LayoutGrid, Clock, Edit3, X, Sparkles, Plus,
} from "lucide-react";

interface Message { sender_type: string; body: string; created_at: string }
interface MissingTask { id: string; info_needed: string; expected_date: string | null; status: string }
interface DealFile { file_name: string | null; summary: string | null }
interface DealAnswer { id: string; question: string; answer_text: string | null; answer_type: string }
interface Deal {
  id: string; startup_name: string | null; one_line_description: string | null;
  category: string | null; stage: string | null; status: string;
  messages: Message[]; missing_info_tasks: MissingTask[];
  files: DealFile[]; founders: { full_name: string | null; linkedin_url: string | null }[];
  deal_answers: DealAnswer[]; scout_notes: { note_text: string | null; created_at: string }[];
  partner_questions: { question_text: string; ai_rewritten_message: string | null; status: string }[];
}

const STATUS_BADGE: Record<string, string> = {
  needs_info: "bg-amber-50 text-amber-700", under_review: "bg-violet-50 text-violet-700",
  monitor: "bg-slate-50 text-slate-600", intro_requested: "bg-emerald-50 text-emerald-700",
  submitted: "bg-blue-50 text-blue-700", draft: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  needs_info: "Needs Info", under_review: "Under Review", monitor: "Monitoring",
  intro_requested: "Intro Requested", submitted: "Submitted", draft: "Draft",
};
const RATING_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "Not a fit",       color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-300"   },
  2: { label: "Worth exploring", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-300"   },
  3: { label: "Strong lead",     color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-400"  },
  4: { label: "Must invest",     color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-400"},
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Generate email modal with prompt ─────────────────────────────────────────
function GenerateEmailModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/startup/${deal.id}/generate-email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setEmail(data.email ?? "");
    } finally { setGenerating(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-4">
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-950">Generate Email to Founders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">What do you want to say?</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
            placeholder="Ask for the pitch deck and financials. Mention we're interested in their approach to the logistics market."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400" />
        </div>
        <button onClick={generate} disabled={!prompt.trim() || generating}
          className="w-full h-10 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {generating ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Sparkles size={13} /> Generate Email</>}
        </button>
        {email && (
          <>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-gray-200 max-h-48 overflow-y-auto">{email}</div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(email)}
                className="flex-1 h-9 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Copy</button>
              <a href={`mailto:?body=${encodeURIComponent(email)}`}
                className="flex-1 h-9 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-xl flex items-center justify-center">Open in Email</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Editable rating card ─────────────────────────────────────────────────────
function RatingCard({ dealId, rating, reason, onUpdate }: {
  dealId: string; rating: number; reason: string;
  onUpdate: (rating: number, reason: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dr, setDr] = useState(rating);
  const [drs, setDrs] = useState(reason);
  const cfg = RATING_CONFIG[rating];

  if (editing) return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Edit your rating</p>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((v) => {
          const c = RATING_CONFIG[v];
          return (
            <button key={v} onClick={() => setDr(v)}
              className={`flex items-center gap-2 border rounded-xl p-2.5 text-left transition-all ${dr === v ? `${c.bg} ${c.border} border-2` : "border-gray-200"}`}>
              <span className={`text-lg font-bold ${dr === v ? c.color : "text-gray-300"}`}>{v}</span>
              <span className={`text-xs font-semibold ${dr === v ? c.color : "text-gray-500"}`}>{c.label}</span>
            </button>
          );
        })}
      </div>
      <textarea value={drs} onChange={(e) => setDrs(e.target.value)} rows={3} placeholder="Why this rating?"
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400" />
      <div className="flex gap-2">
        <button onClick={() => { onUpdate(dr, drs); setEditing(false); }}
          className="flex-1 h-9 bg-gray-950 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Save</button>
        <button onClick={() => setEditing(false)}
          className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className={`border-2 rounded-xl p-4 ${cfg?.border ?? "border-gray-200"} ${cfg?.bg ?? "bg-gray-50"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your Investment Rating</p>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${cfg?.color ?? "text-gray-400"}`}>{rating}</span>
            <span className={`text-sm font-semibold ${cfg?.color ?? "text-gray-500"}`}>{cfg?.label}</span>
          </div>
        </div>
        <button onClick={() => { setDr(rating); setDrs(reason); setEditing(true); }}
          className="text-gray-400 hover:text-gray-700 p-1"><Edit3 size={14} /></button>
      </div>
      {reason && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{reason}</p>}
    </div>
  );
}

export default function StartupDetailPage() {
  const { id } = useParams() as { id: string };
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "interaction">("overview");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/internal/deals/${id}`).then((r) => r.json()).then(setDeal).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "interaction") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deal?.messages, tab]);

  // Editable overview state
  const [editingOverview, setEditingOverview] = useState(false);
  const [editFields, setEditFields] = useState({ startup_name: "", one_line_description: "", category: "", stage: "" });
  const [editFounders, setEditFounders] = useState<{ id?: string; full_name: string; linkedin_url: string; email: string }[]>([]);
  const [savingOverview, setSavingOverview] = useState(false);

  function startEditOverview() {
    if (!deal) return;
    setEditFields({
      startup_name: deal.startup_name ?? "",
      one_line_description: deal.one_line_description ?? "",
      category: deal.category ?? "",
      stage: deal.stage ?? "",
    });
    setEditFounders(deal.founders.map((f) => ({ id: (f as { id?: string }).id, full_name: f.full_name ?? "", linkedin_url: f.linkedin_url ?? "", email: (f as { email?: string }).email ?? "" })));
    setEditingOverview(true);
  }

  async function saveOverview() {
    if (!deal) return;
    setSavingOverview(true);
    await Promise.all([
      fetch(`/api/startup/${deal.id}/update`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      }),
      fetch(`/api/startup/${deal.id}/founders`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founders: editFounders }),
      }),
    ]);
    // Reload deal data
    const updated = await fetch(`/api/internal/deals/${deal.id}`).then((r) => r.json());
    setDeal(updated);
    setSavingOverview(false);
    setEditingOverview(false);
  }

  const ratingAnswer = deal?.deal_answers.find((a) => a.question === "Investment Rating (1-4)");
  const ratingReasonAnswer = deal?.deal_answers.find((a) => a.question === "Rating Reason");
  const investmentRating = ratingAnswer ? parseInt(ratingAnswer.answer_text ?? "0") : 0;
  const ratingReason = ratingReasonAnswer?.answer_text ?? "";

  async function updateRating(rating: number, reason: string) {
    if (!deal) return;
    await fetch(`/api/startup/${deal.id}/answers`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [
          { question: "Investment Rating (1-4)", answer_text: String(rating), answer_type: "text" },
          { question: "Rating Reason", answer_text: reason, answer_type: "text" },
        ],
        scout_id: typeof window !== "undefined" ? localStorage.getItem("quanta_scout_id") : null,
      }),
    });
    setDeal((prev) => {
      if (!prev) return prev;
      const filtered = prev.deal_answers.filter((a) => a.question !== "Investment Rating (1-4)" && a.question !== "Rating Reason");
      return { ...prev, deal_answers: [...filtered, { id: "r1", question: "Investment Rating (1-4)", answer_text: String(rating), answer_type: "text" }, { id: "r2", question: "Rating Reason", answer_text: reason, answer_type: "text" }] };
    });
  }

  async function sendReply() {
    if (!reply.trim() || !deal) return;
    setSending(true);
    const body = reply;
    setReply(""); // clear input optimistically

    try {
      const scoutId = typeof window !== "undefined" ? localStorage.getItem("quanta_scout_id") : null;
      const res = await fetch(`/api/scout/deals/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, scout_id: scoutId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[reply] API error:", err);
        setReply(body); // restore message so user can retry
        return;
      }

      const data = await res.json();
      // Add both messages to local state — they're also saved in DB
      setDeal((prev) => prev ? {
        ...prev,
        messages: [
          ...prev.messages,
          { sender_type: "scout", body, created_at: new Date().toISOString() },
          { sender_type: "ai", body: data.ai_reply ?? "Got it.", created_at: new Date().toISOString() },
        ],
      } : prev);
    } catch (e) {
      console.error("[reply] Network error:", e);
      setReply(body); // restore message
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  if (!deal) return <div className="flex items-center justify-center h-screen text-sm text-gray-400">Startup not found.</div>;

  const badge = STATUS_BADGE[deal.status] ?? "bg-gray-100 text-gray-500";
  const pendingTasks = deal.missing_info_tasks.filter((t) => t.status === "pending");
  const displayAnswers = deal.deal_answers.filter((a) =>
    a.answer_type !== "skipped" && a.answer_text &&
    !a.question.startsWith("Investment Rating") && !a.question.startsWith("Rating") &&
    !a.question.startsWith("Voice Transcript") &&
    !["Founder LinkedIn URLs", "Anything else valuable"].includes(a.question)
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white flex flex-col">
      {showEmail && <GenerateEmailModal deal={deal} onClose={() => setShowEmail(false)} />}

      <header className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Link href="/scout" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-950 truncate">{deal.startup_name ?? "Unnamed"}</h1>
            <p className="text-xs text-gray-400 truncate">{deal.one_line_description}</p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{STATUS_LABEL[deal.status] ?? deal.status}</span>
        </div>
        <div className="flex border-t border-gray-100 px-4">
          {([{ id: "overview", label: "Overview", icon: LayoutGrid }, { id: "interaction", label: "Interaction", icon: MessageCircle }] as const).map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === tid ? "border-gray-950 text-gray-950" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              <Icon size={13} />{label}
              {tid === "interaction" && deal.partner_questions.filter(q => q.status === "sent").length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">{deal.partner_questions.filter(q => q.status === "sent").length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {tab === "overview" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Startup info — view or edit mode */}
          {editingOverview ? (
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Edit Startup Info</p>
              {[
                { key: "startup_name", label: "Startup name" },
                { key: "one_line_description", label: "What it does" },
                { key: "category", label: "Category" },
                { key: "stage", label: "Stage" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input value={editFields[key as keyof typeof editFields]}
                    onChange={(e) => setEditFields((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Founders</p>
              {editFounders.map((f, i) => (
                <div key={i} className="space-y-2 border border-gray-100 rounded-lg p-3">
                  <input value={f.full_name} onChange={(e) => setEditFounders((p) => p.map((x, j) => j === i ? { ...x, full_name: e.target.value } : x))}
                    placeholder="Full name" className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-sm focus:outline-none focus:border-gray-400" />
                  <input value={f.linkedin_url} onChange={(e) => setEditFounders((p) => p.map((x, j) => j === i ? { ...x, linkedin_url: e.target.value } : x))}
                    placeholder="https://linkedin.com/in/..." type="url" className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-sm focus:outline-none focus:border-gray-400" />
                  <input value={f.email} onChange={(e) => setEditFounders((p) => p.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                    placeholder="email@example.com" type="email" className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-sm focus:outline-none focus:border-gray-400" />
                </div>
              ))}
              <button onClick={() => setEditFounders((p) => [...p, { full_name: "", linkedin_url: "", email: "" }])}
                className="text-xs text-indigo-600 hover:text-indigo-800">+ Add founder</button>
              <div className="flex gap-2 pt-1">
                <button onClick={saveOverview} disabled={savingOverview}
                  className="flex-1 h-9 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {savingOverview ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => setEditingOverview(false)}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2.5">
                  {deal.founders.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Founders</p>
                      <p className="text-sm font-medium text-gray-900">{deal.founders.map(f => f.full_name).filter(Boolean).join(", ")}</p>
                      <div className="flex gap-2 flex-wrap mt-0.5">
                        {deal.founders.filter(f => f.linkedin_url).map((f, i) => (
                          <a key={i} href={f.linkedin_url!} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">LinkedIn →</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {deal.category && <div><p className="text-xs text-gray-400 mb-0.5">Category</p><p className="text-sm text-gray-700">{deal.category}</p></div>}
                  {deal.stage && <div><p className="text-xs text-gray-400 mb-0.5">Stage</p><p className="text-sm text-gray-700">{deal.stage}</p></div>}
                </div>
                <button onClick={startEditOverview} className="text-gray-400 hover:text-gray-700 p-1 shrink-0 ml-2">
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          )}

          {investmentRating > 0 && (
            <RatingCard dealId={deal.id} rating={investmentRating} reason={ratingReason} onUpdate={updateRating} />
          )}

          {pendingTasks.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5"><AlertCircle size={12} /> Still needed</p>
              <div className="space-y-2">{pendingTasks.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-2">
                  <p className="text-xs text-amber-900 font-medium">{t.info_needed}</p>
                  {t.expected_date && <p className="text-xs text-amber-600 shrink-0 flex items-center gap-1"><Clock size={9} />by {t.expected_date}</p>}
                </div>
              ))}</div>
            </div>
          )}

          {displayAnswers.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Submission</p>
              <div className="space-y-3">{displayAnswers.map((a) => (
                <div key={a.id} className="border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">{a.question}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{a.answer_text}</p>
                </div>
              ))}</div>
            </div>
          )}

          {deal.files.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uploaded Files</p>
              <div className="space-y-1.5">{deal.files.map((f, i) => <div key={i} className="flex items-center gap-2 text-sm text-gray-700"><FileText size={13} className="text-gray-400 shrink-0" /><span className="truncate">{f.file_name}</span></div>)}</div>
            </div>
          )}

          {deal.scout_notes.filter(n => n.note_text).length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Notes</p>
              {deal.scout_notes.filter(n => n.note_text).map((n, i) => <p key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5 leading-relaxed mb-1.5 last:mb-0">{n.note_text}</p>)}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pb-4">
            <button onClick={() => setShowEmail(true)} className="flex flex-col items-center gap-1.5 border border-gray-100 rounded-xl p-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Mail size={15} className="text-gray-400" />Generate Email
            </button>
            <label className="flex flex-col items-center gap-1.5 border border-gray-100 rounded-xl p-3 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
              {uploadingFile ? <Loader2 size={15} className="animate-spin text-indigo-500" /> : <Upload size={15} className="text-gray-400" />}Upload Doc
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file || !deal) return; setUploadingFile(true);
                const fd = new FormData(); fd.append("file", file, file.name); fd.append("deal_id", deal.id);
                const res = await fetch("/api/upload/file", { method: "POST", body: fd }); const data = await res.json();
                if (!res.ok) { alert(data.error ?? "Upload failed"); setUploadingFile(false); return; }
                await fetch(`/api/startup/${deal.id}/file`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storage_url: data.storage_url, file_name: file.name, file_type: file.type }) });
                setUploadingFile(false); alert(`${file.name} uploaded.`); e.target.value = "";
              }} />
            </label>
            <button onClick={() => setShowNoteInput(!showNoteInput)} className={`flex flex-col items-center gap-1.5 border rounded-xl p-3 text-xs font-medium transition-colors ${showNoteInput ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-600 hover:bg-gray-50"}`}>
              <Mic size={15} className={showNoteInput ? "text-indigo-500" : "text-gray-400"} />Add Note
            </button>
          </div>

          {showNoteInput && (
            <div className="mb-4 border border-gray-200 rounded-xl p-3 space-y-2">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Your thoughts…" className="w-full h-20 text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-gray-400" />
              <div className="flex gap-2">
                <button onClick={async () => { if (!noteText.trim() || !deal) return; setSavingNote(true); await fetch(`/api/startup/${deal.id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note_text: noteText, note_type: "text" }) }); setNoteText(""); setShowNoteInput(false); setSavingNote(false); }} disabled={!noteText.trim() || savingNote} className="flex-1 h-8 bg-gray-950 hover:bg-gray-800 text-white text-xs font-medium rounded-lg flex items-center justify-center disabled:opacity-50">{savingNote ? "Saving…" : "Save Note"}</button>
                <button onClick={() => { setShowNoteInput(false); setNoteText(""); }} className="h-8 px-3 border border-gray-200 rounded-lg text-xs text-gray-500">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "interaction" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {/* Missing info banner — shown above chat so scout always knows what's outstanding */}
          {pendingTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-1">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> Still needed from you
              </p>
              <div className="space-y-1.5">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-amber-900">{t.info_needed}</p>
                    </div>
                    {t.expected_date && (
                      <p className="text-[10px] text-amber-600 shrink-0">by {t.expected_date}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-500 mt-2">Share these in the chat below or upload a document above.</p>
            </div>
          )}

          {deal.partner_questions.filter(q => q.status === "sent").length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><MessageCircle size={11} /> Quanta needs a response</p>
              {deal.partner_questions.filter(q => q.status === "sent").map((pq, i) => <p key={i} className="text-sm text-indigo-900 leading-relaxed">{pq.ai_rewritten_message ?? pq.question_text}</p>)}
              <p className="text-xs text-indigo-400 mt-1.5">Reply using the input below ↓</p>
            </div>
          )}
          {deal.messages.length === 0
            ? <div className="text-center py-12 text-gray-400 text-sm"><MessageCircle size={24} className="mx-auto mb-2 opacity-30" />Your Q&amp;A will appear here after completing the submission flow.</div>
            : deal.messages.map((msg, i) => {
                const isScout = msg.sender_type === "scout";
                const isSystem = msg.sender_type === "system";
                const isQuanta = msg.sender_type === "quanta";
                if (isSystem) return <div key={i} className="flex justify-center my-1"><div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 max-w-xs text-center"><p className="text-xs text-amber-800 leading-relaxed">{msg.body}</p></div></div>;
                return (
                  <div key={i} className={`flex items-end gap-1.5 ${isScout ? "justify-end" : "justify-start"}`}>
                    {!isScout && <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white ${isQuanta ? "bg-indigo-600" : "bg-gray-400"}`}>{isQuanta ? "Q" : "AI"}</div>}
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${isScout ? "bg-gray-950 text-white rounded-br-sm" : isQuanta ? "bg-indigo-600 text-white rounded-bl-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                      {!isScout && <p className="text-[9px] font-bold opacity-60 uppercase tracking-wide mb-1">{isQuanta ? "Quanta" : "AI"}</p>}
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <p className="text-[10px] mt-1 opacity-50">{fmt(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })
          }
          <div ref={bottomRef} />
        </div>
      )}

      {tab === "interaction" && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} placeholder="Reply to Quanta…" rows={1} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none leading-relaxed py-1" style={{ overflow: "hidden" }} onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
            <button onClick={sendReply} disabled={!reply.trim() || sending} className={`mb-1 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${reply.trim() && !sending ? "bg-gray-950 text-white" : "bg-gray-300 text-gray-400 cursor-not-allowed"}`}>
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
