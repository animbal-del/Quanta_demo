"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, TrendingUp, Clock, CheckCircle2, AlertCircle, ChevronRight, Loader2, Send, X } from "lucide-react";

interface ScoutDetail {
  id: string; full_name: string; email: string; phone: string | null;
  preferred_channel: string; focus_areas: string[]; status: string;
  responsiveness_score: number; created_at: string;
  last_active_at: string | null; last_checkin_at: string | null;
  last_email_sent_at: string | null; last_email_responded_at: string | null;
  deals: { id: string; startup_name: string | null; one_line_description: string | null; status: string; review_label: string | null; updated_at: string }[];
  email_history: { email_type: string; subject: string | null; sent_at: string | null; response: string | null; responded_at: string | null }[];
}

const STATUS_DOT: Record<string, string> = {
  needs_info: "bg-amber-400", under_review: "bg-violet-400",
  monitor: "bg-slate-300", intro_requested: "bg-emerald-400",
  archived: "bg-gray-200", submitted: "bg-blue-400",
};

const REVIEW_BADGE: Record<string, { label: string; className: string }> = {
  strong_candidate: { label: "Strong", className: "text-emerald-700 bg-emerald-50" },
  worth_exploring:  { label: "Explore", className: "text-blue-700 bg-blue-50" },
  needs_more_info:  { label: "Needs Info", className: "text-amber-700 bg-amber-50" },
};

function relativeTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.round(diff)}d ago`;
}

function joinedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ResponsivenessBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{pct}%</span>
    </div>
  );
}

export default function ScoutDetailPage() {
  const { id } = useParams() as { id: string };
  const [scout, setScout] = useState<ScoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinSent, setCheckinSent] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch(`/api/internal/scouts/${id}`)
      .then((r) => r.json())
      .then(setScout)
      .finally(() => setLoading(false));
  }, [id]);

  async function sendCheckin() {
    setCheckinLoading(true);
    await fetch(`/api/internal/scouts/${id}/checkin`, { method: "POST" });
    setCheckinLoading(false);
    setCheckinSent(true);
    setTimeout(() => setCheckinSent(false), 3000);
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    await fetch(`/api/internal/scouts/${id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: emailSubject, body: emailBody }),
    });
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => { setEmailModal(false); setEmailSent(false); setEmailSubject(""); setEmailBody(""); }, 1500);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={20} className="animate-spin text-gray-400" />
    </div>
  );

  if (!scout) return (
    <div className="p-6 text-center text-sm text-gray-400">Scout not found.</div>
  );

  const submitted = scout.deals.length;
  const movedForward = scout.deals.filter(d => ["intro_requested","monitor"].includes(d.status)).length;
  const archived = scout.deals.filter(d => d.status === "archived").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/scouts" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 w-fit">
        <ArrowLeft size={14} /> Back to Scouts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
            {scout.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-950">{scout.full_name}</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm text-gray-400">{scout.email} · via {scout.preferred_channel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Send "any new startups?" reminder email with yes/no CTA */}
          <button
            onClick={async () => {
              const res = await fetch(`/api/internal/scouts/${id}/remind`, { method: "POST" });
              const data = await res.json();
              alert(data.message ?? (data.sent ? "Reminder sent!" : "Failed"));
            }}
            className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <Mail size={13} /> Send Reminder
          </button>
          <button onClick={sendCheckin} disabled={checkinLoading || checkinSent}
            className={`flex items-center gap-1.5 h-8 px-3 text-sm font-medium border rounded-lg transition-colors ${
              checkinSent ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {checkinLoading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
            {checkinSent ? "Sent ✓" : "Check-in"}
          </button>
          <button onClick={() => setEmailModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail size={13} /> Custom Email
          </button>
        </div>

        {/* Email compose modal */}
        {emailModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-950">Email {scout.full_name}</h2>
                <button onClick={() => setEmailModal(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Quick follow-up on your submissions"
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                  <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Hi, just checking in…"
                    className="w-full h-28 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEmailModal(false)}
                  className="flex-1 h-9 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={sendEmail} disabled={!emailSubject.trim() || !emailBody.trim() || emailSending}
                  className="flex-1 h-9 bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {emailSending ? <Loader2 size={13} className="animate-spin" /> : emailSent ? "Sent ✓" : <><Send size={13} /> Send</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Profile */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Profile</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Focus areas</p>
                <div className="flex flex-wrap gap-1">
                  {scout.focus_areas.map((f) => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Responsiveness</p>
                <ResponsivenessBar value={scout.responsiveness_score} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Last active", val: relativeTime(scout.last_active_at) },
                  { label: "Joined", val: joinedDate(scout.created_at) },
                  { label: "Check-in sent", val: relativeTime(scout.last_checkin_at) },
                  { label: "Last responded", val: relativeTime(scout.last_email_responded_at) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-gray-400">{label}</p>
                    <p className="text-gray-700 font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Submitted", value: submitted, color: "text-gray-950" },
                { label: "Moved forward", value: movedForward, color: "text-emerald-600" },
                { label: "Archived", value: archived, color: "text-gray-400" },
                { label: "Active", value: submitted - archived, color: "text-gray-700" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Deals + Email */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-950">Startups Introduced ({scout.deals.length})</p>
              <TrendingUp size={14} className="text-gray-300" />
            </div>
            <div className="space-y-1.5">
              {scout.deals.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No deals yet.</p>}
              {scout.deals.map((deal) => {
                const review = deal.review_label ? REVIEW_BADGE[deal.review_label] : null;
                return (
                  <Link key={deal.id} href={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[deal.status] ?? "bg-gray-200"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{deal.startup_name ?? "Unnamed"}</p>
                        <p className="text-xs text-gray-400 truncate">{deal.one_line_description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {review && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${review.className}`}>{review.label}</span>}
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={9} />{relativeTime(deal.updated_at)}</span>
                      <ChevronRight size={13} className="text-gray-200 group-hover:text-gray-500" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-950 mb-4">Email History</p>
            <div className="space-y-2.5">
              {scout.email_history.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    {e.response
                      ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      : <AlertCircle size={13} className="text-gray-200 shrink-0" />
                    }
                    <div>
                      <p className="text-sm text-gray-800 capitalize">{e.email_type.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{e.sent_at ? relativeTime(e.sent_at) : "—"}</p>
                    </div>
                  </div>
                  {e.response === "yes_have_startup" && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Had a lead</span>}
                  {e.response === "nothing_this_week" && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Nothing this week</span>}
                  {!e.response && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">No response</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
