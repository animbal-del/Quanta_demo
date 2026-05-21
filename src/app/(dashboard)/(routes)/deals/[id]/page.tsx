"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, AlertCircle, MessageSquare, ArrowUpRight,
  Archive, Star, Loader2, Clock, FileText, StickyNote,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SignalItem { level: string; evidence: string }
interface Deal {
  id: string;
  startup_name: string | null;
  one_line_description: string | null;
  category: string | null;
  stage: string | null;
  status: string;
  priority: string;
  scout_conviction: string | null;
  source_context: string | null;
  submission_mode: string | null;
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
  files: { file_name: string | null; file_type: string | null; summary: string | null }[];
  partner_questions: { question_text: string; ai_rewritten_message: string | null; status: string; asked_at: string | null }[];
  internal_notes: { author_name: string | null; note: string; created_at: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  needs_info: "bg-amber-100 text-amber-700",
  under_review: "bg-violet-100 text-violet-700",
  intro_requested: "bg-emerald-100 text-emerald-700",
  monitor: "bg-slate-100 text-slate-600",
  archived: "bg-gray-100 text-gray-400",
  rejected: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", needs_info: "Needs Info",
  under_review: "Under Review", intro_requested: "Intro Requested",
  monitor: "Monitor", archived: "Archived", rejected: "Rejected",
};

const SIGNAL_COLOR: Record<string, string> = {
  strong: "text-emerald-600", high: "text-emerald-600",
  medium: "text-amber-600", early: "text-blue-600",
  weak: "text-red-500", unclear: "text-gray-400",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Ask Scout modal ──────────────────────────────────────────────────────────
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

  function send() {
    setSent(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Ask Scout</h2>
        <p className="text-xs text-gray-400 mb-4">Write your internal question — AI rewrites it for the scout.</p>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask who the 3 pilot customers are and whether the founder can intro us"
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:border-indigo-400"
        />
        {rewritten && (
          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="text-xs font-medium text-indigo-600 mb-1">AI will send:</p>
            <p className="text-sm text-indigo-900">{rewritten}</p>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 h-9 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          {!rewritten ? (
            <button onClick={rewrite} disabled={!question.trim() || loading}
              className="flex-1 h-9 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <Loader2 size={13} className="animate-spin" /> : "Rewrite with AI"}
            </button>
          ) : (
            <button onClick={send}
              className="flex-1 h-9 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center">
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
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "analyze" | "interaction">("overview");

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`/api/internal/deals/${dealId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: Deal) => setDeal(data))
      .catch(() => setError("Deal not found."))
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-3">{error || "Deal not found."}</p>
        <button onClick={() => router.back()} className="text-sm text-indigo-600">← Go back</button>
      </div>
    );
  }

  const badge = STATUS_BADGE[deal.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[deal.status] ?? deal.status;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {askOpen && <AskScoutModal dealId={deal.id} onClose={() => setAskOpen(false)} />}

      {/* Back */}
      <Link href="/deals" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 w-fit">
        <ArrowLeft size={14} /> Back
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {deal.priority === "high" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
            <h1 className="text-2xl font-bold text-gray-900">{deal.startup_name ?? "Unnamed startup"}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{statusLabel}</span>
            {deal.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{deal.category}</span>}
          </div>
          <p className="text-sm text-gray-500">{deal.one_line_description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {deal.scout && <>Scout: <span className="text-gray-600">{deal.scout.full_name}</span> · </>}
            {deal.source_context && <>{deal.source_context} · </>}
            {deal.stage}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg">
            <Star size={12} /> Priority
          </button>
          <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg">
            <Archive size={12} /> Archive
          </button>
          <button onClick={() => setAskOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
            <MessageSquare size={12} /> Ask Scout
          </button>
          <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
            <ArrowUpRight size={12} /> Request Intro
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {(["overview", "analyze", "interaction"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {/* AI Brief */}
            {deal.brief && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">AI Brief</h2>
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
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />{f}
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
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-indigo-700 mb-0.5">Suggested next action</p>
                    <p className="text-xs text-indigo-900">{deal.brief.suggested_next_action}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Signals */}
            {deal.signals && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Signals</h2>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Founder Signal", deal.signals.founder_signal],
                    ["Market Signal", deal.signals.market_signal],
                    ["Traction Signal", deal.signals.traction_signal],
                    ["Scout Conviction", deal.signals.scout_conviction],
                  ] as [string, SignalItem][]).map(([label, sig]) => (
                    <div key={label} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-400">{label}</p>
                        <span className={`text-xs font-semibold capitalize ${SIGNAL_COLOR[sig.level] ?? "text-gray-500"}`}>{sig.level}</span>
                      </div>
                      <p className="text-xs text-gray-600">{sig.evidence}</p>
                    </div>
                  ))}
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

            {/* No brief/signals yet */}
            {!deal.brief && !deal.signals && (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">AI brief and signals generate automatically after submission.</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Founder */}
            {deal.founders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Founder</h2>
                {deal.founders.map((f, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-gray-900">{f.full_name ?? "—"}</p>
                    {f.background_summary && <p className="text-xs text-gray-500 mt-1">{f.background_summary}</p>}
                    {f.linkedin_url && (
                      <a href={f.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline mt-1 block">LinkedIn →</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Missing info tasks */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Missing Info</h2>
              {deal.missing_info_tasks.length === 0 ? (
                <p className="text-xs text-gray-400">Nothing missing.</p>
              ) : (
                <div className="space-y-2">
                  {deal.missing_info_tasks.map((t) => (
                    <div key={t.id} className="border border-gray-100 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle size={11} className="text-amber-500" />
                        <p className="text-xs font-medium text-gray-800">{t.info_needed}</p>
                      </div>
                      {t.expected_date
                        ? <p className="text-xs text-gray-400">Expected {t.expected_date} · follow-up {t.followup_date}</p>
                        : <p className="text-xs text-gray-400">No date committed</p>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files */}
            {deal.files.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Files</h2>
                <div className="space-y-2">
                  {deal.files.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FileText size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{f.file_name}</p>
                        {f.summary && <p className="text-xs text-gray-400">{f.summary}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internal notes */}
            {deal.internal_notes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Internal Notes</h2>
                <div className="space-y-2">
                  {deal.internal_notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <StickyNote size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-700">{n.note}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.author_name} · {fmt(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Analyze tab ── */}
      {activeTab === "analyze" && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Market Analysis</p>
          <p className="text-xs text-gray-400">AI market research, comparable startups, and industry trends. Coming in Phase 5.</p>
        </div>
      )}

      {/* ── Interaction tab ── */}
      {activeTab === "interaction" && (
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Compose</h2>
              <span className="text-xs text-gray-400">
                {deal.partner_questions.filter(q => q.status === "sent").length} pending
              </span>
            </div>
            <textarea
              placeholder="Ask who the pilot customers are…"
              className="w-full h-24 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-indigo-400"
            />
            <button onClick={() => setAskOpen(true)}
              className="mt-2 w-full h-9 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Rewrite &amp; Send via OpenClaw
            </button>

            {/* Partner questions history */}
            {deal.partner_questions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sent questions</p>
                <div className="space-y-2">
                  {deal.partner_questions.map((pq, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-700">{pq.ai_rewritten_message ?? pq.question_text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${pq.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {pq.status}
                        </span>
                        {pq.asked_at && <span className="text-xs text-gray-400"><Clock size={9} className="inline mr-0.5" />{fmt(pq.asked_at)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation thread */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Conversation thread</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {deal.messages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No messages yet.</p>
              ) : deal.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_type === "scout" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-xl px-3 py-2 text-xs ${
                    msg.sender_type === "scout" ? "bg-indigo-600 text-white" :
                    msg.sender_type === "ai" ? "bg-gray-100 text-gray-800" :
                    "bg-violet-50 text-violet-800 border border-violet-100"
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "scout" ? "text-indigo-200" : "text-gray-400"}`}>
                      {msg.sender_type === "scout" ? deal.scout?.full_name ?? "Scout" : msg.sender_type === "ai" ? "AI" : "Quanta"} · {fmt(msg.created_at)}
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
