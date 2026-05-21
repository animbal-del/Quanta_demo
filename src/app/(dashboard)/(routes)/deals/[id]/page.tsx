"use client";

import { useState } from "react";
import { ArrowLeft, AlertCircle, MessageSquare, ArrowUpRight, Archive, Star } from "lucide-react";
import Link from "next/link";

const DEAL = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  startup_name: "FlowOps",
  summary: "AI agents for logistics dispatch automation",
  status: "needs_info",
  priority: "high",
  scout: "Amit Sharma",
  category: "AI / Logistics",
  source: "Purdue Hackathon",
  brief: {
    what_it_does:
      "FlowOps appears to automate dispatch workflows for small to mid-size logistics teams using AI agents.",
    why_it_may_matter:
      "Scout described the founder as unusually technical and fast-moving, with early traction signals in a large and fragmented market.",
    known_facts: [
      "Met at Purdue hackathon",
      "Founder name: Rohan",
      "3 pilot conversations mentioned (no signed customers)",
    ],
    open_questions: [
      "Who are the pilot customers?",
      "Does Rohan have logistics domain experience?",
      "Is there a working product demo?",
      "What is the go-to-market strategy?",
    ],
    suggested_next_action: "Ask scout for founder intro and pilot customer details before requesting deck.",
  },
  signals: {
    founder: { level: "strong", label: "Strong", evidence: "Scout described founder as technical and fast-moving with 3 pilot conversations already." },
    traction: { level: "early", label: "Early", evidence: "3 pilot conversations mentioned but no signed customers or revenue." },
    market: { level: "unclear", label: "Unclear", evidence: "Logistics dispatch mentioned but market size and dynamics not confirmed." },
    conviction: { level: "high", label: "High", evidence: "Scout proactively submitted and highlighted founder quality unprompted." },
  },
  risk_flags: ["No deck yet", "No customer names confirmed", "Founder background not verified", "No product demo seen"],
  missing: [
    { item: "Pitch deck", date: "2026-05-22", followup: "2026-05-23", status: "pending" },
    { item: "Pilot customer details", date: null, followup: null, status: "pending" },
    { item: "Founder intro", date: null, followup: null, status: "pending" },
  ],
  thread: [
    { sender: "scout", body: "Met Rohan at Purdue hackathon. He's building FlowOps, AI agents for logistics dispatch. No deck yet but he mentioned 3 pilot conversations.", time: "3 days ago" },
    { sender: "ai", body: "Got it. What made FlowOps stand out to you?", time: "3 days ago" },
    { sender: "scout", body: "Rohan seemed very technical and fast-moving. He had already spoken to 3 logistics operators.", time: "3 days ago" },
    { sender: "ai", body: "Helpful. Do you know when you can get the deck or founder intro?", time: "3 days ago" },
    { sender: "scout", body: "I can get the deck by May 22.", time: "3 days ago" },
    { sender: "ai", body: "Perfect. I'll check back after May 22 if it's still missing.", time: "3 days ago" },
  ],
};

const SIGNAL_COLORS: Record<string, string> = {
  strong: "text-emerald-600",
  high: "text-emerald-600",
  medium: "text-amber-600",
  early: "text-blue-600",
  weak: "text-red-500",
  unclear: "text-gray-400",
};

export default function DealDetailPage() {
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [rewritten, setRewritten] = useState("");
  const [sent, setSent] = useState(false);

  function handleRewrite() {
    setRewritten(
      `Quanta had one quick follow-up on FlowOps: do you know who the 3 pilot customers are, and would Rohan be open to an intro?`
    );
  }

  function handleSend() {
    setSent(true);
    setTimeout(() => {
      setAskOpen(false);
      setSent(false);
      setQuestion("");
      setRewritten("");
    }, 1500);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/inbox" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 w-fit">
        <ArrowLeft size={14} /> Back to Inbox
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{DEAL.startup_name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Needs Info</span>
          </div>
          <p className="text-sm text-gray-500">{DEAL.summary}</p>
          <p className="text-xs text-gray-400 mt-1">
            Scout: {DEAL.scout} · {DEAL.source} · {DEAL.category}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            <Star size={12} /> Priority
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            <Archive size={12} /> Archive
          </button>
          <button
            onClick={() => setAskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <MessageSquare size={12} /> Ask Scout
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
            <ArrowUpRight size={12} /> Request Intro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Brief + Signals + Missing */}
        <div className="col-span-2 space-y-4">

          {/* AI Brief */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">AI Brief</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">What it does</p>
                <p className="text-sm text-gray-700">{DEAL.brief.what_it_does}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Why it may matter</p>
                <p className="text-sm text-gray-700">{DEAL.brief.why_it_may_matter}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Known facts</p>
                  <ul className="space-y-1">
                    {DEAL.brief.known_facts.map((f) => (
                      <li key={f} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Open questions</p>
                  <ul className="space-y-1">
                    {DEAL.brief.open_questions.map((q) => (
                      <li key={q} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" /> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <p className="text-xs font-medium text-indigo-700 mb-0.5">Suggested next action</p>
                <p className="text-xs text-indigo-900">{DEAL.brief.suggested_next_action}</p>
              </div>
            </div>
          </div>

          {/* Signals */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Signals</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(DEAL.signals).map(([key, sig]) => (
                <div key={key} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 capitalize">{key === "conviction" ? "Scout Conviction" : `${key} Signal`}</p>
                    <span className={`text-xs font-semibold ${SIGNAL_COLORS[sig.level]}`}>{sig.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{sig.evidence}</p>
                </div>
              ))}
            </div>
            {DEAL.risk_flags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Risk flags</p>
                <div className="flex flex-wrap gap-1.5">
                  {DEAL.risk_flags.map((f) => (
                    <span key={f} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full submission */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Full Submission</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Voice transcript</p>
                <p className="text-xs text-gray-700">Scout described FlowOps as AI agents for dispatch teams, with three pilot conversations.</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Answers</p>
                <p className="text-xs text-gray-700">Founder is technical and fast-moving. Pilot names and deck are still missing.</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Documents</p>
                <p className="text-xs text-gray-700">No deck uploaded yet. Scout note and screenshot available.</p>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Analysis</h2>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-medium text-gray-500 mb-2">Similar startups</p>
                <p className="text-gray-700">Flexport AI · ShipOps · DispatchBot</p>
              </div>
              <div>
                <p className="font-medium text-gray-500 mb-2">Market</p>
                <p className="text-gray-700">Logistics automation is growing, but workflow ownership is fragmented.</p>
              </div>
              <div>
                <p className="font-medium text-gray-500 mb-2">Competition</p>
                <p className="text-gray-700">Moderate. Need clarity on wedge and operator adoption.</p>
              </div>
            </div>
          </div>

          {/* Conversation thread */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversation Thread</h2>
            <div className="space-y-3">
              {DEAL.thread.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "scout" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-sm rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.sender === "scout"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "scout" ? "text-gray-400" : "text-indigo-200"}`}>
                      {msg.sender === "scout" ? "Amit" : "AI"} · {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Missing info */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Missing Info</h2>
            <div className="space-y-2.5">
              {DEAL.missing.map((m) => (
                <div key={m.item} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={11} className="text-amber-500" />
                    <p className="text-xs font-medium text-gray-800">{m.item}</p>
                  </div>
                  {m.date ? (
                    <p className="text-xs text-gray-400">Expected {m.date} · follow-up {m.followup}</p>
                  ) : (
                    <p className="text-xs text-gray-400">No date committed</p>
                  )}
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Founder</h2>
            <p className="text-sm text-gray-700 font-medium">Rohan Mehta</p>
            <p className="text-xs text-gray-500 mt-1">Technical founder. Scout described as fast-moving with logistics domain knowledge.</p>
            <p className="text-xs text-gray-400 mt-1">LinkedIn: not provided</p>
          </div>
        </div>
      </div>

      {/* Ask Scout modal */}
      {askOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Ask Scout</h2>
            <p className="text-xs text-gray-500 mb-4">Write your internal question — AI will rewrite it for the scout.</p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask who the 3 pilot customers are and whether founder can intro us"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:border-indigo-400"
            />
            {rewritten && (
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <p className="text-xs font-medium text-indigo-700 mb-1">AI will send:</p>
                <p className="text-sm text-indigo-900">{rewritten}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAskOpen(false)} className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              {!rewritten ? (
                <button onClick={handleRewrite} className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                  Rewrite with AI
                </button>
              ) : (
                <button onClick={handleSend} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                  {sent ? "Sent ✓" : "Send via OpenClaw"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
