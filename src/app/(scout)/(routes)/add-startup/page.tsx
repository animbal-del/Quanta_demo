"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Mic,
  PencilLine,
  Plus,
  Send,
  Square,
} from "lucide-react";

type Mode = "voice" | "manual" | "document";

const modeOptions = [
  { id: "voice" as const, label: "Voice Pitch", icon: Mic },
  { id: "manual" as const, label: "Manual Entry", icon: PencilLine },
  { id: "document" as const, label: "Upload Document", icon: FileUp },
];

const softIndicators = ["Problem", "Product", "Why interesting", "Traction"];

export default function AddStartupPage() {
  const [mode, setMode] = useState<Mode>("voice");
  const [step, setStep] = useState(1);
  const [recording, setRecording] = useState(false);

  const stepTitle = useMemo(() => {
    if (step === 1) return "Add Startup";
    if (step === 2) return mode === "voice" ? "Voice Pitch" : mode === "manual" ? "Manual Entry" : "Upload Document";
    if (step === 3) return "Review Your Submission";
    if (step === 4) return "Add More Context";
    if (step === 5) return "Your Personal Notes";
    return "Ready to submit?";
  }, [mode, step]);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="flex h-14 items-center gap-3 border-b border-gray-200 px-4">
        <Link href="/scout" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-gray-950">{stepTitle}</h1>
          <p className="text-xs text-gray-400">Capture first. Chat later.</p>
        </div>
      </header>

      <div className="px-4 py-5">
        <div className="mb-5 flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-indigo-600" : "bg-gray-100"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-950">How do you want to submit?</h2>
            <div className="space-y-3">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const selected = mode === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setMode(option.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left ${
                      selected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Icon size={17} />
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                    </span>
                    {selected && <Check size={16} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && mode === "voice" && (
          <section>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-center">
              <p className="text-sm font-medium text-gray-900">You have 2 minutes.</p>
              <p className="mt-1 text-xs text-gray-500">Cover the problem, product, why it is interesting, and traction.</p>
              <button
                onClick={() => setRecording((value) => !value)}
                className={`mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full ${
                  recording ? "bg-red-500 text-white" : "bg-indigo-600 text-white"
                }`}
              >
                {recording ? <Square size={24} /> : <Mic size={28} />}
              </button>
              <p className="mt-4 text-sm font-semibold text-gray-950">{recording ? "00:34 / 02:00" : "00:00 / 02:00"}</p>
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Soft indicators</p>
              <div className="grid grid-cols-2 gap-2">
                {softIndicators.map((item, index) => (
                  <div key={item} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${recording && index < 2 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                      {recording && index < 2 ? <Check size={10} /> : null}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && mode === "manual" && (
          <section className="space-y-4">
            {["Startup name", "Founder", "What are they building?", "Why is it interesting?", "Any traction?"].map((label) => (
              <label key={label} className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
                <textarea className="h-16 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400" />
              </label>
            ))}
          </section>
        )}

        {step === 2 && mode === "document" && (
          <section className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <FileUp size={28} className="mx-auto text-indigo-600" />
            <h2 className="mt-3 text-sm font-semibold text-gray-950">Upload a deck, PDF, screenshot, or note</h2>
            <p className="mt-1 text-xs text-gray-500">The demo will extract a FlowOps-style submission from the file.</p>
            <button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Choose file</button>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-lg border border-gray-200 p-4">
            <h2 className="mb-4 text-sm font-semibold text-gray-950">Review Your Submission</h2>
            <div className="space-y-3 text-sm">
              <Field label="Startup" value="FlowOps" />
              <Field label="Founder" value="Rohan" />
              <Field label="What it does" value="AI agents for logistics dispatch" />
              <Field label="Why interesting" value="Technical founder, 3 pilots" />
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-amber-700">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {["Deck", "Founder intro", "Pilot customers"].map((item) => (
                  <span key={item} className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">{item}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-950">Quick questions</h2>
            <div className="space-y-3">
              {["Do you know the founder's background?", "Who are the pilot customers?", "How big is the opportunity?"].map((question, index) => (
                <div key={question} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm text-gray-800">{index + 1}. {question}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">Text</button>
                    <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">Voice</button>
                    <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">Skip</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-950">Your Personal Notes</h2>
            <p className="mb-4 text-sm text-gray-500">Optional thoughts for Quanta that may not fit the structured fields.</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="rounded-lg border border-gray-200 p-4 text-sm font-medium text-gray-700">
                <Mic size={18} className="mb-3 text-indigo-600" />
                Record Note
              </button>
              <button className="rounded-lg border border-gray-200 p-4 text-sm font-medium text-gray-700">
                <PencilLine size={18} className="mb-3 text-indigo-600" />
                Write Notes
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="rounded-lg border border-gray-200 p-5 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={22} />
            </div>
            <h2 className="text-xl font-semibold text-gray-950">Ready to submit?</h2>
            <p className="mt-2 text-sm text-gray-500">FlowOps, AI logistics agents, with deck and pilot details marked as missing.</p>
            <Link
              href="/startups/flowops"
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white"
            >
              <Send size={15} />
              Submit to Quanta
            </Link>
          </section>
        )}

        {step < 6 && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              disabled={step === 1}
              className="h-10 flex-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={() => setStep((value) => Math.min(6, value + 1))}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-gray-400">{label}</span>
      <span className="max-w-[62%] text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}
