"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Zap, CheckCircle2, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  sender: "scout" | "ai";
  body: string;
  time: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "ai",
    body: "Hey Amit 👋 Seen any interesting founders or startups this week? Even rough signals are fine.",
    time: "10:02 AM",
  },
];

const AI_RESPONSES: Record<string, string> = {
  default: "Got it. What made this founder or startup stand out to you?",
  "stand out": "That's a good signal. Do you know when you can get the deck or a founder intro?",
  "may 22": "Perfect. I'll check back after May 22 if it's still missing. I've saved this to your FlowOps submission.",
  "deck": "Got it — I'll save that. Anything else you remember about the team or product?",
  "technical": "Strong founder signal. Do you have a way to connect them with Quanta, or would you want to intro them yourself?",
};

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return AI_RESPONSES.default;
}

const CAPTURED_DEAL = {
  startup_name: "FlowOps",
  founder: "Rohan",
  description: "AI agents for logistics dispatch",
  why_interesting: "Technical founder, 3 pilot conversations",
  missing: ["Deck", "Founder intro", "Pilot details"],
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function send() {
    const text = input.trim();
    if (!text) return;

    const scoutMsg: Message = { id: Date.now().toString(), sender: "scout", body: text, time: now() };
    setMessages((prev) => [...prev, scoutMsg]);
    setInput("");
    setTyping(true);

    // Show deal capture card after first substantive message
    if (messages.length >= 1 && !showCapture && text.length > 20) {
      setTimeout(() => setShowCapture(true), 3000);
    }

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        body: getAIResponse(text),
        time: now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 1400);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Quanta Scout</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
          href="/scout"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            Scout Home <ChevronRight size={12} />
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600" aria-label="Switch login">
            <LogOut size={15} />
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "scout" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "ai" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-auto shrink-0">
                <Zap size={10} className="text-indigo-600" />
              </div>
            )}
            <div
              className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === "scout"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}
            >
              <p className="leading-relaxed">{msg.body}</p>
              <p className={`text-xs mt-1 ${msg.sender === "scout" ? "text-indigo-200" : "text-gray-400"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-auto shrink-0">
              <Zap size={10} className="text-indigo-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Deal capture card */}
        {showCapture && !typing && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mx-2">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={14} className="text-indigo-600" />
              <p className="text-xs font-semibold text-indigo-700">Captured Signal</p>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Startup</span>
                <span className="font-medium text-gray-800">{CAPTURED_DEAL.startup_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Founder</span>
                <span className="font-medium text-gray-800">{CAPTURED_DEAL.founder}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">What it does</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%]">{CAPTURED_DEAL.description}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Why interesting</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%]">{CAPTURED_DEAL.why_interesting}</span>
              </div>
            </div>
            <div className="border-t border-indigo-200 pt-2.5 mb-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Still missing:</p>
              <div className="flex flex-wrap gap-1">
                {CAPTURED_DEAL.missing.map((m) => (
                  <span key={m} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50">
                Looks good
              </button>
              <button className="flex-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50">
                Add more
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 border-t border-gray-100 shrink-0">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
          <button className="mb-1 text-gray-400 hover:text-gray-600 shrink-0">
            <Paperclip size={17} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Met a founder building…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none max-h-28 leading-relaxed py-1"
            style={{ overflow: "hidden" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = t.scrollHeight + "px";
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className={`mb-1 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              input.trim() ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
