"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Mail,
  MessageCircle,
  Mic,
  Paperclip,
  Plus,
  Send,
  Upload,
} from "lucide-react";

const messages = [
  { sender: "quanta", body: "Do you know who the pilot customers are?", time: "Today" },
  { sender: "scout", body: "Will check with Rohan and report back.", time: "Today" },
  { sender: "system", body: "When should we follow up?", time: "Today" },
];

export default function StartupDetailPage() {
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <Link href="/scout" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-950">FlowOps</h1>
            <p className="text-xs text-gray-500">AI logistics agents</p>
          </div>
        </div>
        <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          Needs Info
        </span>
      </header>

      <div className="space-y-4 px-4 py-5">
        <section className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-950">Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label="Founder" value="Rohan" />
            <Row label="Category" value="AI / Logistics" />
            <Row label="Why interesting" value="Technical founder, early traction" />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-950">Missing Info</h2>
            <button className="text-xs font-medium text-indigo-600">Update</button>
          </div>
          <div className="space-y-2">
            {["Deck", "Pilot customers"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm">
                <span className="text-amber-900">{item}</span>
                <span className="text-xs font-medium text-amber-700">Pending</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle size={15} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-950">Conversation</h2>
          </div>
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.sender === "scout"
                    ? "ml-8 bg-indigo-600 text-white"
                    : message.sender === "system"
                    ? "bg-gray-50 text-gray-600"
                    : "mr-8 bg-gray-100 text-gray-900"
                }`}
              >
                <p>{message.body}</p>
                <p className={`mt-1 text-xs ${message.sender === "scout" ? "text-indigo-200" : "text-gray-400"}`}>
                  {message.sender === "scout" ? "You" : message.sender === "quanta" ? "Quanta" : "System"} · {message.time}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
            <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Reply to Quanta..." />
            <button className="text-indigo-600">
              <Send size={15} />
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-950">Uploads</h2>
          <div className="space-y-2">
            {["Notes.m4a", "Hackathon screenshot.png"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <FileText size={14} className="text-gray-400" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 pb-6">
          <Action icon={Plus} label="Add Update" />
          <Action icon={Upload} label="Upload Document" />
          <Action icon={Mic} label="Record Note" />
          <button
            onClick={() => setEmailOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-medium text-white"
          >
            <Mail size={15} />
            Generate Email
          </button>
        </section>
      </div>

      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4">
          <div className="w-full rounded-lg bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Generate Email</h2>
            <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
              <p className="font-medium">To: Rohan</p>
              <p className="mt-3">
                Hi Rohan, could you share your deck and any details on the pilot customers when you get a chance?
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700">
                Copy
              </button>
              <button className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white">
                Send via Gmail
              </button>
            </div>
            <button onClick={() => setEmailOpen(false)} className="mt-3 w-full py-2 text-sm text-gray-500">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="max-w-[62%] text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Action({ icon: Icon, label }: { icon: typeof Paperclip; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700">
      <Icon size={15} />
      {label}
    </button>
  );
}
