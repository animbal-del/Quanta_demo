"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Upload, Mic, Mail, AlertCircle,
  CheckCircle2, FileText, Loader2, MessageCircle,
  LayoutGrid, Clock, X,
} from "lucide-react";

interface Message { sender_type: string; body: string; created_at: string }
interface MissingTask { id: string; info_needed: string; expected_date: string | null; status: string }
interface DealFile { file_name: string | null; summary: string | null }
interface DealAnswer { id: string; question: string; answer_text: string | null; answer_type: string }
interface Deal {
  id: string; startup_name: string | null; one_line_description: string | null;
  category: string | null; stage: string | null; status: string;
  scout_conviction: string | null; submission_mode: string | null;
  messages: Message[]; missing_info_tasks: MissingTask[];
  files: DealFile[]; founders: { full_name: string | null; linkedin_url: string | null }[];
  deal_answers: DealAnswer[]; scout_notes: { note_text: string | null; created_at: string }[];
  partner_questions: { question_text: string; ai_rewritten_message: string | null; status: string; asked_at: string | null }[];
}

const STATUS_BADGE: Record<string, string> = {
  needs_info:      "bg-amber-50 text-amber-700",
  under_review:    "bg-violet-50 text-violet-700",
  monitor:         "bg-slate-50 text-slate-600",
  intro_requested: "bg-emerald-50 text-emerald-700",
  submitted:       "bg-blue-50 text-blue-700",
  draft:           "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  needs_info: "Needs Info", under_review: "Under Review",
  monitor: "Monitoring", intro_requested: "Intro Requested",
  submitted: "Submitted", draft: "Draft",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Generate Email Modal
function GenerateEmailModal({ startupName, founders, onClose }: {
  startupName: string; founders: { full_name: string | null }[]; onClose: () => void;
}) {
  const founderName = founders[0]?.full_name ?? "the team";
  const email = `Hi ${founderName},\n\nHope you're doing well. We'd love to learn more about ${startupName}.\n\nCould you share your pitch deck and any details on your current customers or traction when you get a chance?\n\nLooking forward to connecting.\n\nBest,`;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-4">
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl p-5 shadow-xl">
        <h2 className="text-base font-semibold text-gray-950 mb-3">Generated Email</h2>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap border border-gray-200 mb-4 max-h-48 overflow-y-auto">{email}</div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(email)}
            className="flex-1 h-10 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Copy</button>
          <a href={`mailto:?subject=Quick follow-up on ${startupName}&body=${encodeURIComponent(email)}`}
            className="flex-1 h-10 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-xl flex items-center justify-center">Open in Email</a>
        </div>
        <button onClick={onClose} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 py-1">Close</button>
      </div>
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
    fetch(`/api/internal/deals/${id}`)
      .then((r) => r.json())
      .then(setDeal)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "interaction") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deal?.messages, tab]);

  async function sendReply() {
    if (!reply.trim() || !deal) return;
    setSending(true);
    const body = reply;
    setReply("");
    const res = await fetch(`/api/scout/deals/${id}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setDeal((prev) => prev ? {
      ...prev,
      messages: [
        ...prev.messages,
        { sender_type: "scout", body, created_at: new Date().toISOString() },
        { sender_type: "ai", body: data.ai_reply ?? "Got it.", created_at: new Date().toISOString() },
      ],
    } : prev);
    setSending(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
  );
  if (!deal) return (
    <div className="flex items-center justify-center h-screen text-sm text-gray-400">Startup not found.</div>
  );

  const badge = STATUS_BADGE[deal.status] ?? "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABEL[deal.status] ?? deal.status;
  const pendingTasks = deal.missing_info_tasks.filter((t) => t.status === "pending");
  const answeredQA = deal.deal_answers.filter((a) => a.answer_type !== "skipped" && a.answer_text && !a.question.startsWith("Voice Transcript") && !a.question.startsWith("Investment Rating") && !a.question.startsWith("Rating"));

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white flex flex-col">
      {showEmail && deal && (
        <GenerateEmailModal startupName={deal.startup_name ?? "this startup"} founders={deal.founders} onClose={() => setShowEmail(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Link href="/scout" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-950 truncate">{deal.startup_name ?? "Unnamed"}</h1>
            <p className="text-xs text-gray-400 truncate">{deal.one_line_description}</p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{statusLabel}</span>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 px-4">
          {([
            { id: "overview", label: "Overview", icon: LayoutGrid },
            { id: "interaction", label: "Interaction", icon: MessageCircle },
          ] as const).map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === tid ? "border-gray-950 text-gray-950" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              <Icon size={13} />{label}
              {tid === "interaction" && deal.partner_questions.filter(q => q.status === "sent").length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {deal.partner_questions.filter(q => q.status === "sent").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Startup summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {deal.founders.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Founders</p>
                <p className="text-sm font-medium text-gray-900">{deal.founders.map(f => f.full_name).filter(Boolean).join(", ")}</p>
                {deal.founders.filter(f => f.linkedin_url).map((f, i) => (
                  <a key={i} href={f.linkedin_url!} target="_blank" rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline">LinkedIn →</a>
                ))}
              </div>
            )}
            {deal.category && <div><p className="text-xs text-gray-400 mb-0.5">Category</p><p className="text-sm text-gray-700">{deal.category}</p></div>}
            {deal.stage && <div><p className="text-xs text-gray-400 mb-0.5">Stage</p><p className="text-sm text-gray-700">{deal.stage}</p></div>}
          </div>

          {/* Missing info */}
          {pendingTasks.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> Still needed
              </p>
              <div className="space-y-2">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <p className="text-xs text-amber-900 font-medium">{t.info_needed}</p>
                    {t.expected_date && (
                      <p className="text-xs text-amber-600 flex items-center gap-1"><Clock size={9} />by {t.expected_date}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Q&A answers */}
          {answeredQA.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Submission</p>
              <div className="space-y-3">
                {answeredQA.map((a) => (
                  <div key={a.id} className="border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">{a.question}</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{a.answer_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {deal.files.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uploaded Files</p>
              <div className="space-y-1.5">
                {deal.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{f.file_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scout notes */}
          {deal.scout_notes.filter(n => n.note_text).length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Notes</p>
              <div className="space-y-2">
                {deal.scout_notes.filter(n => n.note_text).map((n, i) => (
                  <p key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5 leading-relaxed">{n.note_text}</p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pb-4">
            <button onClick={() => setShowEmail(true)}
              className="flex flex-col items-center gap-1.5 border border-gray-100 rounded-xl p-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Mail size={15} className="text-gray-400" />Generate Email
            </button>
            <label className="flex flex-col items-center gap-1.5 border border-gray-100 rounded-xl p-3 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
              {uploadingFile ? <Loader2 size={15} className="animate-spin text-indigo-500" /> : <Upload size={15} className="text-gray-400" />}
              Upload Doc
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !deal) return;
                  setUploadingFile(true);
                  const formData = new FormData();
                  formData.append("file", file, file.name);
                  formData.append("deal_id", deal.id);
                  const uploadRes = await fetch("/api/upload/file", { method: "POST", body: formData });
                  const uploadData = await uploadRes.json();
                  if (!uploadRes.ok) { alert(uploadData.error ?? "Upload failed"); setUploadingFile(false); return; }
                  await fetch(`/api/startup/${deal.id}/file`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storage_url: uploadData.storage_url, file_name: file.name, file_type: file.type }),
                  });
                  setUploadingFile(false);
                  alert(`${file.name} uploaded.`);
                  e.target.value = "";
                }} />
            </label>
            <button onClick={() => setShowNoteInput(!showNoteInput)}
              className={`flex flex-col items-center gap-1.5 border rounded-xl p-3 text-xs font-medium transition-colors ${showNoteInput ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-600 hover:bg-gray-50"}`}>
              <Mic size={15} className={showNoteInput ? "text-indigo-500" : "text-gray-400"} />Add Note
            </button>
          </div>

          {showNoteInput && (
            <div className="mx-0 mb-4 border border-gray-200 rounded-xl p-3 space-y-2">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Your thoughts…"
                className="w-full h-20 text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-gray-400" />
              <div className="flex gap-2">
                <button onClick={async () => {
                  if (!noteText.trim() || !deal) return;
                  setSavingNote(true);
                  await fetch(`/api/startup/${deal.id}/notes`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note_text: noteText, note_type: "text" }),
                  });
                  setNoteText(""); setShowNoteInput(false); setSavingNote(false);
                }} disabled={!noteText.trim() || savingNote}
                  className="flex-1 h-8 bg-gray-950 hover:bg-gray-800 text-white text-xs font-medium rounded-lg flex items-center justify-center disabled:opacity-50">
                  {savingNote ? "Saving…" : "Save Note"}
                </button>
                <button onClick={() => { setShowNoteInput(false); setNoteText(""); }}
                  className="h-8 px-3 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INTERACTION TAB ── */}
      {tab === "interaction" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {/* Pending questions from Quanta */}
          {deal.partner_questions.filter(q => q.status === "sent").length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-2">
              <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
                <MessageCircle size={11} /> Questions from Quanta
              </p>
              {deal.partner_questions.filter(q => q.status === "sent").map((pq, i) => (
                <p key={i} className="text-sm text-indigo-900 leading-relaxed">{pq.ai_rewritten_message ?? pq.question_text}</p>
              ))}
            </div>
          )}

          {/* Messages */}
          {deal.messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              <MessageCircle size={24} className="mx-auto mb-2 opacity-30" />
              No messages yet. Quanta will reach out here with questions.
            </div>
          ) : deal.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender_type === "scout" ? "justify-end" : "justify-start"}`}>
              {msg.sender_type !== "scout" && (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-1.5 mt-auto shrink-0 text-[9px] font-bold text-gray-500">
                  {msg.sender_type === "ai" ? "AI" : "Q"}
                </div>
              )}
              <div className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.sender_type === "scout" ? "bg-gray-950 text-white rounded-br-sm"
                  : msg.sender_type === "system" ? "bg-gray-50 text-gray-600 border border-gray-100 rounded-bl-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}>
                <p className="leading-relaxed">{msg.body}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_type === "scout" ? "text-gray-400" : "text-gray-400"}`}>
                  {fmt(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Reply input (only in interaction tab) */}
      {tab === "interaction" && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder="Reply to Quanta…" rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none leading-relaxed py-1"
              style={{ overflow: "hidden" }}
              onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
            <button onClick={sendReply} disabled={!reply.trim() || sending}
              className={`mb-1 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${reply.trim() && !sending ? "bg-gray-950 text-white" : "bg-gray-300 text-gray-400 cursor-not-allowed"}`}>
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
